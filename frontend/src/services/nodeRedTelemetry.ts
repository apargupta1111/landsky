
import { ENDPOINTS } from '../config/endpoints';

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
  [key: string]: TelemetryValue[] | undefined;
}

// Raw shape returned by Node-RED /smartlight/data
interface NodeRedPayload {
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
  ts?: number;
  device_id?: string;
  fault_status?: string | null;
}

/**
 * Fetch the latest telemetry cached by Node-RED from TTS uplinks.
 * If deviceId is given, tries /smartlight/{deviceId}/data first,
 * then falls back to /smartlight/data.
 * Returns an empty object if no uplink has been received yet (HTTP 204).
 */
export async function fetchNodeRedTelemetry(deviceId?: string): Promise<TelemetryData> {
  // Build candidate URLs
  const urls: string[] = deviceId
    ? [
        `${ENDPOINTS.nodered.base}/smartlight/${encodeURIComponent(deviceId)}/data`,
        `${ENDPOINTS.nodered.base}/smartlight/data`,
      ]
    : [`${ENDPOINTS.nodered.base}/smartlight/data`];

  let res: Response | null = null;
  for (const url of urls) {
    try {
      const r = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
      if (r.status === 404) continue; // try next URL
      res = r;
      break;
    } catch {
      // network error on this URL — try next
    }
  }

  if (!res) throw new Error('Cannot reach Node-RED telemetry endpoint');

  // 204 = Node-RED has not received any TTS uplink yet
  if (res.status === 204) {
    console.warn('[NodeRed] No uplink cached yet (204)');
    return {};
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error(`[NodeRed] HTTP ${res.status}:`, text);
    throw new Error(`Node-RED returned HTTP ${res.status}`);
  }

  const raw = await res.text();
  console.log('[NodeRed] Raw response:', raw.slice(0, 300));

  let d: NodeRedPayload;
  try {
    d = JSON.parse(raw) as NodeRedPayload;
  } catch {
    throw new Error('Node-RED response is not valid JSON');
  }

  const ts = d.ts ?? Date.now();

  // Wrap each numeric field as a TelemetryValue array so the existing
  // tlv() helper and UI components work without any changes.
  const make = (v: number | null | undefined): TelemetryValue[] =>
    [{ ts, value: v !== null && v !== undefined ? String(v) : '–' }];

  return {
    brightness_percent: make(d.brightness_percent),
    output_current_mA: make(d.output_current_mA),
    output_voltage_V: make(d.output_voltage_V),
    led_power_W: make(d.led_power_W),
    input_current_mA: make(d.input_current_mA),
    input_voltage_V: make(d.input_voltage_V),
    input_power_W: make(d.input_power_W),
    input_frequency_Hz: make(d.input_frequency_Hz),
    internal_temp_C: make(d.internal_temp_C),
    lamp_on_time_hours: make(d.lamp_on_time_hours),
    operating_time_hours: make(d.operating_time_hours),
    power_factor: make(d.power_factor),
    rssi: make(d.rssi),
    snr: make(d.snr),
  };
}

// ─── tlv helper ───────────────────────────────────────────────────────────────
/** Safely extract the latest string value from a telemetry key. */
export function tlv(data: TelemetryData | null, key: string, fallback = '–'): string {
  const arr = data?.[key];
  if (!arr?.length) return fallback;
  const val = arr[0].value;
  return val === '–' || val === '' || val === null ? fallback : val;
}
