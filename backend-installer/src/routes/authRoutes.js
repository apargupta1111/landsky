/**
 * Auth Routes — register, login, refresh, logout, me
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
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

function generateRefreshToken() {
  return crypto.randomBytes(64).toString("hex");
}

// ── POST /api/auth/register ──────────────────────────────────────────────────

router.post("/register", async (req, res) => {
  const { email, password, username, first_name, last_name, phone, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  try {
    // Check if user already exists
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const userRole = role || "user";

    const result = await pool.query(
      `INSERT INTO users (email, password, username, first_name, last_name, phone, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, username, first_name, last_name, role, created_at`,
      [email, hashedPassword, username || null, first_name || null, last_name || null, phone || null, userRole]
    );

    const user = result.rows[0];
    const accessToken = generateAccessToken(user);

    // Create refresh token
    const rawRefreshToken = generateRefreshToken();
    const refreshHash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex");
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [user.id, refreshHash, expiresAt]
    );

    res.status(201).json({
      user,
      access_token: accessToken,
      refresh_token: rawRefreshToken,
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
    const result = await pool.query(
      "SELECT id, email, password, username, first_name, last_name, role FROM users WHERE email = $1 OR username = $1",
      [identifier]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

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
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
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

    const result = await pool.query(
      `SELECT rt.id, rt.user_id, rt.expires_at, rt.revoked_at,
              u.email, u.role, u.username, u.first_name, u.last_name
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1 AND rt.deleted_at IS NULL`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const row = result.rows[0];

    if (row.revoked_at) {
      return res.status(401).json({ error: "Refresh token has been revoked" });
    }
    if (new Date(row.expires_at) < new Date()) {
      return res.status(401).json({ error: "Refresh token expired" });
    }

    // Revoke the old refresh token (rotate)
    await pool.query(
      "UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE id = $1",
      [row.id]
    );

    // Issue new tokens
    const user = { id: row.user_id, email: row.email, role: row.role };
    const newAccessToken = generateAccessToken(user);

    const newRawRefresh = generateRefreshToken();
    const newRefreshHash = crypto.createHash("sha256").update(newRawRefresh).digest("hex");
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
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
      "UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = $1 AND revoked_at IS NULL",
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
    const result = await pool.query(
      "SELECT id, email, phone, username, first_name, last_name, role, created_at, updated_at FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Get profile error:", err.message);
    res.status(500).json({ error: "Failed to get profile" });
  }
});

module.exports = router;
