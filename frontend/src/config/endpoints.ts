export const SERVER_IP = '13.205.43.53';

// ─── API Endpoints ────────────────────────────────────────────────────────────
export const ENDPOINTS = {
  tts: {
    console:  `http://${SERVER_IP}/console`,
  },
  nodered: { base: '/nr-api' },
};

// ─── Device Config ────────────────────────────────────────────────────────────
export const DEVICE_CONFIG = {
  appId:       'hbeon-app-001',
  endDeviceId: 'streetlight-01',
};

export const DEVICE_LOCATIONS: Record<string, { lat: number; lng: number; label: string }> = {
  'streetlight-01': {
    lat:   28.4859,
    lng:   77.5342,
    label: 'Plot B-6/5, Surajpur Site V — Greater Noida, UP 201306',
  },
};



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
