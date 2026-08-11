/**
 * Gateway Status Service — Periodically fetches gateway connection stats from TTS.
 * 
 * Uses the TTS_GATEWAY_API_KEY to query TTS GS for live connection stats
 * and updates the 'connection_status' and 'last_seen' in the local DB.
 */

const axios = require("axios");
const pool = require("../config/db");

const TTS_SERVER = process.env.TTS_SERVER || "http://13.205.43.53:1885";
const TTS_GATEWAY_API_KEY = process.env.TTS_GATEWAY_API_KEY || "";

const POLLING_INTERVAL_MS = 3 * 60 * 1000; // Poll every 3 minutes

let pollInterval = null;

async function pollGatewayStatus() {
  if (!TTS_GATEWAY_API_KEY) {
    console.warn("⚠️ TTS_GATEWAY_API_KEY is not set. Gateway status polling disabled.");
    return;
  }

  try {
    // 1. Fetch all gateways from DB
    const [gateways] = await pool.query("SELECT id, name FROM gateways");
    
    if (gateways.length === 0) return;

    for (const gw of gateways) {
      if (!gw.name) continue;

      try {
        const url = `${TTS_SERVER}/api/v3/gs/gateways/${gw.name}/connection/stats`;
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${TTS_GATEWAY_API_KEY}` },
          timeout: 5000
        });

        const stats = res.data;
        
        // If the API returns stats successfully, the gateway is connected/has recently connected
        const lastStatusReceived = stats.last_status_received_at || stats.connected_at;
        
        if (lastStatusReceived) {
          await pool.query(
            "UPDATE gateways SET connection_status = ?, last_seen = ? WHERE id = ?",
            [true, new Date(lastStatusReceived), gw.id]
          );
        }
      } catch (err) {
        // If TTS returns 404 or connection refused, mark it offline
        if (err.response && (err.response.status === 404 || err.response.status === 503)) {
          await pool.query(
            "UPDATE gateways SET connection_status = ? WHERE id = ?",
            [false, gw.id]
          );
        } else {
          console.error(`❌ Failed to poll status for gateway ${gw.name}:`, err.message);
        }
      }
    }
  } catch (err) {
    console.error("❌ Gateway status polling error:", err.message);
  }
}

function initGatewayPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
  }
  
  console.log("📡 Initializing gateway status polling...");
  
  // Run immediately on startup
  pollGatewayStatus();
  
  // Then run periodically
  pollInterval = setInterval(pollGatewayStatus, POLLING_INTERVAL_MS);
}

module.exports = {
  initGatewayPolling
};
