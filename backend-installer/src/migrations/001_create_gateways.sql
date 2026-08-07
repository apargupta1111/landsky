-- ============================================================
-- Migration 001: Create gateways table
-- Run this in pgAdmin against the LANDSKY database
-- ============================================================

CREATE TABLE IF NOT EXISTS gateways (
  id                SERIAL PRIMARY KEY,
  eui               VARCHAR UNIQUE NOT NULL,
  name              VARCHAR NOT NULL,
  description       VARCHAR,
  region            VARCHAR,
  connection_status BOOLEAN DEFAULT FALSE,
  last_seen         TIMESTAMP,
  latitude          FLOAT DEFAULT 0.0,
  longitude         FLOAT DEFAULT 0.0,
  installed_by      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gateways_eui ON gateways (eui);
CREATE INDEX IF NOT EXISTS idx_gateways_installed_by ON gateways (installed_by);
