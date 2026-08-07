/**
 * Alert Routes — CRUD for alerts table.
 */

const express = require("express");
const pool = require("../config/db");

const router = express.Router();

// ── GET /api/alerts ──────────────────────────────────────────────────────────

router.get("/", async (req, res) => {
  try {
    const { status, light_id, severity, limit } = req.query;

    let query = "SELECT * FROM alerts WHERE 1=1";
    const values = [];
    let idx = 1;

    if (status) {
      query += ` AND status = $${idx++}`;
      values.push(status);
    }
    if (light_id) {
      query += ` AND light_id = $${idx++}`;
      values.push(light_id);
    }
    if (severity) {
      query += ` AND severity = $${idx++}`;
      values.push(severity);
    }

    query += " ORDER BY created_at DESC";

    if (limit) {
      query += ` LIMIT $${idx++}`;
      values.push(parseInt(limit, 10));
    }

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ List alerts error:", err.message);
    res.status(500).json({ error: "Failed to list alerts" });
  }
});

// ── GET /api/alerts/:id ──────────────────────────────────────────────────────

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM alerts WHERE id = $1", [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Alert not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Get alert error:", err.message);
    res.status(500).json({ error: "Failed to get alert" });
  }
});

// ── POST /api/alerts ─────────────────────────────────────────────────────────

router.post("/", async (req, res) => {
  const { light_id, alert_type, severity, message, acknowledged_by, resolved_by } = req.body;

  if (!light_id || !alert_type || !severity || !message) {
    return res.status(400).json({ error: "light_id, alert_type, severity, and message are required" });
  }

  try {
    // acknowledged_by and resolved_by default to the creating user (or 1)
    const ackBy = acknowledged_by || (req.user && req.user.id) || 1;
    const resBy = resolved_by || (req.user && req.user.id) || 1;

    const result = await pool.query(`
      INSERT INTO alerts (light_id, alert_type, severity, message, acknowledged_by, resolved_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [light_id, alert_type, severity, message, ackBy, resBy]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Create alert error:", err.message);
    res.status(500).json({ error: "Failed to create alert" });
  }
});

// ── PUT /api/alerts/:id/acknowledge ──────────────────────────────────────────

router.put("/:id/acknowledge", async (req, res) => {
  try {
    const userId = (req.user && req.user.id) || req.body.user_id || 1;

    const result = await pool.query(`
      UPDATE alerts
      SET status = 'acknowledged',
          acknowledged_by = $1,
          acknowledged_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [userId, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Alert not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Acknowledge alert error:", err.message);
    res.status(500).json({ error: "Failed to acknowledge alert" });
  }
});

// ── PUT /api/alerts/:id/resolve ──────────────────────────────────────────────

router.put("/:id/resolve", async (req, res) => {
  try {
    const userId = (req.user && req.user.id) || req.body.user_id || 1;

    const result = await pool.query(`
      UPDATE alerts
      SET status = 'resolved',
          resolved_by = $1,
          resolved_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [userId, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Alert not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Resolve alert error:", err.message);
    res.status(500).json({ error: "Failed to resolve alert" });
  }
});

// ── DELETE /api/alerts/:id ───────────────────────────────────────────────────

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM alerts WHERE id = $1 RETURNING id",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Alert not found" });
    }

    res.json({ ok: true, deleted_id: result.rows[0].id });
  } catch (err) {
    console.error("❌ Delete alert error:", err.message);
    res.status(500).json({ error: "Failed to delete alert" });
  }
});

module.exports = router;
