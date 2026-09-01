/**
 * Auth Routes — register, login, refresh, logout, me
 * Converted for MySQL (using mysql2/promise)
 */

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const pool = require("../config/db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // allows self-signed certs
  },
});

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

// ── POST /api/auth/send-otp ──────────────────────────────────────────────────

router.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    // Check if email already registered
    const [existingUsers] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existingUsers.length > 0) return res.status(409).json({ error: "Email already registered" });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Upsert into email_verifications
    await pool.query(
      `INSERT INTO email_verifications (email, otp, expires_at, is_verified) 
       VALUES (?, ?, ?, FALSE)
       ON DUPLICATE KEY UPDATE otp = VALUES(otp), expires_at = VALUES(expires_at), is_verified = FALSE`,
      [email, otp, expiresAt]
    );

    // Send email
    if (process.env.SMTP_USER) {
      await transporter.sendMail({
        from: `"SmartLight - HBeon Labs" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Your Registration OTP",
        text: `Your OTP for registration is: ${otp}\nIt will expire in 10 minutes.`,
      });
    } else {
      console.log(`\n\n[DEV] OTP for ${email}: ${otp}\n\n`);
    }

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("❌ Send OTP error:", err.message);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// ── POST /api/auth/verify-otp ────────────────────────────────────────────────

router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: "Email and OTP are required" });

  try {
    const [rows] = await pool.query("SELECT * FROM email_verifications WHERE email = ?", [email]);
    if (rows.length === 0) return res.status(404).json({ error: "No OTP found for this email" });

    const record = rows[0];
    if (new Date() > new Date(record.expires_at)) {
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }
    if (record.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // Mark as verified
    await pool.query("UPDATE email_verifications SET is_verified = TRUE WHERE email = ?", [email]);
    res.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("❌ Verify OTP error:", err.message);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
});

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

    // Check if OTP verified
    const [verifyRows] = await pool.query("SELECT is_verified FROM email_verifications WHERE email = ?", [email]);
    if (verifyRows.length === 0 || !verifyRows[0].is_verified) {
      return res.status(403).json({ error: "Email has not been verified with OTP" });
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

    // Clean up OTP
    await pool.query("DELETE FROM email_verifications WHERE email = ?", [email]);

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