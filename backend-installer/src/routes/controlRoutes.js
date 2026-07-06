/**
 * Control Routes — handles streetlight control commands.
 * 
 * Replaces Node-RED endpoint:
 *   POST /smartlight/control
 * 
 * Receives commands from the frontend and sends downlink payloads
 * directly to TTS via the Application Server API.
 */

const express = require("express");
const router = express.Router();
const { sendDownlink } = require("../services/ttsApiService");

// ── Payload Encoders ───────────────────────────────────────────────────────────
// TTS downlink payload is a SINGLE BYTE: the brightness value (0–100 decimal).
//   0x00 = off (0%)
//   0x0A = 10%
//   0x64 = 100% (full brightness)

/** Encode brightness level (0-100) as a single hex byte */
function encodeBrightness(level) {
  const clamped = Math.max(0, Math.min(100, Math.round(level)));
  return clamped.toString(16).padStart(2, "0").toUpperCase();
}

const POWER_ON_HEX  = "64";  // 100 decimal = 100% brightness
const POWER_OFF_HEX = "00";  // 0 decimal = off

/**
 * POST /smartlight/control
 * Body: { device_id, topic, method, value }
 * 
 * method: setDimming | setMaxCurrent | powerOn | powerOff | resetDriver
 */
router.post("/control", async (req, res) => {
  const { device_id, method, value } = req.body;

  if (!device_id || !method) {
    return res.status(400).json({ error: "device_id and method are required" });
  }

  console.log(`🎮 Control command: ${method} for ${device_id} (value: ${value})`);

  let hexPayload;
  switch (method) {
    case "setDimming":
      hexPayload = encodeBrightness(value || 0);
      break;
    case "setMaxCurrent":
      hexPayload = encodeBrightness(value || 100);
      break;
    case "powerOn":
      hexPayload = POWER_ON_HEX;
      break;
    case "powerOff":
      hexPayload = POWER_OFF_HEX;
      break;
    case "resetDriver":
      hexPayload = POWER_OFF_HEX; // reset = turn off
      break;
    default:
      return res.status(400).json({ error: `Unknown method: ${method}` });
  }

  try {
    // Send the downlink via TTS API
    await sendDownlink(device_id, hexPayload, 1);
    console.log(`✅ Downlink sent: ${device_id} → 0x${hexPayload} (${parseInt(hexPayload, 16)}%)`);

    res.json({
      ok: true,
      device_id,
      method,
      hex: hexPayload,
    });
  } catch (err) {
    console.error(`❌ Downlink error for ${device_id}:`, err.response?.data || err.message);
    res.status(500).json({
      ok: false,
      error: err.response?.data?.message || err.message,
    });
  }
});

module.exports = router;
