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

// ══════════════════════════════════════════════════════════════════════════════
// QR SCAN ENDPOINTS — called from the installer's phone app
// ══════════════════════════════════════════════════════════════════════════════

// ── GET /api/qr/scan/:qr_code ────────────────────────────────────────────────
// Phone scans the QR → returns the light info linked to that QR code.
// If the QR hasn't been used yet, returns the light data + qr metadata.

router.get("/scan/:qr_code", async (req, res) => {
  try {
    const { qr_code } = req.params;

    // Find QR record and join with the linked light
    const result = await pool.query(`
      SELECT
        q.id          AS qr_id,
        q.qr_code,
        q.used_at,
        q.created_at  AS qr_created_at,
        l.id          AS light_id,
        l.name,
        l.serial_number,
        l.pole_number,
        l.latitude,
        l.longitude,
        l.connection_status,
        l.fault_status,
        l.last_seen_time,
        l.installer,
        l.user_id,
        l.created_at  AS light_created_at,
        l.updated_at  AS light_updated_at
      FROM qr q
      JOIN lights l ON l.id = q.light_id
      WHERE q.qr_code = $1
    `, [qr_code]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "QR code not found or not linked to any light" });
    }

    const row = result.rows[0];

    res.json({
      qr: {
        id: row.qr_id,
        qr_code: row.qr_code,
        used_at: row.used_at,
        created_at: row.qr_created_at,
        is_used: !!row.used_at,
      },
      light: {
        id: row.light_id,
        name: row.name,
        serial_number: row.serial_number,
        pole_number: row.pole_number,
        latitude: row.latitude,
        longitude: row.longitude,
        connection_status: row.connection_status,
        fault_status: row.fault_status,
        last_seen_time: row.last_seen_time,
        installer: row.installer,
        user_id: row.user_id,
        created_at: row.light_created_at,
        updated_at: row.light_updated_at,
      },
    });
  } catch (err) {
    console.error("❌ QR scan lookup error:", err.message);
    res.status(500).json({ error: "Failed to look up QR code" });
  }
});

// ── POST /api/qr/scan ────────────────────────────────────────────────────────
// Phone submits scanned QR data with installer info + GPS coordinates.
//
// Body:
//   qr_code      — the QR string scanned from the physical label
//   latitude      — GPS lat from the phone
//   longitude     — GPS lng from the phone
//   installer_id  — user id of the installer performing the scan
//   pole_number   — (optional) pole number entered by installer
//   name          — (optional) human-readable light name
//
// This will:
//   1. Find the QR record
//   2. Create or update the linked light row with lat/long/installer info
//   3. Mark the QR as used

router.post("/scan", async (req, res) => {
  const { qr_code, latitude, longitude, installer_id, pole_number, name } = req.body;

  if (!qr_code) {
    return res.status(400).json({ error: "qr_code is required" });
  }
  if (latitude == null || longitude == null) {
    return res.status(400).json({ error: "latitude and longitude are required" });
  }
  if (!installer_id) {
    return res.status(400).json({ error: "installer_id is required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Find the QR record
    const qrResult = await client.query(
      "SELECT id, light_id, qr_code, used_at FROM qr WHERE qr_code = $1",
      [qr_code]
    );

    if (qrResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "QR code not found" });
    }

    const qrRow = qrResult.rows[0];

    if (qrRow.used_at) {
      // QR already used — still allow update but warn the caller
      console.warn(`⚠️ QR ${qr_code} was already scanned at ${qrRow.used_at}, updating light anyway`);
    }

    // 2. Update the linked light with installer info + GPS
    const updateFields = [
      "latitude = $1",
      "longitude = $2",
      "installer = $3",
      "updated_at = CURRENT_TIMESTAMP",
    ];
    const updateValues = [latitude, longitude, installer_id];
    let paramIdx = 4;

    if (pole_number) {
      updateFields.push(`pole_number = $${paramIdx}`);
      updateValues.push(pole_number);
      paramIdx++;
    }
    if (name) {
      updateFields.push(`name = $${paramIdx}`);
      updateValues.push(name);
      paramIdx++;
    }

    updateValues.push(qrRow.light_id);

    const lightResult = await client.query(`
      UPDATE lights
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIdx}
      RETURNING *
    `, updateValues);

    if (lightResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Linked light not found in database" });
    }

    // 3. Mark QR as used
    await client.query(
      "UPDATE qr SET used_at = CURRENT_TIMESTAMP WHERE id = $1",
      [qrRow.id]
    );

    await client.query("COMMIT");

    res.json({
      ok: true,
      message: qrRow.used_at ? "Light updated (QR was previously scanned)" : "Light installed successfully",
      light: lightResult.rows[0],
      qr: { id: qrRow.id, qr_code: qrRow.qr_code },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ QR scan install error:", err.message);
    res.status(500).json({ error: "Failed to process QR scan" });
  } finally {
    client.release();
  }
});

module.exports = router;
