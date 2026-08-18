-- ============================================================
-- Migration 003: Add gateway_id to lights table
-- ============================================================

ALTER TABLE lights ADD COLUMN gateway_id INT NULL;
ALTER TABLE lights ADD CONSTRAINT fk_light_gateway FOREIGN KEY (gateway_id) REFERENCES gateways(id) ON DELETE SET NULL;
