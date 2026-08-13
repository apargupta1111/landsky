/**
 * Control Routes — handles streetlight control commands.
 * 
 * Receives commands from the frontend and sends downlink payloads
 * directly to TTS via the Application Server API.
 * 
 * Now also logs every command to light_action_logs in the database.
 * Converted for MySQL (using mysql2/promise).
 */

const express = require("express");
const router = express.Router();
const { sendDownlink } = require("../services/ttsApiService");
const { setTargetCommand } = require("../services/commandStore");
const pool = require("../config/db");

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
const WARM_LIGHT_HEX = "6F"; // warm CCT colour
const WHITE_LIGHT_HEX = "70"; // white CCT colour

/**
 * Log an action to light_action_logs (async, fire-and-forget).
 */
async function logAction(deviceId, action, dimValue, color = null) {
  try {
    // Look up the light's DB id by name
    const [rows] = await pool.query(
      "SELECT id FROM lights WHERE name = ?",
      [deviceId]
    );

    if (rows.length === 0) return; // device not in DB

    const lightId = rows[0].id;

    const [existing] = await pool.query("SELECT id FROM light_action_logs WHERE light_id = ?", [lightId]);
    if (existing.length > 0) {
      await pool.query(
        "UPDATE light_action_logs SET action = ?, dim_value = COALESCE(?, dim_value), color = COALESCE(?, color), created_at = CURRENT_TIMESTAMP WHERE light_id = ?",
        [action, dimValue, color, lightId]
      );
    } else {
      await pool.query(
        "INSERT INTO light_action_logs (light_id, action, dim_value, color) VALUES (?, ?, ?, ?)",
        [lightId, action, dimValue, color]
      );
    }
  } catch (err) {
    console.error(`⚠️  Failed to log action for ${deviceId}:`, err.message);
  }
}

/**
 * POST /smartlight/control
 * Body: { device_id, topic, method, value }
 * 
 * method: setDimming | setMaxCurrent | powerOn | powerOff | resetDriver | setWarmLight | setWhiteLight
 */
router.post("/control", async (req, res) => {
  const { device_id, method, value } = req.body;

  if (!device_id || !method) {
    return res.status(400).json({ error: "device_id and method are required" });
  }

  console.log(`🎮 Control command: ${method} for ${device_id} (value: ${value})`);

  let hexPayload;
  let dimValue = null;
  let colorValue = null;

  switch (method) {
    case "setDimming":
      hexPayload = encodeBrightness(value || 0);
      dimValue = Math.max(0, Math.min(100, Math.round(value || 0)));
      break;
    case "setMaxCurrent":
      hexPayload = encodeBrightness(value || 100);
      dimValue = Math.max(0, Math.min(100, Math.round(value || 100)));
      break;
    case "powerOn":
      hexPayload = POWER_ON_HEX;
      dimValue = 100;
      break;
    case "powerOff":
      hexPayload = POWER_OFF_HEX;
      dimValue = 0;
      break;
    case "resetDriver":
      hexPayload = POWER_OFF_HEX; // reset = turn off
      dimValue = 0;
      break;
    case "setWarmLight":
      hexPayload = WARM_LIGHT_HEX;
      colorValue = "warm";
      break;
    case "setWhiteLight":
      hexPayload = WHITE_LIGHT_HEX;
      colorValue = "white";
      break;
    default:
      return res.status(400).json({ error: `Unknown method: ${method}` });
  }

  try {
    // Send the downlink via TTS API
    await sendDownlink(device_id, hexPayload, 1);
    console.log(`✅ Downlink sent: ${device_id} → 0x${hexPayload} (${parseInt(hexPayload, 16)}%)`);

    // Log the action to the database (fire-and-forget)
    logAction(device_id, method, dimValue, colorValue);

    // Persist target for retries — brightness commands track brightness,
    // colour commands track expected led_mode (warm → 'yellow', white → 'white').
    if (method === "setDimming") {
      const expectedBrightness = Math.max(0, Math.min(100, Math.round(value || 0)));
      setTargetCommand(device_id, method, expectedBrightness, hexPayload, null);
    } else if (method === "powerOn") {
      setTargetCommand(device_id, method, 100, hexPayload, null);
    } else if (method === "powerOff" || method === "resetDriver") {
      setTargetCommand(device_id, method, 0, hexPayload, null);
    } else if (method === "setWarmLight") {
      // led_mode reports 'yellow' when warm is active
      setTargetCommand(device_id, method, null, hexPayload, "yellow");
    } else if (method === "setWhiteLight") {
      setTargetCommand(device_id, method, null, hexPayload, "white");
    }

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

// ── Color State Endpoints ────────────────────────────────────────────────────

/**
 * GET /smartlight/color-state
 * Returns the last-known color temperature for ALL devices.
 */
router.get("/color-state", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT l.name AS device_id, a.color, a.created_at AS ts 
      FROM light_action_logs a
      JOIN lights l ON l.id = a.light_id
      WHERE a.color IS NOT NULL
    `);
    
    const result = {};
    rows.forEach(r => {
      result[r.device_id] = { device_id: r.device_id, color: r.color, ts: new Date(r.ts).getTime() };
    });
    res.json(result);
  } catch (err) {
    console.error("Failed to fetch color state:", err);
    res.status(500).json({ error: "Failed to fetch colors" });
  }
});

/**
 * GET /smartlight/:deviceId/color-state
 * Returns the last-known color temperature for a specific device.
 */
router.get("/:deviceId/color-state", async (req, res) => {
  const { deviceId } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT a.color, a.created_at AS ts 
      FROM light_action_logs a
      JOIN lights l ON l.id = a.light_id
      WHERE l.name = ? AND a.color IS NOT NULL
      ORDER BY a.created_at DESC LIMIT 1
    `, [deviceId]);

    if (rows.length === 0) {
      return res.json({ device_id: deviceId, color: "white", ts: null });
    }

    res.json({
      device_id: deviceId,
      color: rows[0].color,
      ts: new Date(rows[0].ts).getTime()
    });
  } catch (err) {
    console.error(`Failed to fetch color for ${deviceId}:`, err);
    res.status(500).json({ error: "Failed to fetch color" });
  }
});

module.exports = router;