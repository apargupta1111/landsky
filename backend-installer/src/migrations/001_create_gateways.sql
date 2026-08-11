-- ============================================================
-- Migration 001: Create gateways table
-- Run this in MySQL against the LANDSKY database
-- ============================================================

CREATE TABLE IF NOT EXISTS gateways (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  eui               VARCHAR(255) UNIQUE NOT NULL,
  name              VARCHAR(255) NOT NULL,
  description       VARCHAR(1024),
  region            VARCHAR(255),
  connection_status BOOLEAN DEFAULT FALSE,
  last_seen         TIMESTAMP NULL,
  latitude          FLOAT DEFAULT 0.0,
  longitude         FLOAT DEFAULT 0.0,
  installed_by      INT,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (installed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_gateways_eui ON gateways (eui);
CREATE INDEX idx_gateways_installed_by ON gateways (installed_by);
