/**
 * Device Routes — queries TTS for end device information.
 */

const express = require("express");
const router = express.Router();
const { listDevices, getDevice } = require("../services/ttsApiService");

/**
 * GET /api/devices
 * Returns all end devices registered in the TTS application.
 */
router.get("/", async (req, res) => {
  try {
    const devices = await listDevices();
    
    // Transform TTS device format to frontend-friendly format
    const formatted = devices.map((dev) => ({
      id: dev.ids?.device_id || "",
      name: dev.name || dev.ids?.device_id || "",
      description: dev.description || "",
      devEui: dev.ids?.dev_eui || "",
      joinEui: dev.ids?.join_eui || "",
      address: dev.attributes?.address || "",
      lat: parseFloat(dev.locations?.user?.latitude || 0),
      lng: parseFloat(dev.locations?.user?.longitude || 0),
      ttsDeviceId: dev.ids?.device_id || "",
      createdAt: dev.created_at || "",
      updatedAt: dev.updated_at || "",
    }));

    res.json(formatted);
  } catch (err) {
    console.error("❌ Error listing devices:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch devices from TTS" });
  }
});

/**
 * GET /api/devices/:deviceId
 * Returns details for a specific device.
 */
router.get("/:deviceId", async (req, res) => {
  try {
    const device = await getDevice(req.params.deviceId);
    res.json({
      id: device.ids?.device_id || "",
      name: device.name || "",
      description: device.description || "",
      devEui: device.ids?.dev_eui || "",
      joinEui: device.ids?.join_eui || "",
      ttsDeviceId: device.ids?.device_id || "",
    });
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ error: "Device not found" });
    }
    console.error("❌ Error getting device:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch device from TTS" });
  }
});

module.exports = router;
