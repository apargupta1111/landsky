-- ============================================================
-- Migration 002: Create pending_accounts and parent_id
-- ============================================================

CREATE TABLE IF NOT EXISTS pending_accounts (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  email        VARCHAR(255) UNIQUE NOT NULL,
  password     VARCHAR(255) NOT NULL,
  username     VARCHAR(255),
  first_name   VARCHAR(255),
  last_name    VARCHAR(255),
  phone        VARCHAR(255),
  role         ENUM('user', 'installer') NOT NULL,
  parent_email VARCHAR(255) NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add parent_id to users to support Sub-Users and Installers linking to a Primary Client
ALTER TABLE users ADD COLUMN parent_id INT NULL;
ALTER TABLE users ADD CONSTRAINT fk_user_parent FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE;
