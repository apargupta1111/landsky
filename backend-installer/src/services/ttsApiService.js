/**
 * TTS API Service — direct HTTP calls to The Things Stack API.
 * 
 * After DB integration, only sendDownlink remains.
 * Device and gateway queries now come from the database.
 */

const axios = require("axios");

const TTS_SERVER = process.env.TTS_SERVER || "http://13.205.43.53:1885";
const TTS_APP_ID = process.env.TTS_APP_ID || "hbeon-app-001";
const TTS_API_KEY = process.env.TTS_API_KEY || "";

const headers = {
  Authorization: `Bearer ${TTS_API_KEY}`,
  "Content-Type": "application/json",
};

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
  sendDownlink,
};
