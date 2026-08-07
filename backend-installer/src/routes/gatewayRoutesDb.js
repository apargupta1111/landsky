/**
 * Gateway Routes (DB-backed) — Full CRUD for gateways table.
 * Replaces direct TTS gateway fetching.
 */

const express = require("express");
const pool = require("../config/db");

const router = express.Router();

// ── GET /api/gateways ────────────────────────────────────────────────────────

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT g.*,
             u.username AS installed_by_name
      FROM gateways g
      LEFT JOIN users u ON u.id = g.installed_by
      ORDER BY g.id
    `);

    // Format for frontend compatibility
    const formatted = result.rows.map((gw) => ({
      id: String(gw.id),
      eui: gw.eui,
      tenantId: 0,
      name: gw.name,
      description: gw.description || "",
      region: gw.region || "",
      connectionStatus: gw.connection_status,
      lastSeen: gw.last_seen || "",
      location: { x: gw.longitude, y: gw.latitude },
      installedAt: gw.created_at,
      installedBy: gw.installed_by || 0,
      installedByName: gw.installed_by_name || "",
      createdAt: gw.created_at,
      updatedAt: gw.updated_at,
      connectedLights: 0, // TODO: compute from lights table
      onlineLights: 0,
      faults: 0,
      signal: -70,
      lat: gw.latitude,
      lng: gw.longitude,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("❌ List gateways error:", err.message);
    res.status(500).json({ error: "Failed to list gateways" });
  }
});

// ── GET /api/gateways/:id ────────────────────────────────────────────────────

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM gateways WHERE id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Gateway not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Get gateway error:", err.message);
    res.status(500).json({ error: "Failed to get gateway" });
  }
});

// ── POST /api/gateways ──────────────────────────────────────────────────────

router.post("/", async (req, res) => {
  const { eui, name, description, region, latitude, longitude, installed_by } = req.body;

  if (!eui || !name) {
    return res.status(400).json({ error: "eui and name are required" });
  }

  try {
    const result = await pool.query(`
      INSERT INTO gateways (eui, name, description, region, latitude, longitude, installed_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      eui,
      name,
      description || null,
      region || null,
      latitude || 0.0,
      longitude || 0.0,
      installed_by || null,
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Gateway EUI already exists" });
    }
    console.error("❌ Create gateway error:", err.message);
    res.status(500).json({ error: "Failed to create gateway" });
  }
});

// ── PUT /api/gateways/:id ───────────────────────────────────────────────────

router.put("/:id", async (req, res) => {
  const { eui, name, description, region, connection_status, latitude, longitude, last_seen } = req.body;

  try {
    const fields = [];
    const values = [];
    let idx = 1;

    if (eui !== undefined) { fields.push(`eui = $${idx++}`); values.push(eui); }
    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
    if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
    if (region !== undefined) { fields.push(`region = $${idx++}`); values.push(region); }
    if (connection_status !== undefined) { fields.push(`connection_status = $${idx++}`); values.push(connection_status); }
    if (latitude !== undefined) { fields.push(`latitude = $${idx++}`); values.push(latitude); }
    if (longitude !== undefined) { fields.push(`longitude = $${idx++}`); values.push(longitude); }
    if (last_seen !== undefined) { fields.push(`last_seen = $${idx++}`); values.push(last_seen); }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.params.id);

    const result = await pool.query(
      `UPDATE gateways SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Gateway not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Update gateway error:", err.message);
    res.status(500).json({ error: "Failed to update gateway" });
  }
});

// ── DELETE /api/gateways/:id ─────────────────────────────────────────────────

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM gateways WHERE id = $1 RETURNING id, eui, name",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Gateway not found" });
    }

    res.json({ ok: true, deleted: result.rows[0] });
  } catch (err) {
    console.error("❌ Delete gateway error:", err.message);
    res.status(500).json({ error: "Failed to delete gateway" });
  }
});

module.exports = router;
