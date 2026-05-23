import { ENDPOINTS, TB_CREDENTIALS, TELEMETRY_KEYS } from '../config/endpoints';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TelemetryValue {
  ts: number;
  value: string;
}

export interface TelemetryData {
  output_current_mA?:    TelemetryValue[];
  output_voltage_V?:     TelemetryValue[];
  led_power_W?:          TelemetryValue[];
  input_current_mA?:     TelemetryValue[];
  input_voltage_V?:      TelemetryValue[];
  input_power_W?:        TelemetryValue[];
  input_frequency_Hz?:   TelemetryValue[];
  internal_temp_C?:      TelemetryValue[];
  lamp_on_time_hours?:   TelemetryValue[];
  operating_time_hours?: TelemetryValue[];
  brightness_percent?:   TelemetryValue[];
  power_factor?:         TelemetryValue[];
  rssi?:                 TelemetryValue[];
  snr?:                  TelemetryValue[];
  [key: string]: TelemetryValue[] | undefined; // index signature for tlv() helper
}


// ─── Auth ────────────────────────────────────────────────────────────────────

let _token: string | null = null;
let _tokenExpiry = 0;

export async function getToken(): Promise<string> {
  if (_token && Date.now() < _tokenExpiry) return _token;

  const res = await fetch(`${ENDPOINTS.thingsboard.base}${ENDPOINTS.thingsboard.auth}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TB_CREDENTIALS),
  });

  if (!res.ok) throw new Error(`TB Auth failed: ${res.status}`);
  const data = await res.json();
  _token = data.token;
  _tokenExpiry = Date.now() + 55 * 60 * 1000; // 55-min TTL
  return _token!;
}

// ─── Telemetry ────────────────────────────────────────────────────────────────

export async function fetchTelemetry(deviceId: string): Promise<TelemetryData> {
  const token = await getToken();

  // Fetch the 'raw' key — Node-RED stores the full TTS uplink as a JSON blob
  const url = `${ENDPOINTS.thingsboard.base}/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?keys=raw`;
  const res = await fetch(url, {
    headers: { 'X-Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Telemetry fetch failed: ${res.status}`);

  const raw = await res.json();

  // raw.raw[0].value is a JSON-stringified array: [{raw: "\"...\""}, {device_id: "..."}]
  // We need to parse it to get decoded_payload
  try {
    const rawStr: string = raw?.raw?.[0]?.value ?? '[]';
    const outerArr = JSON.parse(rawStr);                   // outer array
    const innerJsonStr: string = outerArr?.[0]?.raw ?? '{}'; // inner JSON string
    const innerParsed = JSON.parse(innerJsonStr);          // full TTS uplink object
    const dp = innerParsed?.uplink_message?.decoded_payload ?? {};
    const rxMeta = innerParsed?.uplink_message?.rx_metadata?.[0] ?? {};

    const ts = raw?.raw?.[0]?.ts ?? Date.now();

    // Map decoded_payload fields → TelemetryData shape
    const make = (v: unknown): TelemetryValue[] => [{ ts, value: String(v ?? '–') }];

    return {
      output_current_mA:    make(dp.output_current_mA),
      output_voltage_V:     make(dp.output_voltage_V),
      led_power_W:          make(dp.led_power_W),
      input_current_mA:     make(dp.input_current_mA),
      input_voltage_V:      make(dp.input_voltage_V),
      input_power_W:        make(dp.input_power_W),
      input_frequency_Hz:   make(dp.input_frequency_Hz),
      internal_temp_C:      make(dp.internal_temp_C),
      lamp_on_time_hours:   make(dp.lamp_on_time_hours),
      operating_time_hours: make(dp.operating_time_hours),
      brightness_percent:   make(dp.brightness_percent),
      power_factor:         make(dp.power_factor),
      rssi:                 make(rxMeta.rssi),
      snr:                  make(rxMeta.snr),
    };
  } catch (e) {
    console.warn('[TB] Failed to parse raw telemetry:', e);
    return {};
  }
}


// ─── RPC Commands (Downlink) ──────────────────────────────────────────────────

export interface RpcCommand {
  method: string;
  params?: Record<string, unknown>;
  timeout?: number;
}

export async function sendRpc(deviceId: string, command: RpcCommand): Promise<void> {
  const token = await getToken();
  const url = `${ENDPOINTS.thingsboard.base}${ENDPOINTS.thingsboard.rpc(deviceId)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      method: command.method,
      params: command.params ?? {},
      timeout: command.timeout ?? 5000,
    }),
  });
  if (!res.ok) throw new Error(`RPC failed: ${res.status} - ${await res.text()}`);
}

// ─── Named Commands ──────────────────────────────────────────────────────────

export const LightCommands = {
  setDimmingLevel: (deviceId: string, level: number) =>
    sendRpc(deviceId, { method: 'setDimmingLevel', params: { level } }),

  setMaxCurrent: (deviceId: string, percent: number) =>
    sendRpc(deviceId, { method: 'setMaxCurrent', params: { percent } }),

  setDimmingMode: (deviceId: string, mode: string) =>
    sendRpc(deviceId, { method: 'setDimmingMode', params: { mode } }),

  resetDriver: (deviceId: string) =>
    sendRpc(deviceId, { method: 'resetDriver' }),

  powerOn: (deviceId: string) =>
    sendRpc(deviceId, { method: 'setDimmingLevel', params: { level: 200 } }),

  powerOff: (deviceId: string) =>
    sendRpc(deviceId, { method: 'setDimmingLevel', params: { level: 0 } }),
};
