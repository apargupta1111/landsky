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

// ── GET /api/users/pending ───────────────────────────────────────────────────

router.get("/pending", async (req, res) => {
  try {
    let query = "SELECT id, email, username, first_name, last_name, phone, role, parent_email, created_at FROM pending_accounts";
    const values = [];

    if (req.user.role === "superadmin") {
      // Superadmin can see pending New Clients (parent_email is null or they can just see all)
      query += " ORDER BY created_at DESC";
    } else if (req.user.role === "user") {
      // Primary Clients see requests aimed at their email
      query += " WHERE parent_email = ? ORDER BY created_at DESC";
      values.push(req.user.email);
    } else {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const [rows] = await pool.query(query, values);
    res.json(rows);
  } catch (err) {
    console.error("❌ List pending accounts error:", err.message);
    res.status(500).json({ error: "Failed to list pending accounts" });
  }
});

// ── POST /api/users/approve/:id ──────────────────────────────────────────────

router.post("/approve/:id", async (req, res) => {
  try {
    const pendingId = req.params.id;
    
    // Fetch pending account
    const [pendingRows] = await pool.query("SELECT * FROM pending_accounts WHERE id = ?", [pendingId]);
    if (pendingRows.length === 0) {
      return res.status(404).json({ error: "Pending account not found" });
    }
    
    const pendingAcc = pendingRows[0];

    // Authorization check
    if (req.user.role === "user") {
      if (pendingAcc.parent_email !== req.user.email) {
        return res.status(403).json({ error: "Not authorized to approve this account" });
      }
    } else if (req.user.role !== "superadmin") {
      return res.status(403).json({ error: "Not authorized" });
    }

    let parentId = null;
    if (pendingAcc.parent_email) {
      // Look up parent user
      const [parentRows] = await pool.query("SELECT id FROM users WHERE email = ?", [pendingAcc.parent_email]);
      if (parentRows.length > 0) {
        parentId = parentRows[0].id;
      }
    }

    // Insert into users
    await pool.query(
      `INSERT INTO users (email, password, username, first_name, last_name, phone, role, parent_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [pendingAcc.email, pendingAcc.password, pendingAcc.username, pendingAcc.first_name, pendingAcc.last_name, pendingAcc.phone, pendingAcc.role, parentId]
    );

    // Delete from pending
    await pool.query("DELETE FROM pending_accounts WHERE id = ?", [pendingId]);

    res.json({ success: true, message: "Account approved successfully" });
  } catch (err) {
    console.error("❌ Approve account error:", err.message);
    res.status(500).json({ error: "Failed to approve account" });
  }
});

// ── DELETE /api/users/reject/:id ─────────────────────────────────────────────

router.delete("/reject/:id", async (req, res) => {
  try {
    const pendingId = req.params.id;
    
    // Fetch pending account
    const [pendingRows] = await pool.query("SELECT * FROM pending_accounts WHERE id = ?", [pendingId]);
    if (pendingRows.length === 0) {
      return res.status(404).json({ error: "Pending account not found" });
    }
    
    const pendingAcc = pendingRows[0];

    // Authorization check
    if (req.user.role === "user") {
      if (pendingAcc.parent_email !== req.user.email) {
        return res.status(403).json({ error: "Not authorized to reject this account" });
      }
    } else if (req.user.role !== "superadmin") {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Delete from pending
    await pool.query("DELETE FROM pending_accounts WHERE id = ?", [pendingId]);

    res.json({ success: true, message: "Account rejected" });
  } catch (err) {
    console.error("❌ Reject account error:", err.message);
    res.status(500).json({ error: "Failed to reject account" });
  }
});

// ── GET /api/users ───────────────────────────────────────────────────────────

router.get("/", async (req, res) => {
  try {
    let query = "SELECT id, email, phone, username, first_name, last_name, role, parent_id, created_at, updated_at FROM users";
    const values = [];

    if (req.user.role === "user") {
      query += " WHERE parent_id = ? ORDER BY id";
      values.push(req.user.id);
    } else if (req.user.role !== "superadmin") {
      return res.status(403).json({ error: "Insufficient permissions" });
    } else {
      query += " ORDER BY id";
    }

    const [rows] = await pool.query(query, values);
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

// ── PUT /api/users/:id/change-password ────────────────────────────────────────

router.put("/:id/change-password", async (req, res) => {
  try {
    let targetId = req.params.id;
    if (targetId === "me") {
      targetId = req.user.id;
    }
    const { currentPassword, newPassword } = req.body;

    // Users can only change their own password, superadmin can change anyone's
    if (req.user.role !== "superadmin" && parseInt(req.user.id, 10) !== parseInt(targetId, 10)) {
      return res.status(403).json({ error: "Not authorized to change this user's password" });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }

    const [rows] = await pool.query("SELECT password FROM users WHERE id = ?", [targetId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = rows[0];

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Incorrect current password" });
    }

    const hashedNew = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await pool.query(
      "UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [hashedNew, targetId]
    );

    res.json({ ok: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("❌ Change password error:", err.message);
    res.status(500).json({ error: "Failed to change password" });
  }
});

// ── DELETE /api/users/:id ────────────────────────────────────────────────────

router.delete("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, email, parent_id, role FROM users WHERE id = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const targetUser = rows[0];

    // Prevent deletion of superadmin
    if (targetUser.role === "superadmin") {
      return res.status(403).json({ error: "Cannot delete the superadmin account" });
    }

    // Authorization check
    if (req.user.role === "user") {
      if (targetUser.id !== req.user.id && targetUser.parent_id !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to delete this user" });
      }
    } else if (req.user.role !== "superadmin") {
      return res.status(403).json({ error: "Not authorized" });
    }

    await pool.query("DELETE FROM users WHERE id = ?", [req.params.id]);
    res.json({ ok: true, deleted: targetUser });
  } catch (err) {
    console.error("❌ Delete user error:", err.message);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

module.exports = router;
