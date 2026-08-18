/**
 * Gateway Routes (DB-backed) — Full CRUD for gateways table.
 * Replaces direct TTS gateway fetching.
 */

const express = require("express");
const pool = require("../config/db");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

// ── GET /api/gateways ────────────────────────────────────────────────────────

router.get("/", async (req, res) => {
  try {
    let query = `
      SELECT g.*,
             u.username AS installed_by_name
      FROM gateways g
      LEFT JOIN users u ON u.id = g.installed_by
    `;
    const values = [];

    if (req.user.role !== 'superadmin') {
      // Find the main organization ID (the Main User)
      const mainUserId = req.user.parent_id === null ? req.user.id : req.user.parent_id;
      
      // Gateway is visible if it was installed by the Main User, 
      // or if it was installed by any user whose parent is the Main User (like an installer or subuser)
      query += ` WHERE g.installed_by = ? OR u.parent_id = ?`;
      values.push(mainUserId, mainUserId);
    }

    query += ` ORDER BY g.id`;

    const [rows] = await pool.query(query, values);

    // Format for frontend compatibility
    const formatted = rows.map((gw) => ({
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
    const [rows] = await pool.query(
      "SELECT * FROM gateways WHERE id = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Gateway not found" });
    }

    res.json(rows[0]);
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
    const [result] = await pool.query(`
      INSERT INTO gateways (eui, name, description, region, latitude, longitude, installed_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      eui,
      name,
      description || null,
      region || null,
      latitude || 0.0,
      longitude || 0.0,
      installed_by || null,
    ]);

    const [newGw] = await pool.query("SELECT * FROM gateways WHERE id = ?", [result.insertId]);
    res.status(201).json(newGw[0]);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY" || err.errno === 1062) {
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

    if (eui !== undefined) { fields.push(`eui = ?`); values.push(eui); }
    if (name !== undefined) { fields.push(`name = ?`); values.push(name); }
    if (description !== undefined) { fields.push(`description = ?`); values.push(description); }
    if (region !== undefined) { fields.push(`region = ?`); values.push(region); }
    if (connection_status !== undefined) { fields.push(`connection_status = ?`); values.push(connection_status); }
    if (latitude !== undefined) { fields.push(`latitude = ?`); values.push(latitude); }
    if (longitude !== undefined) { fields.push(`longitude = ?`); values.push(longitude); }
    if (last_seen !== undefined) { fields.push(`last_seen = ?`); values.push(last_seen); }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.params.id);

    const [result] = await pool.query(
      `UPDATE gateways SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Gateway not found" });
    }

    const [updatedGw] = await pool.query("SELECT * FROM gateways WHERE id = ?", [req.params.id]);
    res.json(updatedGw[0]);
  } catch (err) {
    console.error("❌ Update gateway error:", err.message);
    res.status(500).json({ error: "Failed to update gateway" });
  }
});

// ── DELETE /api/gateways/:id ─────────────────────────────────────────────────

router.delete("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, eui, name FROM gateways WHERE id = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Gateway not found" });
    }

    await pool.query("DELETE FROM gateways WHERE id = ?", [req.params.id]);
    res.json({ ok: true, deleted: rows[0] });
  } catch (err) {
    console.error("❌ Delete gateway error:", err.message);
    res.status(500).json({ error: "Failed to delete gateway" });
  }
});

module.exports = router;
