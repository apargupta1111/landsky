/**
 * In-Memory Color State Store
 * 
 * Tracks the last color temperature command sent to each device.
 * Since the light hardware does not report its color state via telemetry,
 * we persist the last-sent command here so the frontend can read it back.
 * 
 * Values: "warm" (0x6F) or "white" (0x70)
 */

// deviceId -> { color: "warm"|"white", ts: timestamp }
const store = {};

/**
 * Record a color command for a device.
 * @param {string} deviceId - e.g. "streetlight-01"
 * @param {"warm"|"white"} color
 */
function setColor(deviceId, color) {
  const key = deviceId.replace(/-/g, "");
  store[key] = {
    device_id: deviceId,
    color,
    ts: Date.now(),
  };
}

/**
 * Get the last-known color for a specific device.
 * @param {string} deviceId
 * @returns {{ device_id: string, color: "warm"|"white", ts: number } | null}
 */
function getColor(deviceId) {
  const key = deviceId.replace(/-/g, "");
  return store[key] || null;
}

/**
 * Get color state for all devices.
 * @returns {object} - keyed by normalized device ID
 */
function getAllColors() {
  return { ...store };
}

module.exports = {
  setColor,
  getColor,
  getAllColors,
};
