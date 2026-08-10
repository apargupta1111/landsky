/**
 * User Routes — Admin user management (superadmin only)
 */

const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../config/db");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();
const SALT_ROUNDS = 10;

// All user routes require authentication
router.use(authenticate);

// ── GET /api/users ───────────────────────────────────────────────────────────

router.get("/", authorize("superadmin"), async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, email, phone, username, first_name, last_name, role, created_at, updated_at FROM users ORDER BY id"
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ List users error:", err.message);
    res.status(500).json({ error: "Failed to list users" });
  }
});

// ── GET /api/users/:id ──────────────────────────────────────────────────────

router.get("/:id", authorize("superadmin"), async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, email, phone, username, first_name, last_name, role, created_at, updated_at FROM users WHERE id = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Get user error:", err.message);
    res.status(500).json({ error: "Failed to get user" });
  }
});

// ── PUT /api/users/:id ──────────────────────────────────────────────────────

router.put("/:id", async (req, res) => {
  const targetId = parseInt(req.params.id, 10);

  // Users can update themselves; superadmins can update anyone
  if (req.user.role !== "superadmin" && req.user.id !== targetId) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }

  const { email, phone, username, first_name, last_name, role, password } = req.body;

  try {
    // Build dynamic update
    const fields = [];
    const values = [];

    if (email !== undefined) { fields.push(`email = ?`); values.push(email); }
    if (phone !== undefined) { fields.push(`phone = ?`); values.push(phone); }
    if (username !== undefined) { fields.push(`username = ?`); values.push(username); }
    if (first_name !== undefined) { fields.push(`first_name = ?`); values.push(first_name); }
    if (last_name !== undefined) { fields.push(`last_name = ?`); values.push(last_name); }
    if (role !== undefined && req.user.role === "superadmin") {
      fields.push(`role = ?`); values.push(role);
    }
    if (password) {
      const hashed = await bcrypt.hash(password, SALT_ROUNDS);
      fields.push(`password = ?`); values.push(hashed);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(targetId);

    const [result] = await pool.query(
      `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const [updatedUser] = await pool.query("SELECT id, email, phone, username, first_name, last_name, role, created_at, updated_at FROM users WHERE id = ?", [targetId]);
    res.json(updatedUser[0]);
  } catch (err) {
    console.error("❌ Update user error:", err.message);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// ── DELETE /api/users/:id ────────────────────────────────────────────────────

router.delete("/:id", authorize("superadmin"), async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, email FROM users WHERE id = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    await pool.query("DELETE FROM users WHERE id = ?", [req.params.id]);
    res.json({ ok: true, deleted: rows[0] });
  } catch (err) {
    console.error("❌ Delete user error:", err.message);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

module.exports = router;
