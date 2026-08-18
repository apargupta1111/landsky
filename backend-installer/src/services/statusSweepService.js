/**
 * Status Sweep Service — Marks devices and gateways as offline if they haven't been seen in 15 minutes.
 */

const pool = require("../config/db");

const SWEEP_INTERVAL_MS = 60 * 1000; // Run every 1 minute
const TIMEOUT_MINUTES = 15; // 15 minutes timeout

let sweepInterval = null;
let isSweeping = false;

async function sweepOfflineDevices() {
  if (isSweeping) return;
  isSweeping = true;
  
  try {
    // 1. Mark lights as offline if last_seen_time > 15 mins ago
    const [lightsResult] = await pool.query(`
      UPDATE lights 
      SET connection_status = 'off' 
      WHERE connection_status = 'on' 
        AND last_seen_time < (NOW() - INTERVAL ? MINUTE)
    `, [TIMEOUT_MINUTES]);

    if (lightsResult.affectedRows > 0) {
      console.log(`🧹 Marked ${lightsResult.affectedRows} lights as offline (no data > 15m)`);
    }

    // 2. Mark gateways as offline if last_seen > 15 mins ago
    const [gatewaysResult] = await pool.query(`
      UPDATE gateways 
      SET connection_status = 0 
      WHERE connection_status = 1 
        AND last_seen < (NOW() - INTERVAL ? MINUTE)
    `, [TIMEOUT_MINUTES]);

    if (gatewaysResult.affectedRows > 0) {
      console.log(`🧹 Marked ${gatewaysResult.affectedRows} gateways as offline (no data > 15m)`);
    }

  } catch (err) {
    console.error("❌ Status sweep error:", err.message);
  } finally {
    isSweeping = false;
  }
}

function initStatusSweep() {
  if (sweepInterval) {
    clearInterval(sweepInterval);
  }
  
  console.log(`🧹 Initializing offline status sweep (Timeout: ${TIMEOUT_MINUTES}m)...`);
  
  // Run immediately on startup
  sweepOfflineDevices();
   // Then run periodically
  sweepInterval = setInterval(sweepOfflineDevices, SWEEP_INTERVAL_MS);
}

module.exports = {
  initStatusSweep
};
