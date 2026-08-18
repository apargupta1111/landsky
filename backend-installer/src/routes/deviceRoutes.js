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
const { authenticate } = require("../middleware/auth");

/**
 * GET /api/devices
 * Returns all lights from the database, formatted like TTS devices were.
 */
router.get("/", authenticate, async (req, res) => {
  try {
    let query = `
      SELECT l.*,
             g.name AS gateway_name,
             g.eui AS gateway_eui,
             ls.brightness_percent,
             ls.led_mode,
             ls.relay_state,
             ls.total_power_saved_kwh
      FROM lights l
      LEFT JOIN light_status ls ON ls.light_id = l.id
      LEFT JOIN gateways g ON l.gateway_id = g.id
    `;
    const values = [];

    // Find the main organization ID (the Main User)
    const mainUserId = req.user.parent_id === null ? req.user.id : req.user.parent_id;

    // Filter by user role
    if (req.user.role === 'user') {
      // Users (main or sub) see all lights owned by their organization
      query += ` WHERE l.user_id = ?`;
      values.push(mainUserId);
    } else if (req.user.role === 'installer') {
      // Installers only see the lights they physically installed
      query += ` WHERE l.installer = ?`;
      values.push(req.user.id);
    }
    // superadmin sees all

    query += ` ORDER BY l.id`;

    const [rows] = await pool.query(query, values);

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
      gatewayId: row.gateway_id,
      gatewayEui: row.gateway_eui,
      gatewayName: row.gateway_name,
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
             g.name AS gateway_name,
             g.eui AS gateway_eui,
             ls.brightness_percent,
             ls.led_mode,
             ls.relay_state,
             ls.total_power_saved_kwh
      FROM lights l
      LEFT JOIN light_status ls ON ls.light_id = l.id
      LEFT JOIN gateways g ON l.gateway_id = g.id
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
      gatewayId: row.gateway_id,
      gatewayName: row.gateway_name,
    });
  } catch (err) {
    console.error("❌ Error getting device:", err.message);
    res.status(500).json({ error: "Failed to fetch device from database" });
  }
});

module.exports = router;