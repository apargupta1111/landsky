/**
 * TTS API Service — direct HTTP calls to The Things Stack API.
 * 
 * Handles:
 *   - Device queries (list, get)
 *   - Gateway queries  
 *   - Downlink command scheduling
 */

const axios = require("axios");

const TTS_SERVER = process.env.TTS_SERVER || "http://13.205.43.53:1885";
const TTS_APP_ID = process.env.TTS_APP_ID || "hbeon-app-001";
const TTS_API_KEY = process.env.TTS_API_KEY || "";

const headers = {
  Authorization: `Bearer ${TTS_API_KEY}`,
  "Content-Type": "application/json",
};

// ── Device Operations ──────────────────────────────────────────────────────────

/**
 * List all end devices for the application.
 */
async function listDevices() {
  const url = `${TTS_SERVER}/api/v3/applications/${TTS_APP_ID}/devices`;
  const res = await axios.get(url, {
    headers,
    params: {
      field_mask: "name,description,attributes,locations",
    },
  });
  return res.data.end_devices || [];
}

/**
 * Get details for a specific device.
 * @param {string} deviceId - e.g. "streetlight-01"
 */
async function getDevice(deviceId) {
  const url = `${TTS_SERVER}/api/v3/applications/${TTS_APP_ID}/devices/${deviceId}`;
  const res = await axios.get(url, {
    headers,
    params: {
      field_mask: "name,description,attributes,locations,version_ids",
    },
  });
  return res.data;
}

// ── Gateway Operations ─────────────────────────────────────────────────────────

/**
 * List all gateways visible to this API key.
 */
async function listGateways() {
  const url = `${TTS_SERVER}/api/v3/gateways`;
  const res = await axios.get(url, {
    headers,
    params: {
      field_mask: "name,description,gateway_server_address,frequency_plan_ids,status_public,location_public,antennas",
    },
  });
  return res.data.gateways || [];
}

// ── Downlink Operations ────────────────────────────────────────────────────────

/**
 * Send a downlink command to a device via TTS Application Server.
 * 
 * @param {string} deviceId  - e.g. "streetlight-01"
 * @param {string} hexPayload - hex-encoded payload e.g. "01C8" for dimming
 * @param {number} fPort - LoRaWAN port (default: 1)
 */
async function sendDownlink(deviceId, hexPayload, fPort = 1) {
  // Convert hex to base64
  const base64Payload = Buffer.from(hexPayload, "hex").toString("base64");

  const url = `${TTS_SERVER}/api/v3/as/applications/${TTS_APP_ID}/devices/${deviceId}/down/push`;

  const body = {
    downlinks: [
      {
        f_port: fPort,
        frm_payload: base64Payload,
        priority: "NORMAL",
      },
    ],
  };

  const res = await axios.post(url, body, { headers });
  return res.data;
}

module.exports = {
  listDevices,
  getDevice,
  listGateways,
  sendDownlink,
};
