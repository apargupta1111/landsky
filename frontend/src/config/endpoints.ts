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
export const ENDPOINTS = {
  tts: {
    console:  `http://${SERVER_IP}/console`,
    downlink: `http://${SERVER_IP}/api/v3/as/applications/${encodeURIComponent('hbeon-app-001')}/devices/${encodeURIComponent('streetlight-01')}/down/push`,
  },
  nodered: { base: `http://${SERVER_IP}:1880` },
  grafana:  `http://${SERVER_IP}:3000`,
  influx:   `http://${SERVER_IP}:8086`,
};

// ─── Device Config ────────────────────────────────────────────────────────────
export const DEVICE_CONFIG = {
  appId:       'hbeon-app-001',
  endDeviceId: 'streetlight-01',
};

// ─── Known Device Locations ───────────────────────────────────────────────────
// Update lat/lng if the physical device moves.
export const DEVICE_LOCATIONS: Record<string, { lat: number; lng: number; label: string }> = {
  'streetlight-01': {
    lat:   28.4859,
    lng:   77.5342,
    label: 'Plot B-6/5, Surajpur Site V — Greater Noida, UP 201306',
  },
};

// ─── TTS API Keys ─────────────────────────────────────────────────────────────
// downlink-key: Write downlink traffic — used to push LoRaWAN downlinks from the UI
export const TTS_API_KEY = 'EOSMYP45ZVPEMUIN5SYJBV5QHJN2A45ZLIQPTBA.266MD3YHDERW6SCKHUF7XSSPDUUL6RNJ7JULIMZWOQ2O7HFKZA';



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
