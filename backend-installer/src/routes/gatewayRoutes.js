/**
 * Gateway Routes — queries TTS for gateway information.
 * 
 * The frontend's gatewayStore fetches from: GET /gateways
 */

const express = require("express");
const router = express.Router();
const { listGateways } = require("../services/ttsApiService");

/**
 * GET /gateways
 * Returns all gateways visible to the API key, formatted for the frontend.
 */
router.get("/", async (req, res) => {
  try {
    const gateways = await listGateways();

    // Transform TTS gateway format to frontend-friendly format
    const formatted = gateways.map((gw) => {
      const antenna = gw.antennas && gw.antennas.length > 0 ? gw.antennas[0] : null;
      const lat = antenna?.location?.latitude || 0;
      const lng = antenna?.location?.longitude || 0;

      return {
        eui: gw.ids?.eui || gw.ids?.gateway_id || "",
        tenantId: 0,
        name: gw.name || gw.ids?.gateway_id || "",
        description: gw.description || "",
        region: (gw.frequency_plan_ids && gw.frequency_plan_ids[0]) || "",
        connectionStatus: true, // TTS doesn't expose this easily via REST; default to true
        lastSeen: gw.updated_at || "",
        location: { x: lng, y: lat },
        installedAt: gw.created_at || "",
        installedBy: 0,
        createdAt: gw.created_at || "",
        updatedAt: gw.updated_at || "",
        connectedLights: 0,
        onlineLights: 0,
        faults: 0,
        signal: -70, // Default signal strength
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error("❌ Error listing gateways:", err.response?.data || err.message);
    // Return empty array on error so frontend doesn't break
    res.json([]);
  }
});

module.exports = router;
