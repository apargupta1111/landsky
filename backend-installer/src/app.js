const express = require("express");
const cors = require("cors");

// Route imports
const telemetryRoutes = require("./routes/telemetryRoutes");
const controlRoutes = require("./routes/controlRoutes");
const deviceRoutes = require("./routes/deviceRoutes");
const gatewayRoutes = require("./routes/gatewayRoutes");
const lightRoutes = require("./routes/lightRoutes");

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Health check ───────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── API Routes ─────────────────────────────────────────────────────────────────

// Telemetry — replaces Node-RED /smartlight/data and /smartlight/:deviceId/data
app.use("/smartlight", telemetryRoutes);

// Control — replaces Node-RED /smartlight/control
app.use("/smartlight", controlRoutes);

// Devices — direct TTS device queries
app.use("/api/devices", deviceRoutes);

// Gateways — direct TTS gateway queries
app.use("/gateways", gatewayRoutes);

// Lights (DB-backed)
app.use("/api/lights", lightRoutes);

module.exports = app;