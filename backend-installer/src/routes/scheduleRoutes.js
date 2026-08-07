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
    let idx = 1;

    if (light_id) {
      query += ` AND light = $${idx++}`;
      values.push(light_id);
    }
    if (is_active !== undefined) {
      query += ` AND is_active = $${idx++}`;
      values.push(is_active === "true");
    }

    query += " ORDER BY id";

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ List schedules error:", err.message);
    res.status(500).json({ error: "Failed to list schedules" });
  }
});

// ── GET /api/schedules/:id ───────────────────────────────────────────────────

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM schedules WHERE id = $1 AND deleted_at IS NULL",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    res.json(result.rows[0]);
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
    const result = await pool.query(`
      INSERT INTO schedules (light, is_periodic, start_time, stop_time, days_of_week, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      light,
      is_periodic || "daily",
      start_time,
      stop_time,
      days_of_week ? JSON.stringify(days_of_week) : null,
      is_active !== undefined ? is_active : true,
    ]);

    res.status(201).json(result.rows[0]);
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
    let idx = 1;

    if (is_periodic !== undefined) { fields.push(`is_periodic = $${idx++}`); values.push(is_periodic); }
    if (start_time !== undefined) { fields.push(`start_time = $${idx++}`); values.push(start_time); }
    if (stop_time !== undefined) { fields.push(`stop_time = $${idx++}`); values.push(stop_time); }
    if (days_of_week !== undefined) { fields.push(`days_of_week = $${idx++}`); values.push(JSON.stringify(days_of_week)); }
    if (is_active !== undefined) { fields.push(`is_active = $${idx++}`); values.push(is_active); }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.params.id);

    const result = await pool.query(
      `UPDATE schedules SET ${fields.join(", ")} WHERE id = $${idx} AND deleted_at IS NULL RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Update schedule error:", err.message);
    res.status(500).json({ error: "Failed to update schedule" });
  }
});

// ── DELETE /api/schedules/:id (soft delete) ──────────────────────────────────

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE schedules SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING id",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    res.json({ ok: true, deleted_id: result.rows[0].id });
  } catch (err) {
    console.error("❌ Delete schedule error:", err.message);
    res.status(500).json({ error: "Failed to delete schedule" });
  }
});

module.exports = router;
