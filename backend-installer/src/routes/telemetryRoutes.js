/**
 * Telemetry Routes — serves cached telemetry data from the in-memory store.
 * 
 * Replaces Node-RED endpoints:
 *   GET /smartlight/data              → latest telemetry (first device or all)
 *   GET /smartlight/:deviceId/data    → telemetry for a specific device
 */

const express = require("express");
const router = express.Router();
const { getTelemetry, getAllTelemetry, getDeviceIds } = require("../services/telemetryStore");

/**
 * GET /smartlight/data
 * Returns telemetry for the first available device (backward compat with Node-RED).
 */
router.get("/data", (req, res) => {
  const allData = getAllTelemetry();
  const deviceIds = getDeviceIds();

  if (deviceIds.length === 0) {
    // No telemetry received yet — return 204 like Node-RED did
    return res.status(204).end();
  }

  // Return first device's data for backward compatibility
  const firstDeviceData = allData[deviceIds[0]];
  res.json(firstDeviceData);
});

/**
 * GET /smartlight/all-data
 * Returns telemetry for ALL devices.
 */
router.get("/all-data", (req, res) => {
  const allData = getAllTelemetry();
  res.json(allData);
});

/**
 * GET /smartlight/:deviceId/data
 * Returns telemetry for a specific device.
 */
router.get("/:deviceId/data", (req, res) => {
  const { deviceId } = req.params;
  const data = getTelemetry(deviceId);

  if (!data) {
    return res.status(204).end(); // No data yet
  }

  res.json(data);
});

module.exports = router;
