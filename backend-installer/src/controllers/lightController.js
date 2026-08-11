/**
 * Light Controller — Full CRUD with joined light_status data.
 * Converted for MySQL (using mysql2/promise)
 */

const pool = require("../config/db");

// ── GET all lights with status ───────────────────────────────────────────────

const getAllLights = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT l.*,
             ls.brightness_percent,
             ls.fault_status    AS status_fault,
             ls.input_current_mA,
             ls.input_frequency_Hz,
             ls.input_power_W,
             ls.input_voltage_V,
             ls.internal_temp_AD,
             ls.internal_temp_C,
             ls.lamp_on_time_hours,
             ls.led_mode,
             ls.led_power_W,
             ls.operating_time_hours,
             ls.output_current_mA,
             ls.output_voltage_V,
             ls.power_factor,
             ls.relay_state
      FROM lights l
      LEFT JOIN light_status ls ON ls.light_id = l.id
      ORDER BY l.id
    `);

    res.json(rows);
  } catch (err) {
    console.error("❌ getAllLights error:", err.message);
    res.status(500).json({ error: "Failed to fetch lights" });
  }
};

// ── GET single light by ID ──────────────────────────────────────────────────

const getLightById = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT l.*,
             ls.brightness_percent,
             ls.fault_status    AS status_fault,
             ls.input_current_mA,
             ls.input_frequency_Hz,
             ls.input_power_W,
             ls.input_voltage_V,
             ls.internal_temp_AD,
             ls.internal_temp_C,
             ls.lamp_on_time_hours,
             ls.led_mode,
             ls.led_power_W,
             ls.operating_time_hours,
             ls.output_current_mA,
             ls.output_voltage_V,
             ls.power_factor,
             ls.relay_state
      FROM lights l
      LEFT JOIN light_status ls ON ls.light_id = l.id
      WHERE l.id = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Light not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("❌ getLightById error:", err.message);
    res.status(500).json({ error: "Failed to fetch light" });
  }
};

// ── POST create light ────────────────────────────────────────────────────────

const createLight = async (req, res) => {
  const {
    name, serial_number, pole_number,
    latitude, longitude, installer, user_id,
  } = req.body;

  if (!serial_number || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: "serial_number, latitude, and longitude are required" });
  }

  try {
    const installerId = installer || (req.user && req.user.id) || 1;
    const userId = user_id || (req.user && req.user.id) || 1;

    // MySQL doesn't support RETURNING, so we grab the insertId and SELECT it
    const normalizedName = name ? name.toLowerCase() : null;
    const [result] = await pool.query(`
      INSERT INTO lights (name, serial_number, pole_number, latitude, longitude, installer, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      normalizedName,
      serial_number,
      pole_number || "0000",
      latitude,
      longitude,
      installerId,
      userId,
    ]);

    const [newLight] = await pool.query("SELECT * FROM lights WHERE id = ?", [result.insertId]);

    res.status(201).json(newLight[0]);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY" || err.errno === 1062) { // MySQL unique violation
      return res.status(409).json({ error: "Serial number already exists" });
    }
    console.error("❌ createLight error:", err.message);
    res.status(500).json({ error: "Failed to create light" });
  }
};

// ── PUT update light ─────────────────────────────────────────────────────────

const updateLight = async (req, res) => {
  const { name, serial_number, pole_number, latitude, longitude, connection_status, fault_status } = req.body;

  try {
    const fields = [];
    const values = [];

    if (name !== undefined) { fields.push(`name = ?`); values.push(name ? name.toLowerCase() : name); }
    if (serial_number !== undefined) { fields.push(`serial_number = ?`); values.push(serial_number); }
    if (pole_number !== undefined) { fields.push(`pole_number = ?`); values.push(pole_number); }
    if (latitude !== undefined) { fields.push(`latitude = ?`); values.push(latitude); }
    if (longitude !== undefined) { fields.push(`longitude = ?`); values.push(longitude); }
    if (connection_status !== undefined) { fields.push(`connection_status = ?`); values.push(connection_status); }
    if (fault_status !== undefined) { fields.push(`fault_status = ?`); values.push(fault_status); }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.params.id);

    const [result] = await pool.query(
      `UPDATE lights SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Light not found" });
    }

    // Fetch the updated record since MySQL lacks RETURNING
    const [updatedLight] = await pool.query("SELECT * FROM lights WHERE id = ?", [req.params.id]);

    res.json(updatedLight[0]);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY" || err.errno === 1062) { 
      return res.status(409).json({ error: "Serial number already exists" });
    }
    console.error("❌ updateLight error:", err.message);
    res.status(500).json({ error: "Failed to update light" });
  }
};

// ── PATCH location only ──────────────────────────────────────────────────────

const patchLightLocation = async (req, res) => {
  const { latitude, longitude } = req.body;

  if (latitude == null || longitude == null) {
    return res.status(400).json({ error: "latitude and longitude are required" });
  }

  try {
    const [result] = await pool.query(`
      UPDATE lights
      SET latitude = ?, longitude = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [latitude, longitude, req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Light not found" });
    }

    // Fetch the updated record
    const [updatedLight] = await pool.query("SELECT * FROM lights WHERE id = ?", [req.params.id]);

    res.json(updatedLight[0]);
  } catch (err) {
    console.error("❌ patchLightLocation error:", err.message);
    res.status(500).json({ error: "Failed to update light location" });
  }
};

// ── DELETE light ─────────────────────────────────────────────────────────────

const deleteLight = async (req, res) => {
  try {
    // Select the record first so we can return the data (MySQL lacks RETURNING)
    const [rows] = await pool.query(
      "SELECT id, name, serial_number FROM lights WHERE id = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Light not found" });
    }

    await pool.query("DELETE FROM lights WHERE id = ?", [req.params.id]);

    res.json({ ok: true, deleted: rows[0] });
  } catch (err) {
    console.error("❌ deleteLight error:", err.message);
    res.status(500).json({ error: "Failed to delete light" });
  }
};

module.exports = {
  getAllLights,
  getLightById,
  createLight,
  updateLight,
  patchLightLocation,
  deleteLight,
};