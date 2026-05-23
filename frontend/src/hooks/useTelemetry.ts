import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchTelemetry } from '../services/thingsboard';
import type { TelemetryData } from '../services/thingsboard';

interface UseTelemetryReturn {
  data: TelemetryData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
}

const POLL_INTERVAL_MS = 5000; // 5-second live polling

export function useTelemetry(deviceId: string | null | undefined): UseTelemetryReturn {
  const [data, setData] = useState<TelemetryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    if (!deviceId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchTelemetry(deviceId);
      setData(result);
      setLastUpdated(new Date());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    if (!deviceId) return;
    load();
    intervalRef.current = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [deviceId, load]);

  return { data, isLoading, error, lastUpdated, refresh: load };
}

// Helper: safely extract the latest value from a telemetry key
export function tlv(data: TelemetryData | null, key: string, fallback = '–'): string {
  const arr = data?.[key];
  if (!arr?.length) return fallback;
  return arr[0].value;
}
