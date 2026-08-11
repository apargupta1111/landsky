import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchTelemetry } from '../services/backendTelemetry';
import type { TelemetryData } from '../services/backendTelemetry';

interface UseTelemetryReturn {
  data: TelemetryData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
}

const POLL_INTERVAL_MS = 5000; // 5-second live polling

export function useTelemetry(deviceId?: string | null): UseTelemetryReturn {
  const [data, setData] = useState<TelemetryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    // fetchTelemetry never throws — it returns {} on any error
    const result = await fetchTelemetry(deviceId ?? undefined);
    const hasData = Object.keys(result).length > 0;
    setData(hasData ? result : null);
    if (hasData) {
      setLastUpdated(new Date());
      setError(null);
    }
    setIsLoading(false);
  }, [deviceId]);

  useEffect(() => {
    setTimeout(load, 0);
    intervalRef.current = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [load]);

  return { data, isLoading, error, lastUpdated, refresh: load };
}

// Helper: safely extract the latest value from a telemetry key
export function tlv(data: TelemetryData | null | undefined, key: string, fallback = '–'): string {
  const arr = data?.[key];
  if (!arr?.length) return fallback;
  const val = arr[0].value;
  return val === '–' || val === '' || val === null ? fallback : val;
}
