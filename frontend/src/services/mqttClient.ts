import mqtt from 'mqtt';
import type { IClientOptions } from 'mqtt';
import { MQTT_CONFIG, MQTT_ENABLED } from '../config/endpoints';

type MqttClient = ReturnType<typeof mqtt.connect>;



let client: MqttClient | null = null;
const subscribers: Map<string, Set<(payload: unknown) => void>> = new Map();

export type MqttConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'disabled';
let connectionStatus: MqttConnectionStatus = MQTT_ENABLED ? 'disconnected' : 'disabled';
const statusListeners: Set<(status: MqttConnectionStatus) => void> = new Set();

function notifyStatus(s: MqttConnectionStatus) {
  connectionStatus = s;
  statusListeners.forEach((fn) => fn(s));
}

export function getMqttClient(): MqttClient | null {
  if (!MQTT_ENABLED) return null;
  if (client) return client;

  notifyStatus('connecting');

  client = mqtt.connect(
    MQTT_CONFIG.brokerUrl,
    MQTT_CONFIG.options as IClientOptions
  );

  client.on('connect', () => {
    console.log('[MQTT] Connected to broker');
    notifyStatus('connected');
    subscribers.forEach((_, topic) => client?.subscribe(topic, { qos: 1 }));
  });

  client.on('error', (err) => {
    console.error('[MQTT] Error:', err.message);
    notifyStatus('error');
  });

  client.on('close', () => notifyStatus('disconnected'));
  client.on('reconnect', () => notifyStatus('connecting'));

  client.on('message', (topic, message) => {
    const topicSubs = subscribers.get(topic);
    if (!topicSubs?.size) return;
    let parsed: unknown = message.toString();
    try { parsed = JSON.parse(message.toString()); } catch { /* keep as string */ }
    topicSubs.forEach((fn) => fn(parsed));
  });

  return client;
}

// ─── Publish ─────────────────────────────────────────────────────────────────

export async function mqttPublish(topic: string, payload: unknown, qos: 0 | 1 | 2 = 1): Promise<void> {
  const c = getMqttClient();
  if (!c) throw new Error('MQTT is disabled. Enable it in endpoints.ts once the broker is running.');
  return new Promise((resolve, reject) => {
    const raw = typeof payload === 'string' ? payload : JSON.stringify(payload);
    c.publish(topic, raw, { qos }, (err) => { if (err) reject(err); else resolve(); });
  });
}

// ─── Subscribe ───────────────────────────────────────────────────────────────

export function mqttSubscribe(topic: string, callback: (payload: unknown) => void): () => void {
  const c = getMqttClient();
  if (!c) return () => {}; // no-op when disabled
  if (!subscribers.has(topic)) subscribers.set(topic, new Set());
  subscribers.get(topic)!.add(callback);
  c.subscribe(topic, { qos: 1 });
  return () => {
    subscribers.get(topic)?.delete(callback);
    if (!subscribers.get(topic)?.size) { subscribers.delete(topic); c.unsubscribe(topic); }
  };
}

// ─── Connection Status ────────────────────────────────────────────────────────

export function onMqttStatus(fn: (s: MqttConnectionStatus) => void): () => void {
  statusListeners.add(fn);
  fn(connectionStatus);
  return () => statusListeners.delete(fn);
}
