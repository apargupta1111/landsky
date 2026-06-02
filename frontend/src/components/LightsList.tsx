import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search } from 'lucide-react';
import { DeviceCard } from './DeviceCard';
import { DEVICE_CONFIG } from '../config/endpoints';
import type { TelemetryData } from '../services/nodeRedTelemetry';

interface LightsListProps {
  isOpen: boolean;
  onClose: () => void;
  onDeviceClick: (light: any) => void;
  telemetry: TelemetryData | null;
  deviceStatus: 'online' | 'warning' | 'error';
  brightness: number;
  power: number;
}

export function LightsList({
  isOpen,
  onClose,
  onDeviceClick,
  telemetry,
  deviceStatus,
  brightness,
  power,
}: LightsListProps) {
  const [query, setQuery] = useState('');

  const realDevices = [
    {
      id:         DEVICE_CONFIG.endDeviceId,
      name:       'Streetlight Node',
      status:     deviceStatus,
      brightness,
      power,
    },
  ];

  const filtered = realDevices.filter(
    (d) =>
      d.id.toLowerCase().includes(query.toLowerCase()) ||
      d.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8"
        >
          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel w-full max-w-7xl h-full md:h-[90vh] rounded-none md:rounded-2xl border glowing-border flex flex-col shadow-2xl dark:shadow-[0_0_50px_rgba(var(--accent-primary),0.15)] overflow-hidden"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 md:p-6 border-b border-[var(--panel-border)] bg-[var(--bg-color)]/30 backdrop-blur-md gap-3">
              <div className="flex items-center space-x-3 min-w-0">
                <h2 className="text-lg md:text-2xl font-bold truncate">Active Lights Directory</h2>
                <span className="px-2 py-0.5 bg-primary/10 dark:bg-primary/20 text-primary rounded-full text-xs font-bold border border-primary/30 dark:border-primary/50 shadow-sm dark:shadow-[0_0_10px_var(--glow-shadow)] shrink-0">
                  {filtered.length} Node{filtered.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="flex items-center bg-black/10 dark:bg-white/10 rounded-full px-3 py-2 flex-1 md:w-64 border border-[var(--panel-border)] focus-within:border-primary transition-colors">
                  <Search className="w-4 h-4 text-[var(--text-secondary)] mr-2 shrink-0" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by ID or location..."
                    className="bg-transparent border-none outline-none text-sm w-full placeholder-[var(--text-secondary)] text-[var(--text-primary)]"
                  />
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-error/20 hover:text-error transition-colors text-[var(--text-secondary)] border border-[var(--panel-border)] shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Grid List */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide bg-[var(--bg-color)]/10">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)] text-sm text-center gap-3">
                  <span className="text-3xl">🔍</span>
                  <span>No devices match "{query}"</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {filtered.map((light, index) => (
                    <motion.div
                      key={light.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <DeviceCard
                        id={light.id}
                        name={light.name}
                        status={light.status}
                        brightness={light.brightness}
                        power={light.power}
                        onClick={() => onDeviceClick(light)}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
