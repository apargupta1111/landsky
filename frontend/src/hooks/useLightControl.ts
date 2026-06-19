import { useState, useCallback } from 'react';
import { ttsCommands } from '../services/ttsDownlink';

type CommandStatus = 'idle' | 'sending' | 'success' | 'error';

interface UseLightControlReturn {
  status: CommandStatus;
  errorMsg: string | null;
  setDimmingLevel: (level: number) => Promise<void>;
  setMaxCurrent: (percent: number) => Promise<void>;
  setDimmingMode: (mode: string) => Promise<void>;
  resetDriver: () => Promise<void>;
  powerOn: () => Promise<void>;
  powerOff: () => Promise<void>;
}

export function useLightControl(deviceId?: string | null): UseLightControlReturn {
  const [status, setStatus] = useState<CommandStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const targetId = deviceId || 'streetlight-01';

  return {
    status,
    errorMsg,
    setDimmingLevel: (level)   => send(() => ttsCommands.setDimming(targetId, level)),
    setMaxCurrent:   (percent) => send(() => ttsCommands.setMaxCurrent(targetId, percent)),
    setDimmingMode:  (_mode)   => send(() => ttsCommands.setDimming(targetId, 150)), // mode switch → reset to 75%
    resetDriver:     ()        => send(() => ttsCommands.resetDriver(targetId)),
    powerOn:         ()        => send(() => ttsCommands.powerOn(targetId)),
    powerOff:        ()        => send(() => ttsCommands.powerOff(targetId)),
  };
}
