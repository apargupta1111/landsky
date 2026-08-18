-- ============================================================
-- Project: LandSky
-- Converted from DBML to PostgreSQL DDL for use in pgAdmin4
-- ============================================================
-- Changes from the original DBML in this version:
--   1. lights."user" renamed to lights.user_id — avoids quoting a
--      reserved-ish identifier everywhere in queries/app code.
--   2. light_status now has its own surrogate `id` PRIMARY KEY;
--      light_id is a separate NOT NULL, UNIQUE foreign key (keeps
--      the 1:1 relationship but no longer forces the FK column to
--      double as the PK, which is cleaner with ON DELETE CASCADE).
--   3. Every foreign key now has ON DELETE CASCADE — deleting a
--      light removes its schedules, action logs, qr codes, status
--      row, and alerts; deleting a user removes lights/tokens/
--      alerts tied to that user. Reconsider CASCADE on the `users`
--      side if you'd rather block deletion of a user who still has
--      lights/alerts assigned — happy to switch specific FKs to
--      SET NULL or RESTRICT instead if that fits your app better.
--   4. `days_of_week` kept as JSONB (see prior notes).
--   5. lights.name added (device name, e.g. 'streetlight-01');
--      lights.serial_number changed from INTEGER to VARCHAR so it
--      can hold a DevEUI hex string, which won't fit in INTEGER.
-- ============================================================

BEGIN;

-- -----------------------------------------
-- ENUMS
-- -----------------------------------------
CREATE TYPE role_enum AS ENUM ('superadmin', 'installer', 'user');
CREATE TYPE connection_enum AS ENUM ('on', 'off');
CREATE TYPE faulty_enum AS ENUM ('active', 'fault');
CREATE TYPE repeat_type_enum AS ENUM ('daily', 'weekly', 'monthly');

CREATE TYPE alert_type_enum AS ENUM (
  'communication_lost',
  'lamp_failure',
  'over_temperature',
  'under_voltage',
  'over_voltage',
  'over_current',
  'schedule_failed',
  'device_restart'
);

CREATE TYPE alert_severity_enum AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE alert_status_enum AS ENUM ('active', 'acknowledged', 'resolved');

-- -----------------------------------------
-- AUTH INFRASTRUCTURE
-- -----------------------------------------
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  email       VARCHAR UNIQUE NOT NULL,
  phone       VARCHAR UNIQUE,
  password    VARCHAR,
  username    VARCHAR,
  first_name  VARCHAR,
  last_name   VARCHAR,
  role        role_enum DEFAULT 'user',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_first_name ON users (first_name);
CREATE INDEX idx_users_last_name ON users (last_name);

CREATE TABLE refresh_tokens (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR UNIQUE NOT NULL,
  expires_at  TIMESTAMP NOT NULL,
  revoked_at  TIMESTAMP NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at  TIMESTAMP NULL
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);

-- -----------------------------------------
-- LIGHTS
-- -----------------------------------------
CREATE TABLE lights (
  id                 SERIAL PRIMARY KEY,
  name               VARCHAR,                    -- e.g. 'streetlight-01'
  serial_number      VARCHAR UNIQUE NOT NULL,     -- holds DevEUI (hex string; too large for INTEGER)
  pole_number        VARCHAR NOT NULL DEFAULT '0000',
  last_seen_time     TIMESTAMP,
  connection_status  connection_enum DEFAULT 'off',
  fault_status       faulty_enum DEFAULT 'active',
  latitude           FLOAT NOT NULL,
  longitude          FLOAT NOT NULL,
  installer          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lights_installer ON lights (installer);
CREATE INDEX idx_lights_user_id ON lights (user_id);
CREATE INDEX idx_lights_fault_status ON lights (fault_status);
CREATE INDEX idx_lights_installer_fault_status ON lights (installer, fault_status);
CREATE INDEX idx_lights_user_id_fault_status ON lights (user_id, fault_status);

-- -----------------------------------------
-- SCHEDULES
-- -----------------------------------------
CREATE TABLE schedules (
  id            SERIAL PRIMARY KEY,
  light         INTEGER NOT NULL REFERENCES lights(id) ON DELETE CASCADE,
  is_periodic   repeat_type_enum DEFAULT 'daily',
  start_time    TIME NOT NULL,
  stop_time     TIME NOT NULL,
  days_of_week  JSONB, -- Array like [1,2,3,4,5]
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at    TIMESTAMP NULL
);

CREATE INDEX idx_schedules_light ON schedules (light);
CREATE INDEX idx_schedules_light_is_active ON schedules (light, is_active);

-- -----------------------------------------
-- ACTION LOGS
-- -----------------------------------------
CREATE TABLE light_action_logs (
  id          SERIAL PRIMARY KEY,
  light_id    INTEGER NOT NULL REFERENCES lights(id) ON DELETE CASCADE,
  action      VARCHAR NOT NULL, -- on | off | dimming | reset
  dim_value   INTEGER NULL,     -- 0-100 for dimming commands
  color       VARCHAR(20) DEFAULT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_light_action_logs_action ON light_action_logs (action);
CREATE INDEX idx_light_action_logs_dim_value ON light_action_logs (dim_value);

-- -----------------------------------------
-- QR CODES
-- -----------------------------------------
CREATE TABLE qr (
  id          SERIAL PRIMARY KEY,
  light_id    INTEGER NOT NULL REFERENCES lights(id) ON DELETE CASCADE,
  qr_code     VARCHAR UNIQUE NOT NULL,
  used_at     TIMESTAMP NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------
-- LIGHT STATUS (telemetry snapshot, 1:1 with lights)
-- -----------------------------------------
CREATE TABLE light_status (
  id                    SERIAL PRIMARY KEY,
  light_id              INTEGER NOT NULL UNIQUE REFERENCES lights(id) ON DELETE CASCADE,
  brightness_percent    INTEGER,
  fault_status          VARCHAR,
  input_current_mA      INTEGER,
  input_frequency_Hz    INTEGER,
  input_power_W         INTEGER,
  input_voltage_V       INTEGER,
  internal_temp_AD      INTEGER,
  internal_temp_C       INTEGER,
  lamp_on_time_hours    INTEGER,
  led_mode              VARCHAR,
  led_power_W           INTEGER,
  operating_time_hours  INTEGER,
  output_current_mA     INTEGER,
  output_voltage_V      INTEGER,
  power_factor          DECIMAL(4,2),
  relay_state           VARCHAR,
  total_power_saved_kwh DECIMAL(10,4) DEFAULT 0.0000
);

-- -----------------------------------------
-- ALERTS
-- -----------------------------------------
CREATE TABLE alerts (
  id               BIGSERIAL PRIMARY KEY,
  light_id         INTEGER NOT NULL REFERENCES lights(id) ON DELETE CASCADE,
  alert_type       alert_type_enum NOT NULL,
  severity         alert_severity_enum NOT NULL,
  status           alert_status_enum DEFAULT 'active',
  message          TEXT NOT NULL,
  acknowledged_by  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  acknowledged_at  TIMESTAMP NULL,
  resolved_by      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resolved_at      TIMESTAMP NULL,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alerts_light_id ON alerts (light_id);
CREATE INDEX idx_alerts_alert_type ON alerts (alert_type);
CREATE INDEX idx_alerts_severity ON alerts (severity);
CREATE INDEX idx_alerts_status ON alerts (status);
CREATE INDEX idx_alerts_created_at ON alerts (created_at);
CREATE INDEX idx_alerts_light_id_status ON alerts (light_id, status);
CREATE INDEX idx_alerts_status_severity ON alerts (status, severity);

COMMIT;

-- ============================================================
-- STILL WORTH A LOOK:
--   - alerts.acknowledged_by and alerts.resolved_by are still
--     NOT NULL even though a fresh alert is 'active' with no one
--     having acknowledged or resolved it yet. If that's not
--     intentional, make those two columns nullable.
--   - ON DELETE CASCADE on the users side is broad: deleting a
--     user now cascades through their lights (and everything
--     under those lights), refresh tokens, and any alerts they
--     acknowledged/resolved. If you'd rather keep a user's alert
--     history after the user is removed, switch acknowledged_by/
--     resolved_by to ON DELETE SET NULL (and drop NOT NULL there).
-- ============================================================