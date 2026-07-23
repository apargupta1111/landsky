import { useState, useEffect, useCallback } from 'react';
import { ENDPOINTS } from '../config/endpoints';

export interface ColorState {
  device_id: string;
  color: 'warm' | 'white';
  ts: number | null;
}

export function useColorState(deviceId?: string | null) {
  const [colorMode, setColorMode] = useState<'warm' | 'white'>('white');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchColorState = useCallback(async () => {
    if (!deviceId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${ENDPOINTS.nodered.base}/smartlight/${deviceId}/color-state`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data: ColorState = await res.json();
      if (data.color) {
        setColorMode(data.color);
      }
    } catch (err: any) {
      console.error('Failed to fetch color state:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    fetchColorState();
    
    // Poll every 30 seconds to stay updated
    const interval = setInterval(fetchColorState, 30000);
    return () => clearInterval(interval);
  }, [fetchColorState]);

  return { colorMode, setColorMode, isLoading, error, refresh: fetchColorState };
}
