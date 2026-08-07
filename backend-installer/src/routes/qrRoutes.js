/**
 * QR Code Routes — CRUD for qr table.
 */

const express = require("express");
const crypto = require("crypto");
const pool = require("../config/db");

const router = express.Router();

// ── GET /api/qr ──────────────────────────────────────────────────────────────

router.get("/", async (req, res) => {
  try {
    const { light_id } = req.query;

    let query = "SELECT * FROM qr";
    const values = [];

    if (light_id) {
      query += " WHERE light_id = $1";
      values.push(light_id);
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ List QR codes error:", err.message);
    res.status(500).json({ error: "Failed to list QR codes" });
  }
});

// ── GET /api/qr/:id ─────────────────────────────────────────────────────────

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM qr WHERE id = $1", [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "QR code not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Get QR code error:", err.message);
    res.status(500).json({ error: "Failed to get QR code" });
  }
});

// ── POST /api/qr ─────────────────────────────────────────────────────────────

router.post("/", async (req, res) => {
  const { light_id } = req.body;

  if (!light_id) {
    return res.status(400).json({ error: "light_id is required" });
  }

  try {
    // Generate a unique QR code string
    const qrCode = `LANDSKY-${light_id}-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;

    const result = await pool.query(`
      INSERT INTO qr (light_id, qr_code)
      VALUES ($1, $2)
      RETURNING *
    `, [light_id, qrCode]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Create QR code error:", err.message);
    res.status(500).json({ error: "Failed to create QR code" });
  }
});

// ── PUT /api/qr/:id/use ─────────────────────────────────────────────────────

router.put("/:id/use", async (req, res) => {
  try {
    const result = await pool.query(`
      UPDATE qr SET used_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND used_at IS NULL
      RETURNING *
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "QR code not found or already used" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Use QR code error:", err.message);
    res.status(500).json({ error: "Failed to mark QR code as used" });
  }
});

// ── DELETE /api/qr/:id ───────────────────────────────────────────────────────

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM qr WHERE id = $1 RETURNING id, qr_code",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "QR code not found" });
    }

    res.json({ ok: true, deleted: result.rows[0] });
  } catch (err) {
    console.error("❌ Delete QR code error:", err.message);
    res.status(500).json({ error: "Failed to delete QR code" });
  }
});

module.exports = router;
