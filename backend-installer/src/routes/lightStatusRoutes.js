/**
 * Light Status Routes — read telemetry snapshots from light_status table.
 */

const express = require("express");
const pool = require("../config/db");

const router = express.Router();

// ── GET /api/light-status ────────────────────────────────────────────────────

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ls.*, l.name AS light_name, l.serial_number
      FROM light_status ls
      JOIN lights l ON l.id = ls.light_id
      ORDER BY ls.light_id
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("❌ List light status error:", err.message);
    res.status(500).json({ error: "Failed to list light status" });
  }
});

// ── GET /api/light-status/:lightId ───────────────────────────────────────────

router.get("/:lightId", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ls.*, l.name AS light_name, l.serial_number
      FROM light_status ls
      JOIN lights l ON l.id = ls.light_id
      WHERE ls.light_id = $1
    `, [req.params.lightId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No status found for this light" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Get light status error:", err.message);
    res.status(500).json({ error: "Failed to get light status" });
  }
});

module.exports = router;
