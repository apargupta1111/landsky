-- ============================================================
-- Project: LandSky (MySQL Version)
-- Converted from PostgreSQL to MySQL
-- ============================================================

-- Note: MySQL does not have CREATE TYPE ... AS ENUM. We define ENUMs inline.

-- -----------------------------------------
-- AUTH INFRASTRUCTURE
-- -----------------------------------------
CREATE TABLE users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  email       VARCHAR(255) UNIQUE NOT NULL,
  phone       VARCHAR(255) UNIQUE,
  password    VARCHAR(255),
  username    VARCHAR(255),
  first_name  VARCHAR(255),
  last_name   VARCHAR(255),
  role        ENUM('superadmin', 'installer', 'user') DEFAULT 'user',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_first_name ON users (first_name);
CREATE INDEX idx_users_last_name ON users (last_name);

CREATE TABLE refresh_tokens (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  token_hash  VARCHAR(255) UNIQUE NOT NULL,
  expires_at  TIMESTAMP NOT NULL,
  revoked_at  TIMESTAMP NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at  TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);

-- -----------------------------------------
-- LIGHTS
-- -----------------------------------------
CREATE TABLE lights (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  name               VARCHAR(255),
  serial_number      VARCHAR(255) UNIQUE NOT NULL,
  pole_number        VARCHAR(255) NOT NULL DEFAULT '0000',
  last_seen_time     TIMESTAMP NULL,
  connection_status  ENUM('on', 'off') DEFAULT 'off',
  fault_status       ENUM('active', 'fault') DEFAULT 'active',
  latitude           FLOAT NOT NULL,
  longitude          FLOAT NOT NULL,
  installer          INT NOT NULL,
  user_id            INT NOT NULL,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (installer) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
  id            INT AUTO_INCREMENT PRIMARY KEY,
  light         INT NOT NULL,
  is_periodic   ENUM('daily', 'weekly', 'monthly') DEFAULT 'daily',
  start_time    TIME NOT NULL,
  stop_time     TIME NOT NULL,
  days_of_week  JSON, 
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    TIMESTAMP NULL,
  FOREIGN KEY (light) REFERENCES lights(id) ON DELETE CASCADE
);

CREATE INDEX idx_schedules_light ON schedules (light);
CREATE INDEX idx_schedules_light_is_active ON schedules (light, is_active);

-- -----------------------------------------
-- ACTION LOGS
-- -----------------------------------------
CREATE TABLE light_action_logs (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  light_id    INT NOT NULL,
  action      VARCHAR(255) NOT NULL,
  dim_value   INT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (light_id) REFERENCES lights(id) ON DELETE CASCADE
);

CREATE INDEX idx_light_action_logs_action ON light_action_logs (action);
CREATE INDEX idx_light_action_logs_dim_value ON light_action_logs (dim_value);

-- -----------------------------------------
-- QR CODES
-- -----------------------------------------
CREATE TABLE qr (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  light_id    INT NOT NULL,
  qr_code     VARCHAR(255) UNIQUE NOT NULL,
  used_at     TIMESTAMP NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (light_id) REFERENCES lights(id) ON DELETE CASCADE
);

-- -----------------------------------------
-- LIGHT STATUS
-- -----------------------------------------
CREATE TABLE light_status (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  light_id              INT NOT NULL UNIQUE,
  brightness_percent    INT,
  fault_status          VARCHAR(255),
  input_current_mA      INT,
  input_frequency_Hz    INT,
  input_power_W         INT,
  input_voltage_V       INT,
  internal_temp_AD      INT,
  internal_temp_C       INT,
  lamp_on_time_hours    INT,
  led_mode              VARCHAR(255),
  led_power_W           INT,
  operating_time_hours  INT,
  output_current_mA     INT,
  output_voltage_V      INT,
  power_factor          DECIMAL(4,2),
  relay_state           VARCHAR(255),
  total_power_saved_kwh DECIMAL(10,4) DEFAULT 0.0000,
  FOREIGN KEY (light_id) REFERENCES lights(id) ON DELETE CASCADE
);

-- -----------------------------------------
-- ALERTS
-- -----------------------------------------
CREATE TABLE alerts (
  id               BIGINT AUTO_INCREMENT PRIMARY KEY,
  light_id         INT NOT NULL,
  alert_type       ENUM(
                     'communication_lost',
                     'lamp_failure',
                     'over_temperature',
                     'under_voltage',
                     'over_voltage',
                     'over_current',
                     'schedule_failed',
                     'device_restart'
                   ) NOT NULL,
  severity         ENUM('low', 'medium', 'high', 'critical') NOT NULL,
  status           ENUM('active', 'acknowledged', 'resolved') DEFAULT 'active',
  message          TEXT NOT NULL,
  acknowledged_by  INT NOT NULL,
  acknowledged_at  TIMESTAMP NULL,
  resolved_by      INT NOT NULL,
  resolved_at      TIMESTAMP NULL,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (light_id) REFERENCES lights(id) ON DELETE CASCADE,
  FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_alerts_light_id ON alerts (light_id);
CREATE INDEX idx_alerts_alert_type ON alerts (alert_type);
CREATE INDEX idx_alerts_severity ON alerts (severity);
CREATE INDEX idx_alerts_status ON alerts (status);
CREATE INDEX idx_alerts_created_at ON alerts (created_at);
CREATE INDEX idx_alerts_light_id_status ON alerts (light_id, status);
CREATE INDEX idx_alerts_status_severity ON alerts (status, severity);
