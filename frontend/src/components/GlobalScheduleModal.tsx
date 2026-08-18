import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarClock, CheckCircle, AlertCircle } from 'lucide-react';
import { DAY_LABELS } from './lightsData/types';
import { ENDPOINTS } from '../config/endpoints';
import type { Device } from '../store/types';

interface GlobalScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: Device[];
}

export function GlobalScheduleModal({ isOpen, onClose, devices }: GlobalScheduleModalProps) {
  const [onTime, setOnTime] = useState('18:00');
  const [offTime, setOffTime] = useState('06:00');
  const [repeat, setRepeat] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [brightness, setBrightness] = useState<number>(100);

  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [progressMsg, setProgressMsg] = useState('');

  const reset = () => {
    setOnTime('18:00');
    setOffTime('06:00');
    setRepeat('daily');
    setDays([1, 2, 3, 4, 5]);
    setBrightness(100);
    setStatus('idle');
    setErrorMsg('');
    setProgressMsg('');
  };

  const handleClose = () => {
    if (status === 'sending') return;
    reset();
    onClose();
  };

  const toggleDay = (d: number) =>
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const activeDevices = devices;
    if (activeDevices.length === 0) {
      setStatus('error');
      setErrorMsg('No lights found to schedule.');
      return;
    }

    setStatus('sending');
    setErrorMsg('');
    setProgressMsg('');

    try {
      let hasError = false;
      let lastError = '';

      for (let i = 0; i < activeDevices.length; i++) {
        const dev = activeDevices[i];
        setProgressMsg(`Scheduling... (${i + 1}/${activeDevices.length})`);

        const payload = {
          light: dev.id,
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

        if (!res.ok) {
          hasError = true;
          const data = await res.json().catch(() => ({}));
          lastError = data.error || `Failed to schedule ${dev.name}`;
        }
      }

      if (hasError) {
        setStatus('error');
        setErrorMsg(lastError || 'Completed with some errors.');
      } else {
        setStatus('success');
        setTimeout(() => handleClose(), 2000);
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'An unexpected error occurred.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md z-[80] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel w-full max-w-lg rounded-2xl border glowing-border shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--panel-border)] bg-[var(--bg-color)]/30">
              <div className="flex items-center gap-3 text-primary">
                <CalendarClock className="w-5 h-5" />
                <h2 className="font-bold text-base leading-tight">Global Schedule</h2>
              </div>
              <button disabled={status === 'sending'} onClick={handleClose} className="p-2 rounded-full hover:bg-error/10 hover:text-error text-[var(--text-secondary)] transition-colors disabled:opacity-50">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <p className="text-sm text-[var(--text-secondary)]">
                This schedule will be applied to all <strong>{devices.length}</strong> registered lights.
              </p>

              {/* Time pickers */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Switch ON at', val: onTime, set: setOnTime },
                  { label: 'Switch OFF at', val: offTime, set: setOffTime },
                ].map(({ label, val, set }) => (
                  <div key={label}>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">{label}</label>
                    <input
                      type="time" value={val}
                      onChange={(e) => set(e.target.value)}
                      required
                      disabled={status === 'sending'}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--panel-border)] focus:border-primary outline-none text-sm text-[var(--text-primary)] transition-colors disabled:opacity-50"
                    />
                  </div>
                ))}
              </div>

              {/* Repeat type */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Repeat</label>
                <div className="flex gap-2">
                  {(['daily', 'weekly', 'custom'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      disabled={status === 'sending'}
                      onClick={() => setRepeat(r)}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all capitalize ${
                        repeat === r
                          ? 'bg-primary/20 text-primary border-primary/50'
                          : 'bg-black/5 dark:bg-white/5 text-[var(--text-secondary)] border-[var(--panel-border)] hover:border-primary/30'
                      } disabled:opacity-50`}
                    >{r}</button>
                  ))}
                </div>
              </div>

              {/* Day picker — custom only */}
              {repeat === 'custom' && (
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Days</label>
                  <div className="flex gap-2 flex-wrap">
                    {DAY_LABELS.map((d, i) => (
                      <button
                        key={i}
                        type="button"
                        disabled={status === 'sending'}
                        onClick={() => toggleDay(i)}
                        className={`w-10 h-10 rounded-full text-xs font-bold border transition-all ${
                          days.includes(i)
                            ? 'bg-primary text-white border-primary shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                            : 'bg-black/5 dark:bg-white/5 text-[var(--text-secondary)] border-[var(--panel-border)] hover:border-primary/30'
                        } disabled:opacity-50`}
                      >{d}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Brightness Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Brightness</label>
                  <span className="text-xs font-bold text-primary">{brightness}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" step="5"
                  value={brightness}
                  disabled={status === 'sending'}
                  onChange={(e) => setBrightness(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-50"
                />
              </div>

              {/* Status messages */}
              {status === 'sending' && (
                <div className="flex items-center justify-center gap-2 text-sm text-[var(--text-secondary)]">
                  <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  {progressMsg}
                </div>
              )}
              {status === 'error' && (
                <div className="flex items-center gap-2 text-error text-sm bg-error/10 border border-error/30 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
                </div>
              )}
              {status === 'success' && (
                <div className="flex items-center gap-2 text-green-500 text-sm bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
                  <CheckCircle className="w-4 h-4 shrink-0" /> Schedules applied successfully!
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={handleClose} disabled={status === 'sending'}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--panel-border)] text-sm font-bold text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={status === 'sending'}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-black font-bold text-sm hover:brightness-110 disabled:opacity-60 transition-all shadow-[0_0_16px_rgba(0,229,255,0.2)] flex items-center justify-center gap-2">
                  Apply Schedule
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
