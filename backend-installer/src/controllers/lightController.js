/**
 * Light Controller — Full CRUD with joined light_status data.
 */

const pool = require("../config/db");

// ── GET all lights with status ───────────────────────────────────────────────

const getAllLights = async (req, res) => {
  try {
    const result = await pool.query(`
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

    res.json(result.rows);
  } catch (err) {
    console.error("❌ getAllLights error:", err.message);
    res.status(500).json({ error: "Failed to fetch lights" });
  }
};

// ── GET single light by ID ──────────────────────────────────────────────────

const getLightById = async (req, res) => {
  try {
    const result = await pool.query(`
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
      WHERE l.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Light not found" });
    }

    res.json(result.rows[0]);
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
    // Use req.user.id as fallback for installer and user_id
    const installerId = installer || (req.user && req.user.id) || 1;
    const userId = user_id || (req.user && req.user.id) || 1;

    const result = await pool.query(`
      INSERT INTO lights (name, serial_number, pole_number, latitude, longitude, installer, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      name || null,
      serial_number,
      pole_number || "0000",
      latitude,
      longitude,
      installerId,
      userId,
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") { // unique violation
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
    let idx = 1;

    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
    if (serial_number !== undefined) { fields.push(`serial_number = $${idx++}`); values.push(serial_number); }
    if (pole_number !== undefined) { fields.push(`pole_number = $${idx++}`); values.push(pole_number); }
    if (latitude !== undefined) { fields.push(`latitude = $${idx++}`); values.push(latitude); }
    if (longitude !== undefined) { fields.push(`longitude = $${idx++}`); values.push(longitude); }
    if (connection_status !== undefined) { fields.push(`connection_status = $${idx++}`); values.push(connection_status); }
    if (fault_status !== undefined) { fields.push(`fault_status = $${idx++}`); values.push(fault_status); }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.params.id);

    const result = await pool.query(
      `UPDATE lights SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Light not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
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
    const result = await pool.query(`
      UPDATE lights
      SET latitude = $1, longitude = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [latitude, longitude, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Light not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ patchLightLocation error:", err.message);
    res.status(500).json({ error: "Failed to update light location" });
  }
};

// ── DELETE light ─────────────────────────────────────────────────────────────

const deleteLight = async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM lights WHERE id = $1 RETURNING id, name, serial_number",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Light not found" });
    }

    res.json({ ok: true, deleted: result.rows[0] });
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