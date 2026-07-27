/**
 * MQTT Service — subscribes to TTS uplink topics for live telemetry.
 * 
 * TTS publishes uplink messages on:
 *   v3/{app_id}@{tenant_id}/devices/{device_id}/up
 * 
 * We parse the decoded_payload from the uplink and store it in the 
 * telemetry store for the REST API to serve.
 */

const mqtt = require("mqtt");
const { updateTelemetry } = require("./telemetryStore");
const { getTargetCommand, clearTargetCommand, incrementRetry } = require("./commandStore");
const { sendDownlink } = require("./ttsApiService");

let client = null;

function initMqttClient() {
  const host = process.env.TTS_MQTT_HOST || "13.205.43.53";
  const port = process.env.TTS_MQTT_PORT || "1883";
  const username = process.env.TTS_MQTT_USERNAME || "";
  const password = process.env.TTS_MQTT_PASSWORD || "";

  const url = `mqtt://${host}:${port}`;

  console.log(`🔌 Connecting to MQTT broker: ${url}`);
  console.log(`   Username: ${username}`);

  client = mqtt.connect(url, {
    username,
    password,
    clientId: `smartlight-backend-${Date.now()}`,
    clean: true,
    connectTimeout: 10000,
    reconnectPeriod: 5000,
  });

  client.on("connect", () => {
    console.log("✅ MQTT connected to TTS broker");

    // Subscribe to all device uplinks for our application
    // TTS topic format: v3/{app_id}@{tenant_id}/devices/+/up
    const appId = process.env.TTS_APP_ID || "hbeon-app-001";
    const topic = `v3/${username}/devices/+/up`;
    
    client.subscribe(topic, { qos: 0 }, (err) => {
      if (err) {
        console.error("❌ MQTT subscribe error:", err.message);
      } else {
        console.log(`📡 Subscribed to: ${topic}`);
      }
    });
  });

  client.on("message", (topic, message) => {
    try {
      const payload = JSON.parse(message.toString());
      
      // Extract device ID from topic: v3/.../devices/{deviceId}/up
      const topicParts = topic.split("/");
      const deviceIdx = topicParts.indexOf("devices");
      const deviceId = deviceIdx >= 0 ? topicParts[deviceIdx + 1] : "unknown";

      // Extract the decoded payload from uplink message
      const uplinkMsg = payload.uplink_message;
      if (!uplinkMsg) {
        console.log(`⚠️  No uplink_message in message for ${deviceId}`);
        return;
      }

      // Try decoded_payload first, then fall back to raw frm_payload
      let telemetryData = {};

      if (uplinkMsg.decoded_payload) {
        telemetryData = parseDecodedPayload(uplinkMsg.decoded_payload);
      } else if (uplinkMsg.frm_payload) {
        // Raw base64 payload — parse the MS51 driver response
        telemetryData = parseRawPayload(uplinkMsg.frm_payload);
      }

      // Add radio metadata
      if (uplinkMsg.rx_metadata && uplinkMsg.rx_metadata.length > 0) {
        const rx = uplinkMsg.rx_metadata[0];
        telemetryData.rssi = rx.rssi;
        telemetryData.snr = rx.snr;
      }

      // Add f_port for reference
      telemetryData.f_port = uplinkMsg.f_port;

      console.log(`📨 Telemetry [${deviceId}]:`, JSON.stringify(telemetryData).slice(0, 120));
      updateTelemetry(deviceId, telemetryData);

      // ── Command verification & retry ────────────────────────────────────────
      const target = getTargetCommand(deviceId);
      if (target) {
        const maxRetries = 3;

        // --- Case 1: brightness-based commands (dimming / on / off) ---
        if (target.expectedBrightness !== null && telemetryData.brightness_percent !== undefined && telemetryData.brightness_percent !== null) {
          if (Math.abs(telemetryData.brightness_percent - target.expectedBrightness) > 1) {
            if (target.retryCount < maxRetries) {
              console.log(`⚠️  Brightness mismatch for ${deviceId}: got ${telemetryData.brightness_percent}%, expected ${target.expectedBrightness}%. Resending... (attempt ${target.retryCount + 1})`);
              incrementRetry(deviceId);
              sendDownlink(deviceId, target.hexPayload, 1).catch(err => console.error(`❌ Retry downlink error for ${deviceId}:`, err.response?.data || err.message));
            } else {
              console.log(`❌ Max retries reached for ${deviceId} (brightness). Giving up.`);
              clearTargetCommand(deviceId);
            }
          } else {
            console.log(`✅ Brightness confirmed ${target.expectedBrightness}% for ${deviceId}.`);
            clearTargetCommand(deviceId);
          }

        // --- Case 2: colour-based commands (warm / white) ---
        } else if (target.expectedColor !== null && telemetryData.led_mode !== undefined && telemetryData.led_mode !== null) {
          if (telemetryData.led_mode !== target.expectedColor) {
            if (target.retryCount < maxRetries) {
              console.log(`⚠️  LED mode mismatch for ${deviceId}: got '${telemetryData.led_mode}', expected '${target.expectedColor}'. Resending... (attempt ${target.retryCount + 1})`);
              incrementRetry(deviceId);
              sendDownlink(deviceId, target.hexPayload, 1).catch(err => console.error(`❌ Retry downlink error for ${deviceId}:`, err.response?.data || err.message));
            } else {
              console.log(`❌ Max retries reached for ${deviceId} (colour). Giving up.`);
              clearTargetCommand(deviceId);
            }
          } else {
            console.log(`✅ LED mode confirmed '${target.expectedColor}' for ${deviceId}.`);
            clearTargetCommand(deviceId);
          }
        }
      }

    } catch (err) {
      console.error("❌ MQTT message parse error:", err.message);
    }
  });

  client.on("error", (err) => {
    console.error("❌ MQTT error:", err.message);
  });

  client.on("reconnect", () => {
    console.log("🔄 MQTT reconnecting...");
  });

  client.on("close", () => {
    console.log("🔌 MQTT connection closed");
  });
}

/**
 * Parse the TTS decoded_payload into our telemetry format.
 * The payload decoder on TTS should output fields like:
 *   brightness_percent, output_current_mA, output_voltage_V, led_power_W, etc.
 */
function parseDecodedPayload(decoded) {
  return {
    brightness_percent: decoded.brightness_percent ?? decoded.brightness ?? null,
    output_current_mA: decoded.output_current_mA ?? decoded.outputCurrent ?? null,
    output_voltage_V: decoded.output_voltage_V ?? decoded.outputVoltage ?? null,
    led_power_W: decoded.led_power_W ?? decoded.ledPower ?? null,
    input_current_mA: decoded.input_current_mA ?? decoded.inputCurrent ?? null,
    input_voltage_V: decoded.input_voltage_V ?? decoded.inputVoltage ?? null,
    input_power_W: decoded.input_power_W ?? decoded.inputPower ?? null,
    input_frequency_Hz: decoded.input_frequency_Hz ?? decoded.inputFrequency ?? null,
    internal_temp_C: decoded.internal_temp_C ?? decoded.internalTemp ?? null,
    lamp_on_time_hours: decoded.lamp_on_time_hours ?? decoded.lampOnTime ?? null,
    operating_time_hours: decoded.operating_time_hours ?? decoded.operatingTime ?? null,
    power_factor: decoded.power_factor ?? decoded.powerFactor ?? null,
    fault_status: decoded.fault_status ?? decoded.faultStatus ?? null,
    led_mode: decoded.led_mode ?? null,          // 'yellow' = warm | 'white' = white
    relay_state: decoded.relay_state ?? null,
  };
}

/**
 * Parse raw base64 frm_payload from the MS51 LED driver.
 * The MS51 driver uplink format (on fPort 1):
 *   Byte 0:     Brightness (0–200, maps to 0–100%)
 *   Byte 1-2:   Output current (mA, big-endian uint16)
 *   Byte 3-4:   Output voltage (0.1V, big-endian uint16)
 *   Byte 5-6:   LED power (0.1W, big-endian uint16)
 *   Byte 7-8:   Input current (mA, big-endian uint16)
 *   Byte 9-10:  Input voltage (0.1V, big-endian uint16)
 *   Byte 11-12: Input power (0.1W, big-endian uint16)
 *   Byte 13-14: Input frequency (0.1Hz, big-endian uint16)
 *   Byte 15:    Internal temp (°C, int8)
 *   Byte 16-17: Lamp-on time (hours, big-endian uint16)
 *   Byte 18-19: Operating time (hours, big-endian uint16)
 *   Byte 20:    Power factor (0.01 units, uint8)
 *   Byte 21:    Fault status bitmask
 */
function parseRawPayload(base64Str) {
  try {
    const buf = Buffer.from(base64Str, "base64");
    if (buf.length < 10) {
      return { raw: base64Str, parseError: "Payload too short" };
    }

    const brightness = buf.length > 0 ? (buf[0] / 2) : null;          // 0-200 → 0-100%
    const outCurrent = buf.length > 2 ? buf.readUInt16BE(1) : null;
    const outVoltage = buf.length > 4 ? buf.readUInt16BE(3) / 10 : null;
    const ledPower   = buf.length > 6 ? buf.readUInt16BE(5) / 10 : null;
    const inCurrent  = buf.length > 8 ? buf.readUInt16BE(7) : null;
    const inVoltage  = buf.length > 10 ? buf.readUInt16BE(9) / 10 : null;
    const inPower    = buf.length > 12 ? buf.readUInt16BE(11) / 10 : null;
    const inFreq     = buf.length > 14 ? buf.readUInt16BE(13) / 10 : null;
    const temp       = buf.length > 15 ? buf.readInt8(15) : null;
    const lampTime   = buf.length > 17 ? buf.readUInt16BE(16) : null;
    const opTime     = buf.length > 19 ? buf.readUInt16BE(18) : null;
    const pf         = buf.length > 20 ? buf[20] / 100 : null;
    const fault      = buf.length > 21 ? buf[21] : null;

    return {
      brightness_percent: brightness,
      output_current_mA: outCurrent,
      output_voltage_V: outVoltage,
      led_power_W: ledPower,
      input_current_mA: inCurrent,
      input_voltage_V: inVoltage,
      input_power_W: inPower,
      input_frequency_Hz: inFreq,
      internal_temp_C: temp,
      lamp_on_time_hours: lampTime,
      operating_time_hours: opTime,
      power_factor: pf,
      fault_status: fault !== null ? String(fault) : null,
    };
  } catch (err) {
    return { raw: base64Str, parseError: err.message };
  }
}

function getMqttClient() {
  return client;
}

module.exports = {
  initMqttClient,
  getMqttClient,
};
