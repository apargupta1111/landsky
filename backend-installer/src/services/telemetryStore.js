/**
 * In-Memory Telemetry Store
 * 
 * Stores the latest telemetry data received via MQTT from TTS uplinks.
 * Each device gets its own entry keyed by device ID.
 * This replaces the Node-RED telemetry caching layer.
 */

// deviceId -> { brightness_percent, output_current_mA, ... , ts }
const store = {};

function initTelemetryStore() {
  console.log("📦 Telemetry store initialized");
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
  updateTelemetry,
  getTelemetry,
  getAllTelemetry,
  getDeviceIds,
};
