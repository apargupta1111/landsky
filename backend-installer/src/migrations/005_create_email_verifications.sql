-- ============================================================
-- Migration 005: Create email_verifications table for OTP
-- ============================================================

CREATE TABLE IF NOT EXISTS email_verifications (
  email VARCHAR(255) PRIMARY KEY,
  otp VARCHAR(6) NOT NULL,
  expires_at DATETIME NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
