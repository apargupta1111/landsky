import { useState, useCallback, useEffect } from 'react';
import { onMqttStatus, getMqttClient } from '../services/mqttClient';
import type { MqttConnectionStatus } from '../services/mqttClient';
import { ttsCommands } from '../services/ttsDownlink';
import { MQTT_ENABLED } from '../config/endpoints';

type CommandStatus = 'idle' | 'sending' | 'success' | 'error';

interface UseLightControlReturn {
  status: CommandStatus;
  mqttStatus: MqttConnectionStatus;
  errorMsg: string | null;
  setDimmingLevel: (level: number) => Promise<void>;
  setMaxCurrent: (percent: number) => Promise<void>;
  setDimmingMode: (mode: string) => Promise<void>;
  resetDriver: () => Promise<void>;
  powerOn: () => Promise<void>;
  powerOff: () => Promise<void>;
}

export function useLightControl(): UseLightControlReturn {
  const [status, setStatus] = useState<CommandStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mqttStatus, setMqttStatus] = useState<MqttConnectionStatus>('disconnected');

  useEffect(() => {
    if (MQTT_ENABLED) getMqttClient();
    const unsub = onMqttStatus(setMqttStatus);
    return unsub;
  }, []);

  // Wraps a TTS downlink call with UI status feedback
  const send = useCallback(
    async (fn: () => Promise<{ ok: boolean; error?: string }>) => {
      setStatus('sending');
      setErrorMsg(null);
      const result = await fn();
      if (result.ok) {
        setStatus('success');
        setTimeout(() => setStatus('idle'), 2500);
      } else {
        setStatus('error');
        setErrorMsg(result.error ?? 'Downlink failed');
        setTimeout(() => setStatus('idle'), 4000);
      }
    },
    []
  );

  return {
    status,
    mqttStatus,
    errorMsg,
    setDimmingLevel: (level)   => send(() => ttsCommands.setDimming(level)),
    setMaxCurrent:   (percent) => send(() => ttsCommands.setMaxCurrent(percent)),
    setDimmingMode:  (_mode)   => send(() => ttsCommands.setDimming(150)), // mode switch → reset to 75%
    resetDriver:     ()        => send(() => ttsCommands.resetDriver()),
    powerOn:         ()        => send(() => ttsCommands.powerOn()),
    powerOff:        ()        => send(() => ttsCommands.powerOff()),
  };
}
