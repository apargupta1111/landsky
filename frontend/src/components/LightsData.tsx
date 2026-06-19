import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings2, CalendarClock, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { useTelemetry } from '../hooks/useTelemetry';
import { useLightControl } from '../hooks/useLightControl';
import { useSchedule } from '../hooks/useSchedule';
import { ControlsTab } from './lightsData/ControlsTab';
import { TelemetryPanel } from './lightsData/TelemetryPanel';
import { ScheduleTab } from './lightsData/ScheduleTab';
import type { Light } from './lightsData/types';

interface Props {
  light: Light | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LightsData({ light, isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'controls' | 'schedule'>('controls');
  const { data: telemetry, isLoading, error: telErr, lastUpdated, refresh } = useTelemetry(light?.ttsDeviceId);
  const ctrl  = useLightControl(light?.ttsDeviceId);
  const sched = useSchedule(light?.id ?? '');

  if (!light) return null;

  const TABS = [
    { key: 'controls' as const, Icon: Settings2,    label: 'Controls' },
    { key: 'schedule' as const, Icon: CalendarClock, label: 'Schedule',
      badge: sched.lightSchedules.length > 0 ? sched.lightSchedules.length : null },
  ];

  const statusCls = {
    online:  'bg-primary/10 text-primary border-primary/30',
    warning: 'bg-warning/20 text-warning border-warning/50',
    error:   'bg-error/20 text-error border-error/50',
  }[light.status];

  const ctrlMsgCls = {
    sending: 'bg-primary/10 text-primary',
    success: 'bg-green-500/10 text-green-400',
    error:   'bg-error/10 text-error',
    idle:    '',
  }[ctrl.status];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4 md:p-8 overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-panel w-full max-w-7xl min-h-full md:min-h-[85vh] rounded-none md:rounded-2xl border glowing-border flex flex-col shadow-2xl relative my-auto"
          >
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between p-4 md:p-6 border-b border-[var(--panel-border)] bg-[var(--bg-color)]/30 backdrop-blur-md rounded-t-none md:rounded-t-2xl gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold data-font">{light.id}</h2>
                  <div className="text-[var(--text-secondary)] text-sm">{light.name}</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center ${statusCls}`}>
                  <span className={`w-2 h-2 rounded-full mr-2 ${light.status === 'online' ? 'bg-primary animate-pulse' : light.status === 'warning' ? 'bg-warning' : 'bg-error'}`} />
                  {light.status.toUpperCase()}
                </span>
                {lastUpdated && (
                  <span className="text-xs text-[var(--text-secondary)] flex items-center">
                    <RefreshCw className="w-3 h-3 mr-1" /> {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
                {isLoading && <RefreshCw className="w-4 h-4 animate-spin text-primary" />}
                {telErr && <span className="text-xs text-error truncate max-w-[180px]">{telErr}</span>}
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <button onClick={refresh} className="p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-primary/20 text-[var(--text-secondary)] hover:text-primary border border-[var(--panel-border)] transition-colors">
                  <RefreshCw className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <button onClick={onClose} className="p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-error/20 hover:text-error transition-colors text-[var(--text-secondary)] border border-[var(--panel-border)]">
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>
            </div>

            {/* Command status bar */}
            <AnimatePresence>
              {ctrl.status !== 'idle' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className={`flex items-center px-6 py-3 text-sm font-medium gap-2 ${ctrlMsgCls}`}
                >
                  {ctrl.status === 'sending' && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {ctrl.status === 'success' && <CheckCircle className="w-4 h-4" />}
                  {ctrl.status === 'error'   && <XCircle className="w-4 h-4" />}
                  {ctrl.status === 'sending' ? 'Sending command via LoRaWAN…'
                    : ctrl.status === 'success' ? 'Command delivered successfully'
                    : `Error: ${ctrl.errorMsg}`}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tab bar */}
            <div className="flex gap-1 px-6 pt-4 border-b border-[var(--panel-border)]">
              {TABS.map(({ key, Icon, label, badge }) => (
                <button
                  key={key} onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-t-lg border-b-2 transition-all ${
                    activeTab === key
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon className="w-4 h-4" />{label}
                  {badge != null && (
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center">{badge}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto scrollbar-hide">
              {activeTab === 'controls' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <ControlsTab ctrl={ctrl} />
                  <div className="lg:col-span-2">
                    <TelemetryPanel telemetry={telemetry} />
                  </div>
                </div>
              )}
              {activeTab === 'schedule' && <ScheduleTab sched={sched} />}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
    