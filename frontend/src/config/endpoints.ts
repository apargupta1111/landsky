export const SERVER_IP = '13.205.43.53';

// ─── MQTT (WebSocket) ─────────────────────────────────────────────────────────
// Set to true once Mosquitto WebSocket is configured on the server (port 9001)
export const MQTT_ENABLED = false;

export const MQTT_CONFIG = {
  brokerUrl: `ws://${SERVER_IP}:9001/mqtt`,
  options: {
    clientId: `smartlight-ui-${Math.random().toString(16).slice(2, 8)}`,
    clean: true,
    reconnectPeriod: 0,   // 0 = no auto-retry until broker is ready
    connectTimeout: 5000,
  },
  topics: {
    control:   'smartlight/control',
    telemetry: 'smartlight/telemetry',
    status:    'smartlight/status',
  },
};

// ─── API Endpoints ────────────────────────────────────────────────────────────
// ThingsBoard uses the Vite dev proxy (/tb-api) to avoid CORS
// TTS uses the Vite dev proxy (/tts-api) to avoid CORS
export const ENDPOINTS = {
  thingsboard: {
    base: `/tb-api`,
    auth: `/api/auth/login`,
    telemetry: (deviceId: string, keys: string) =>
      `/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?keys=${keys}`,
    latestTelemetry: (deviceId: string) =>
      `/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries`,
    rpc: (deviceId: string) => `/api/rpc/oneway/${deviceId}`,
  },
  tts: {
    console: `http://${SERVER_IP}/console`,
    // Downlink via TTS REST API — proxied to avoid CORS
    downlink: `/tts-api/api/v3/as/applications/${encodeURIComponent('hbeon-app-001')}/devices/${encodeURIComponent('streetlight-01')}/down/push`,
  },
  nodered: { base: `http://${SERVER_IP}:1880` },
  grafana:  `http://${SERVER_IP}:3000`,
  influx:   `http://${SERVER_IP}:8086`,
};

// ─── ThingsBoard Credentials ──────────────────────────────────────────────────
export const TB_CREDENTIALS = {
  username: 'tenant@thingsboard.org',
  password: 'tenant',
};

// ─── Device Config ────────────────────────────────────────────────────────────
export const DEVICE_CONFIG = {
  appId:        'hbeon-app-001',
  endDeviceId:  'streetlight-01',
  tbDeviceId:   '3b67b880-405f-11f1-9d14-d187f9be3e4e',
  tbAccessToken:'oglxw7243ovqjp13wu9i', // Used for ThingsBoard MQTT (internal)
};

// ─── TTS API Keys ─────────────────────────────────────────────────────────────
// downlink-key: Write downlink traffic — used to push LoRaWAN downlinks from the UI
export const TTS_API_KEY = 'EOSMYP45ZVPEMUIN5SYJBV5QHJN2A45ZLIQPTBA.266MD3YHDERW6SCKHUF7XSSPDUUL6RNJ7JULIMZWOQ2O7HFKZA';

// ─── Telemetry Keys (must match Node-RED "Format for TB" output) ──────────────
export const TELEMETRY_KEYS = [
  'output_current_mA',
  'output_voltage_V',
  'led_power_W',
  'input_frequency_Hz',
  'input_current_mA',
  'input_voltage_V',
  'input_power_W',
  'internal_temp_C',
  'lamp_on_time_hours',
  'operating_time_hours',
  'brightness_percent',
  'power_factor',
  'rssi',
  'snr',
].join(',');

export const TELEMETRY_MAP = {
  output_current_mA:    { label: 'Output Current',    unit: 'mA'  },
  output_voltage_V:     { label: 'Output Voltage',    unit: 'Vdc' },
  led_power_W:          { label: 'LED Output Power',  unit: 'W'   },
  input_current_mA:     { label: 'Input Current',     unit: 'mA'  },
  input_voltage_V:      { label: 'Input Voltage',     unit: 'Vac' },
  input_power_W:        { label: 'Input Power',       unit: 'W'   },
  input_frequency_Hz:   { label: 'Input Frequency',   unit: 'Hz'  },
  internal_temp_C:      { label: 'Internal Temp',     unit: '°C'  },
  lamp_on_time_hours:   { label: 'Lamp-On Time',      unit: 'hrs' },
  operating_time_hours: { label: 'Operating Time',    unit: 'hrs' },
  brightness_percent:   { label: 'Brightness',        unit: '%'   },
  power_factor:         { label: 'Power Factor',      unit: ''    },
  rssi:                 { label: 'RSSI',              unit: 'dBm' },
  snr:                  { label: 'SNR',               unit: 'dB'  },
};
