/**
 * Auth Routes — register, login, refresh, logout, me
 * Converted for MySQL (using mysql2/promise)
 */

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const pool = require("../config/db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "landskysecret";
const ACCESS_TOKEN_EXPIRY = "1h";
const REFRESH_TOKEN_EXPIRY_DAYS = 30;
const SALT_ROUNDS = 10;

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, parent_id: user.parent_id },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

function generateRefreshToken() {
  return crypto.randomBytes(64).toString("hex");
}

// ── POST /api/auth/register ──────────────────────────────────────────────────

router.post("/register", async (req, res) => {
  const { email, password, username, first_name, last_name, phone, role, parent_email } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const userRole = role || "user";

  if ((userRole === "installer" || parent_email) && !parent_email) {
    return res.status(400).json({ error: "Primary Client Email is required for installers or sub-users" });
  }

  try {
    // Check if user already exists in users or pending_accounts
    const [existingUsers] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }
    
    const [existingPending] = await pool.query("SELECT id FROM pending_accounts WHERE email = ?", [email]);
    if (existingPending.length > 0) {
      return res.status(409).json({ error: "An account request with this email is already pending" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert into pending_accounts
    await pool.query(
      `INSERT INTO pending_accounts (email, password, username, first_name, last_name, phone, role, parent_email)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [email, hashedPassword, username || null, first_name || null, last_name || null, phone || null, userRole, parent_email || null]
    );

    res.status(201).json({
      message: "Registration request sent successfully. Pending approval.",
    });
  } catch (err) {
    console.error("❌ Register error:", err.message);
    res.status(500).json({ error: "Registration failed" });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────

router.post("/login", async (req, res) => {
  // Frontend might send the username in the `email` field
  const identifier = req.body.email || req.body.username;
  const password = req.body.password;

  if (!identifier || !password) {
    return res.status(400).json({ error: "username/email and password are required" });
  }

  try {
    // Note: Passed `identifier` twice because of the two `?` placeholders
    const [rows] = await pool.query(
      "SELECT id, email, password, username, first_name, last_name, role, parent_id FROM users WHERE email = ? OR username = ?",
      [identifier, identifier]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = rows[0];

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user);

    // Create refresh token
    const rawRefreshToken = generateRefreshToken();
    const refreshHash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex");
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)`,
      [user.id, refreshHash, expiresAt]
    );

    // Don't return the hashed password
    const { password: _, ...safeUser } = user;

    res.json({
      user: safeUser,
      access_token: accessToken,
      refresh_token: rawRefreshToken,
    });
  } catch (err) {
    console.error("❌ Login error:", err.message);
    res.status(500).json({ error: "Login failed" });
  }
});

// ── POST /api/auth/refresh ───────────────────────────────────────────────────

router.post("/refresh", async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({ error: "refresh_token is required" });
  }

  try {
    const tokenHash = crypto.createHash("sha256").update(refresh_token).digest("hex");

    const [rows] = await pool.query(
      `SELECT rt.id, rt.user_id, rt.expires_at, rt.revoked_at,
              u.email, u.role, u.username, u.first_name, u.last_name, u.parent_id
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = ? AND rt.deleted_at IS NULL`,
      [tokenHash]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const row = rows[0];

    if (row.revoked_at) {
      return res.status(401).json({ error: "Refresh token has been revoked" });
    }
    if (new Date(row.expires_at) < new Date()) {
      return res.status(401).json({ error: "Refresh token expired" });
    }

    // Revoke the old refresh token (rotate)
    await pool.query(
      "UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE id = ?",
      [row.id]
    );

    // Issue new tokens
    const user = { id: row.user_id, email: row.email, role: row.role, parent_id: row.parent_id };
    const newAccessToken = generateAccessToken(user);

    const newRawRefresh = generateRefreshToken();
    const newRefreshHash = crypto.createHash("sha256").update(newRawRefresh).digest("hex");
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)`,
      [row.user_id, newRefreshHash, expiresAt]
    );

    res.json({
      access_token: newAccessToken,
      refresh_token: newRawRefresh,
    });
  } catch (err) {
    console.error("❌ Refresh error:", err.message);
    res.status(500).json({ error: "Token refresh failed" });
  }
});

// ── POST /api/auth/logout ────────────────────────────────────────────────────

router.post("/logout", async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({ error: "refresh_token is required" });
  }

  try {
    const tokenHash = crypto.createHash("sha256").update(refresh_token).digest("hex");

    await pool.query(
      "UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = ? AND revoked_at IS NULL",
      [tokenHash]
    );

    res.json({ ok: true, message: "Logged out" });
  } catch (err) {
    console.error("❌ Logout error:", err.message);
    res.status(500).json({ error: "Logout failed" });
  }
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────

router.get("/me", authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, email, phone, username, first_name, last_name, role, parent_id, created_at, updated_at FROM users WHERE id = ?",
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Get profile error:", err.message);
    res.status(500).json({ error: "Failed to get profile" });
  }
});

module.exports = router;