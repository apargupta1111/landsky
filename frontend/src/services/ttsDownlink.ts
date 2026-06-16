

import { ENDPOINTS, TTS_API_KEY } from '../config/endpoints';

// ─── Hex Encoders for MS51 Driver Commands ────────────────────────────────────

/** Set Digital Dimming Level: value 0-200 (200 = 100% brightness) */
export function encodeSetDimming(level: number): string {
  const clamped = Math.max(0, Math.min(200, Math.round(level)));
  return `01${clamped.toString(16).padStart(2, '0').toUpperCase()}`;
}

/** Set Max Current: percentage 10-100 maps to 0x0A–0x64 */
export function encodeSetMaxCurrent(pct: number): string {
  const clamped = Math.max(10, Math.min(100, Math.round(pct)));
  return `02${clamped.toString(16).padStart(2, '0').toUpperCase()}`;
}

/** Power ON: set dimming to max (200) */
export const POWER_ON_HEX = '0100C8'; // cmd=01, level=200 (0xC8)

/** Power OFF: dim-to-off (level 0) */
export const POWER_OFF_HEX = '010000'; // cmd=01, level=0

/** Reset driver */
export const RESET_HEX = 'FF';         // cmd=FF (driver reset)

// ─── Downlink Sender ──────────────────────────────────────────────────────────

interface DownlinkResult {
  ok: boolean;
  error?: string;
}


export async function sendControlCommand(deviceId: string, method: string, value?: number): Promise<DownlinkResult> {
  try {
    const topic = deviceId.replace('-', ''); // 
    const res = await fetch(`${ENDPOINTS.nodered.base}/smartlight/control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: deviceId, topic, method, value: value ?? 0 }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('[Control] Node-RED error:', res.status, text);
      return { ok: false, error: `HTTP ${res.status}: ${text}` };
    }
    console.log(`[Control] Sent ${method}(${value}) for ${deviceId} (topic: ${topic}) via Node-RED`);
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Control] Fetch error:', msg);
    return { ok: false, error: msg };
  }
}

// ─── High-Level Command API ───────────────────────────────────────────────────

export const ttsCommands = {
  setDimming: (deviceId: string, level: number) => sendControlCommand(deviceId, 'setDimming', level),
  setMaxCurrent: (deviceId: string, pct: number) => sendControlCommand(deviceId, 'setMaxCurrent', pct),
  powerOn: (deviceId: string) => sendControlCommand(deviceId, 'powerOn'),
  powerOff: (deviceId: string) => sendControlCommand(deviceId, 'powerOff'),
  resetDriver: (deviceId: string) => sendControlCommand(deviceId, 'resetDriver'),
};
