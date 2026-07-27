/**
 * Backend Telemetry Service
 * Fetches live telemetry from the custom Node.js backend (not Node-RED).
 * Routes: GET /smartlight/:deviceId/data  and  GET /smartlight/all-data
 */

import { ENDPOINTS } from '../config/endpoints';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TelemetryValue {
  ts: number;
  value: string;
}

export interface TelemetryData {
  brightness_percent?: TelemetryValue[];
  output_current_mA?: TelemetryValue[];
  output_voltage_V?: TelemetryValue[];
  led_power_W?: TelemetryValue[];
  input_current_mA?: TelemetryValue[];
  input_voltage_V?: TelemetryValue[];
  input_power_W?: TelemetryValue[];
  input_frequency_Hz?: TelemetryValue[];
  internal_temp_C?: TelemetryValue[];
  lamp_on_time_hours?: TelemetryValue[];
  operating_time_hours?: TelemetryValue[];
  power_factor?: TelemetryValue[];
  rssi?: TelemetryValue[];
  snr?: TelemetryValue[];
  fault_status?: TelemetryValue[];
  led_mode?: TelemetryValue[];
  relay_state?: TelemetryValue[];
  [key: string]: TelemetryValue[] | undefined;
}

// Raw flat JSON shape returned by the backend
interface BackendPayload {
  brightness_percent?: number | null;
  output_current_mA?: number | null;
  output_voltage_V?: number | null;
  led_power_W?: number | null;
  input_current_mA?: number | null;
  input_voltage_V?: number | null;
  input_power_W?: number | null;
  input_frequency_Hz?: number | null;
  internal_temp_C?: number | null;
  lamp_on_time_hours?: number | null;
  operating_time_hours?: number | null;
  power_factor?: number | null;
  rssi?: number | null;
  snr?: number | null;
  fault_status?: string | number | null;
  led_mode?: string | null;
  relay_state?: string | null;
  ts?: number;
  device_id?: string;
}

// ─── Core Fetch ───────────────────────────────────────────────────────────────

/**
 * Fetch telemetry for a specific device from the backend.
 * Returns {} gracefully if no data yet or on network error — never throws.
 */
export async function fetchTelemetry(deviceId?: string): Promise<TelemetryData> {
  const base = ENDPOINTS.backend.base;
  const url = deviceId
    ? `${base}/smartlight/${encodeURIComponent(deviceId)}/data`
    : `${base}/smartlight/data`;

  let res: Response;
  try {
    res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
  } catch {
    // Network error (backend down, etc.) — return empty silently
    return {};
  }

  // 204 = backend has not received any uplink yet
  if (res.status === 204) return {};

  if (!res.ok) {
    console.warn(`[Telemetry] HTTP ${res.status} for ${deviceId ?? 'all'}`);
    return {};
  }

  let d: BackendPayload;
  try {
    d = await res.json() as BackendPayload;
  } catch {
    console.warn('[Telemetry] Response was not valid JSON');
    return {};
  }

  return flatToTelemetryData(d);
}

/**
 * Fetch telemetry for ALL devices at once.
 * Returns a map of { deviceId → TelemetryData }.
 */
export async function fetchAllTelemetry(): Promise<Record<string, TelemetryData>> {
  const base = ENDPOINTS.backend.base;
  let res: Response;
  try {
    res = await fetch(`${base}/smartlight/all-data`, { headers: { Accept: 'application/json' } });
  } catch {
    return {};
  }

  if (!res.ok) {
    console.warn(`[Telemetry] all-data HTTP ${res.status}`);
    return {};
  }

  let raw: Record<string, BackendPayload>;
  try {
    raw = await res.json();
  } catch {
    return {};
  }

  const result: Record<string, TelemetryData> = {};
  for (const [id, payload] of Object.entries(raw)) {
    result[id] = flatToTelemetryData(payload);
  }
  return result;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function flatToTelemetryData(d: BackendPayload): TelemetryData {
  const ts = d.ts ?? Date.now();

  const makeNum = (v: number | null | undefined): TelemetryValue[] =>
    [{ ts, value: v !== null && v !== undefined ? String(v) : '–' }];

  const makeStr = (v: string | number | null | undefined): TelemetryValue[] =>
    [{ ts, value: v !== null && v !== undefined ? String(v) : '–' }];

  return {
    brightness_percent:   makeNum(d.brightness_percent),
    output_current_mA:    makeNum(d.output_current_mA),
    output_voltage_V:     makeNum(d.output_voltage_V),
    led_power_W:          makeNum(d.led_power_W),
    input_current_mA:     makeNum(d.input_current_mA),
    input_voltage_V:      makeNum(d.input_voltage_V),
    input_power_W:        makeNum(d.input_power_W),
    input_frequency_Hz:   makeNum(d.input_frequency_Hz),
    internal_temp_C:      makeNum(d.internal_temp_C),
    lamp_on_time_hours:   makeNum(d.lamp_on_time_hours),
    operating_time_hours: makeNum(d.operating_time_hours),
    power_factor:         makeNum(d.power_factor),
    rssi:                 makeNum(d.rssi),
    snr:                  makeNum(d.snr),
    fault_status:         makeStr(d.fault_status),
    led_mode:             makeStr(d.led_mode),
    relay_state:          makeStr(d.relay_state),
  };
}

/** Safely extract the latest string value from a telemetry key. */
export function tlv(data: TelemetryData | null, key: string, fallback = '–'): string {
  const arr = data?.[key];
  if (!arr?.length) return fallback;
  const val = arr[0].value;
  return val === '–' || val === '' || val === null ? fallback : val;
}

// ─── Backward-compat re-exports (used by old imports) ────────────────────────
export { fetchTelemetry as fetchNodeRedTelemetry };
