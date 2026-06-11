import { useState, useEffect } from 'react';
import type { Schedule } from '../components/lightsData/types';

const KEY = 'landsky_schedules';

function load(): Schedule[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); }
  catch { return []; }
}

export function useSchedule(lightId: string) {
  const [schedules, setSchedules] = useState<Schedule[]>(load);

  // Persist on every change
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(schedules));
  }, [schedules]);

  // Form state
  const [onTime,  setOnTime]  = useState('18:00');
  const [offTime, setOffTime] = useState('06:00');
  const [repeat,  setRepeat]  = useState<Schedule['repeat']>('daily');
  const [days,    setDays]    = useState<number[]>([1, 2, 3, 4, 5]);
  const [saved,   setSaved]   = useState(false);

  const lightSchedules = schedules.filter((s) => s.lightId === lightId);

  const add = () => {
    const s: Schedule = {
      id: `${lightId}-${Date.now()}`,
      lightId,
      onTime,
      offTime,
      repeat,
      days: repeat === 'custom' ? days : [],
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    setSchedules((prev) => [...prev, s]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggle = (id: string) =>
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );

  const remove = (id: string) =>
    setSchedules((prev) => prev.filter((s) => s.id !== id));

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
    saved,
    // actions
    add, toggle, remove,
  };
}
