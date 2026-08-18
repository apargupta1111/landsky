import { useState, useEffect, useCallback } from 'react';
import type { Schedule } from '../components/lightsData/types';
import { ENDPOINTS } from '../config/endpoints';

export function useSchedule(lightId: string) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const fetchSchedules = useCallback(async () => {
    try {
      const SERVER_IP = import.meta.env.VITE_SERVER_IP || 'http://localhost:3000';
      const res = await fetch(`${SERVER_IP}/api/schedules?light_id=${lightId}`);
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((s: any) => ({
          id: s.id.toString(),
          lightId: s.light.toString(),
          onTime: s.start_time.substring(0, 5),
          offTime: s.stop_time.substring(0, 5),
          repeat: s.is_periodic,
          days: Array.isArray(s.days_of_week) ? s.days_of_week : (typeof s.days_of_week === 'string' ? JSON.parse(s.days_of_week) : []),
          brightness: s.brightness !== undefined && s.brightness !== null ? s.brightness : 100,
          isActive: !!s.is_active,
          createdAt: s.created_at,
        }));
        setSchedules(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch schedules', err);
    }
  }, [lightId]);

  useEffect(() => {
    setTimeout(fetchSchedules, 0);
  }, [fetchSchedules]);

  // Form state
  const [onTime,  setOnTime]  = useState('18:00');
  const [offTime, setOffTime] = useState('06:00');
  const [repeat,  setRepeat]  = useState<Schedule['repeat']>('daily');
  const [days,    setDays]    = useState<number[]>([1, 2, 3, 4, 5]);
  const [brightness, setBrightness] = useState<number>(100);
  const [saved,   setSaved]   = useState(false);

  const lightSchedules = schedules;

  const add = async () => {
    try {
      const payload = {
        light: lightId,
        is_periodic: repeat,
        start_time: onTime + ':00',
        stop_time: offTime + ':00',
        days_of_week: repeat === 'custom' ? days : [],
        brightness: brightness,
        is_active: true
      };
      const res = await fetch(`${ENDPOINTS.backend.base}/api/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        fetchSchedules();
      }
    } catch (err) {
      console.error('Failed to add schedule', err);
    }
  };

  const toggle = async (id: string) => {
    const s = schedules.find(x => x.id === id);
    if (!s) return;
    try {
      await fetch(`${ENDPOINTS.backend.base}/api/schedules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !s.isActive })
      });
      fetchSchedules();
    } catch (err) {
      console.error('Failed to toggle schedule', err);
    }
  };

  const remove = async (id: string) => {
    try {
      await fetch(`${ENDPOINTS.backend.base}/api/schedules/${id}`, { method: 'DELETE' });
      fetchSchedules();
    } catch (err) {
      console.error('Failed to remove schedule', err);
    }
  };

  const toggleDay = (d: number) =>
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()
    );

  return {
    lightSchedules,
    // form
    onTime, setOnTime,
    offTime, setOffTime,
    repeat, setRepeat,
    days, toggleDay,
    brightness, setBrightness,
    saved, add, toggle, remove
  };
}
