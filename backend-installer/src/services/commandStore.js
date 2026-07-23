// In-memory cache
let store = {};

function initCommandStore() {
  console.log('📦 Command store initialized (in-memory)');
  store = {};
}

function setTargetCommand(deviceId, method, expectedBrightness, hexPayload) {
  const key = deviceId.replace(/-/g, "");
  store[key] = {
    device_id: deviceId,
    method,
    expectedBrightness,
    hexPayload,
    ts: Date.now(),
    retryCount: 0
  };
}

function getTargetCommand(deviceId) {
  const key = deviceId.replace(/-/g, "");
  return store[key] || null;
}

function clearTargetCommand(deviceId) {
  const key = deviceId.replace(/-/g, "");
  if (store[key]) {
    delete store[key];
  }
}

function incrementRetry(deviceId) {
  const key = deviceId.replace(/-/g, "");
  if (store[key]) {
    store[key].retryCount = (store[key].retryCount || 0) + 1;
  }
}

module.exports = {
  initCommandStore,
  setTargetCommand,
  getTargetCommand,
  clearTargetCommand,
  incrementRetry
};
