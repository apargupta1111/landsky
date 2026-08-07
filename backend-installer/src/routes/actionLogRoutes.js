/**
 * Action Log Routes — Read-only access to light_action_logs.
 * Logs are created automatically by controlRoutes when commands are sent.
 */

const express = require("express");
const pool = require("../config/db");

const router = express.Router();

// ── GET /api/action-logs ─────────────────────────────────────────────────────

router.get("/", async (req, res) => {
  try {
    const { light_id, action, limit } = req.query;

    let query = "SELECT * FROM light_action_logs WHERE 1=1";
    const values = [];
    let idx = 1;

    if (light_id) {
      query += ` AND light_id = $${idx++}`;
      values.push(light_id);
    }
    if (action) {
      query += ` AND action = $${idx++}`;
      values.push(action);
    }

    query += " ORDER BY created_at DESC";

    if (limit) {
      query += ` LIMIT $${idx++}`;
      values.push(parseInt(limit, 10));
    }

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ List action logs error:", err.message);
    res.status(500).json({ error: "Failed to list action logs" });
  }
});

// ── GET /api/action-logs/:id ─────────────────────────────────────────────────

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM light_action_logs WHERE id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Action log not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Get action log error:", err.message);
    res.status(500).json({ error: "Failed to get action log" });
  }
});

module.exports = router;
