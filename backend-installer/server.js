require("dotenv").config();

const app = require("./src/app");
const { initMqttClient } = require("./src/services/mqttService");
const { initTelemetryStore, loadFromDb } = require("./src/services/telemetryStore");
const { initCommandStore } = require("./src/services/commandStore");
const { initScheduleDispatcher } = require("./src/services/scheduleDispatcher");

const PORT = process.env.PORT || 5000;

// Initialize the in-memory telemetry store and command store
initTelemetryStore();
initCommandStore();

// Load from DB then start MQTT and listen
loadFromDb().then(() => {
  // Connect to TTS MQTT for live uplink telemetry
  initMqttClient();
  
  // Start schedule dispatcher
  initScheduleDispatcher();
  
  app.listen(PORT, () => {
    console.log(`✅ Smartlight backend running on port ${PORT}`);
    console.log(`📡 TTS Server: ${process.env.TTS_SERVER}`);
    console.log(`🔌 MQTT Host:  ${process.env.TTS_MQTT_HOST}:${process.env.TTS_MQTT_PORT}`);
  });
}).catch(err => {
  console.error("Failed to start server:", err);
});