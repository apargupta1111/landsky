/**
 * Device Routes — reads device info from the lights DB table.
 * Replaces direct TTS API queries.
 * 
 * Maintains the same response shape as before so the frontend doesn't break.
 * Converted for MySQL (using mysql2/promise).
 */

const express = require("express");
const router = express.Router();
const pool = require("../config/db");

/**
 * GET /api/devices
 * Returns all lights from the database, formatted like TTS devices were.
 */
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT l.*,
             ls.brightness_percent,
             ls.led_mode,
             ls.relay_state,
             ls.total_power_saved_kwh
      FROM lights l
      LEFT JOIN light_status ls ON ls.light_id = l.id
      ORDER BY l.id
    `);

    // Transform DB row format to the frontend-friendly format
    // (same shape the old TTS-based route returned)
    const formatted = rows.map((row) => ({
      id: row.name || `light-${row.id}`,
      name: row.name || `Light ${row.id}`,
      description: "",
      devEui: row.serial_number || "",
      joinEui: "",
      address: "",
      lat: parseFloat(row.latitude) || 0,
      lng: parseFloat(row.longitude) || 0,
      ttsDeviceId: row.name || `light-${row.id}`,
      createdAt: row.created_at || "",
      updatedAt: row.updated_at || "",
      // Extra DB fields
      dbId: row.id,
      serialNumber: row.serial_number,
      poleNumber: row.pole_number,
      connectionStatus: row.connection_status,
      faultStatus: row.fault_status,
      lastSeenTime: row.last_seen_time,
      totalPowerSavedKwh: parseFloat(row.total_power_saved_kwh) || 0,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("❌ Error listing devices:", err.message);
    res.status(500).json({ error: "Failed to fetch devices from database" });
  }
});

/**
 * GET /api/devices/:deviceId
 * Returns details for a specific device by name.
 */
router.get("/:deviceId", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT l.*,
             ls.brightness_percent,
             ls.led_mode,
             ls.relay_state,
             ls.total_power_saved_kwh
      FROM lights l
      LEFT JOIN light_status ls ON ls.light_id = l.id
      WHERE l.name = ?
    `, [req.params.deviceId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Device not found" });
    }

    const row = rows[0];
    res.json({
      id: row.name || `light-${row.id}`,
      name: row.name || `Light ${row.id}`,
      description: "",
      devEui: row.serial_number || "",
      joinEui: "",
      ttsDeviceId: row.name || `light-${row.id}`,
      dbId: row.id,
      serialNumber: row.serial_number,
      poleNumber: row.pole_number,
      connectionStatus: row.connection_status,
      faultStatus: row.fault_status,
      lastSeenTime: row.last_seen_time,
      totalPowerSavedKwh: parseFloat(row.total_power_saved_kwh) || 0,
      lat: parseFloat(row.latitude) || 0,
      lng: parseFloat(row.longitude) || 0,
    });
  } catch (err) {
    console.error("❌ Error getting device:", err.message);
    res.status(500).json({ error: "Failed to fetch device from database" });
  }
});

module.exports = router;