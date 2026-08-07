/**
 * In-Memory Telemetry Store (with DB fallback)
 * 
 * Stores the latest telemetry data received via MQTT from TTS uplinks.
 * Each device gets its own entry keyed by device ID.
 * 
 * On startup, loadFromDb() pre-populates from light_status so data
 * survives server restarts.
 */

const pool = require("../config/db");

// deviceId -> { brightness_percent, output_current_mA, ... , ts }
const store = {};

function initTelemetryStore() {
  console.log("📦 Telemetry store initialized");
}

/**
 * Load persisted telemetry from the light_status table into the in-memory store.
 * Call this on server startup before MQTT connects.
 */
async function loadFromDb() {
  try {
    const result = await pool.query(`
      SELECT l.name AS device_id,
             ls.brightness_percent,
             ls.fault_status,
             ls.input_current_mA,
             ls.input_frequency_Hz,
             ls.input_power_W,
             ls.input_voltage_V,
             ls.internal_temp_C,
             ls.lamp_on_time_hours,
             ls.led_mode,
             ls.led_power_W,
             ls.operating_time_hours,
             ls.output_current_mA,
             ls.output_voltage_V,
             ls.power_factor,
             ls.relay_state
      FROM light_status ls
      JOIN lights l ON l.id = ls.light_id
    `);

    for (const row of result.rows) {
      if (!row.device_id) continue;

      const key = row.device_id.replace(/-/g, "");
      store[key] = {
        brightness_percent: row.brightness_percent,
        output_current_mA: row.output_current_ma,
        output_voltage_V: row.output_voltage_v,
        led_power_W: row.led_power_w,
        input_current_mA: row.input_current_ma,
        input_voltage_V: row.input_voltage_v,
        input_power_W: row.input_power_w,
        input_frequency_Hz: row.input_frequency_hz,
        internal_temp_C: row.internal_temp_c,
        lamp_on_time_hours: row.lamp_on_time_hours,
        operating_time_hours: row.operating_time_hours,
        power_factor: row.power_factor ? parseFloat(row.power_factor) : null,
        fault_status: row.fault_status,
        led_mode: row.led_mode,
        relay_state: row.relay_state,
        ts: Date.now(),
        device_id: row.device_id,
      };
    }

    console.log(`📦 Loaded ${result.rows.length} device(s) from light_status into memory`);
  } catch (err) {
    console.error("⚠️  Failed to load telemetry from DB (table may not exist yet):", err.message);
  }
}

/**
 * Update telemetry for a device.
 * @param {string} deviceId - e.g. "streetlight01" or "streetlight-01"
 * @param {object} data - parsed telemetry payload
 */
function updateTelemetry(deviceId, data) {
  // Normalize device ID: remove hyphens for consistency
  const key = deviceId.replace(/-/g, "");
  store[key] = {
    ...data,
    ts: Date.now(),
    device_id: deviceId,
  };
}

/**
 * Get latest telemetry for a specific device.
 * @param {string} deviceId - e.g. "streetlight01" or "streetlight-01"
 * @returns {object|null}
 */
function getTelemetry(deviceId) {
  const key = deviceId.replace(/-/g, "");
  return store[key] || null;
}

/**
 * Get telemetry for all devices.
 * @returns {object}
 */
function getAllTelemetry() {
  return { ...store };
}

/**
 * Get the list of all device IDs that have telemetry.
 * @returns {string[]}
 */
function getDeviceIds() {
  return Object.keys(store);
}

module.exports = {
  initTelemetryStore,
  loadFromDb,
  updateTelemetry,
  getTelemetry,
  getAllTelemetry,
  getDeviceIds,
};
