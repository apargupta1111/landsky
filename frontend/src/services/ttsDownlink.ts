/**
 * ttsDownlink.ts
 * Sends LoRaWAN downlink frames directly to The Things Stack REST API.
 * This bypasses the broken ThingsBoard RPC path in Node-RED.
 *
 * TTS Downlink endpoint:
 *   POST /api/v3/as/applications/{app_id}/devices/{device_id}/down/push
 *   Authorization: Bearer <downlink-key>
 *
 * MS51FB9AE driver command encoding (FPort 10):
 *   Byte 0: Command ID
 *   Byte 1+: Parameters (if any)
 */

import { ENDPOINTS, TTS_API_KEY, DEVICE_CONFIG } from '../config/endpoints';

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
export const POWER_ON_HEX  = '0100C8'; // cmd=01, level=200 (0xC8)

/** Power OFF: dim-to-off (level 0) */
export const POWER_OFF_HEX = '010000'; // cmd=01, level=0

/** Reset driver */
export const RESET_HEX = 'FF';         // cmd=FF (driver reset)

// ─── Downlink Sender ──────────────────────────────────────────────────────────

interface DownlinkResult {
  ok: boolean;
  error?: string;
}

// ─── Send via Node-RED HTTP endpoint ─────────────────────────────────────────
// Node-RED (port 1880) has no auth and internally routes to TTS MQTT.
// Vite proxy: /nr-api → http://13.205.43.53:1880

export async function sendControlCommand(method: string, value?: number): Promise<DownlinkResult> {
  try {
    const res = await fetch('/nr-api/smartlight/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method, value: value ?? 0 }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('[Control] Node-RED error:', res.status, text);
      return { ok: false, error: `HTTP ${res.status}: ${text}` };
    }
    console.log(`[Control] Sent ${method}(${value}) via Node-RED`);
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Control] Fetch error:', msg);
    return { ok: false, error: msg };
  }
}

// ─── High-Level Command API ───────────────────────────────────────────────────

export const ttsCommands = {
  setDimming:    (level: number)  => sendControlCommand('setDimming',    level),
  setMaxCurrent: (pct: number)    => sendControlCommand('setMaxCurrent', pct),
  powerOn:       ()               => sendControlCommand('powerOn'),
  powerOff:      ()               => sendControlCommand('powerOff'),
  resetDriver:   ()               => sendControlCommand('resetDriver'),
};
