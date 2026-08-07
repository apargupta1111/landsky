const express = require("express");
const cors = require("cors");

// Route imports
const telemetryRoutes = require("./routes/telemetryRoutes");
const controlRoutes = require("./routes/controlRoutes");
const deviceRoutes = require("./routes/deviceRoutes");
const lightRoutes = require("./routes/lightRoutes");

// New Route imports
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const gatewayRoutesDb = require("./routes/gatewayRoutesDb");
const scheduleRoutes = require("./routes/scheduleRoutes");
const alertRoutes = require("./routes/alertRoutes");
const actionLogRoutes = require("./routes/actionLogRoutes");
const qrRoutes = require("./routes/qrRoutes");
const lightStatusRoutes = require("./routes/lightStatusRoutes");

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Health check ───────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── API Routes ─────────────────────────────────────────────────────────────────

// Auth & Users
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Telemetry & Control (legacy structure)
app.use("/smartlight", telemetryRoutes);
app.use("/smartlight", controlRoutes);

// Devices
app.use("/api/devices", deviceRoutes);

// Gateways (DB-backed)
app.use("/gateways", gatewayRoutesDb); // keep /gateways for frontend compatibility, or use /api/gateways. Wait, frontend uses /gateways and /api/gateways. Let's provide both or update frontend. The task says fetch from /api/gateways in frontend. So let's use /api/gateways.
app.use("/api/gateways", gatewayRoutesDb);

// Lights
app.use("/api/lights", lightRoutes);~

// Schedules, Alerts, Action Logs, QR, Light Status
app.use("/api/schedules", scheduleRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/action-logs", actionLogRoutes);
app.use("/api/qr", qrRoutes);
app.use("/api/light-status", lightStatusRoutes);

module.exports = app;