/**
 * Schedule Routes — CRUD for schedules table.
 */

const express = require("express");
const pool = require("../config/db");

const router = express.Router();

// ── GET /api/schedules ───────────────────────────────────────────────────────

router.get("/", async (req, res) => {
  try {
    const { light_id, is_active } = req.query;

    let query = "SELECT * FROM schedules WHERE deleted_at IS NULL";
    const values = [];

    if (light_id) {
      query += ` AND light = ?`;
      values.push(light_id);
    }
    if (is_active !== undefined) {
      query += ` AND is_active = ?`;
      values.push(is_active === "true");
    }

    query += " ORDER BY id";

    const [rows] = await pool.query(query, values);
    res.json(rows);
  } catch (err) {
    console.error("❌ List schedules error:", err.message);
    res.status(500).json({ error: "Failed to list schedules" });
  }
});

// ── GET /api/schedules/:id ───────────────────────────────────────────────────

router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM schedules WHERE id = ? AND deleted_at IS NULL",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Get schedule error:", err.message);
    res.status(500).json({ error: "Failed to get schedule" });
  }
});

// ── POST /api/schedules ─────────────────────────────────────────────────────

router.post("/", async (req, res) => {
  const { light, is_periodic, start_time, stop_time, days_of_week, is_active } = req.body;

  if (!light || !start_time || !stop_time) {
    return res.status(400).json({ error: "light, start_time, and stop_time are required" });
  }

  try {
    const [result] = await pool.query(`
      INSERT INTO schedules (light, is_periodic, start_time, stop_time, days_of_week, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      light,
      is_periodic || "daily",
      start_time,
      stop_time,
      days_of_week ? JSON.stringify(days_of_week) : null,
      is_active !== undefined ? is_active : true,
    ]);

    const [newSchedule] = await pool.query("SELECT * FROM schedules WHERE id = ?", [result.insertId]);
    res.status(201).json(newSchedule[0]);
  } catch (err) {
    console.error("❌ Create schedule error:", err.message);
    res.status(500).json({ error: "Failed to create schedule" });
  }
});

// ── PUT /api/schedules/:id ──────────────────────────────────────────────────

router.put("/:id", async (req, res) => {
  const { is_periodic, start_time, stop_time, days_of_week, is_active } = req.body;

  try {
    const fields = [];
    const values = [];

    if (is_periodic !== undefined) { fields.push(`is_periodic = ?`); values.push(is_periodic); }
    if (start_time !== undefined) { fields.push(`start_time = ?`); values.push(start_time); }
    if (stop_time !== undefined) { fields.push(`stop_time = ?`); values.push(stop_time); }
    if (days_of_week !== undefined) { fields.push(`days_of_week = ?`); values.push(JSON.stringify(days_of_week)); }
    if (is_active !== undefined) { fields.push(`is_active = ?`); values.push(is_active); }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.params.id);

    const [result] = await pool.query(
      `UPDATE schedules SET ${fields.join(", ")} WHERE id = ? AND deleted_at IS NULL`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    const [updatedSchedule] = await pool.query("SELECT * FROM schedules WHERE id = ?", [req.params.id]);
    res.json(updatedSchedule[0]);
  } catch (err) {
    console.error("❌ Update schedule error:", err.message);
    res.status(500).json({ error: "Failed to update schedule" });
  }
});

// ── DELETE /api/schedules/:id (soft delete) ──────────────────────────────────

router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query(
      "UPDATE schedules SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    res.json({ ok: true, deleted_id: req.params.id });
  } catch (err) {
    console.error("❌ Delete schedule error:", err.message);
    res.status(500).json({ error: "Failed to delete schedule" });
  }
});

module.exports = router;
