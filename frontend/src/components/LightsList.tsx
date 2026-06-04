import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Trash2 } from 'lucide-react';
import { DeviceCard } from './DeviceCard';
import { useAppStore } from '../store/useAppStore';

interface LightsListProps {
  isOpen: boolean;
  onClose: () => void;
  onDeviceClick: (light: any) => void;
  primaryStatus: 'online' | 'warning' | 'error';
  brightness: number;
  power: number;
}

export function LightsList({
  isOpen, onClose, onDeviceClick,
  primaryStatus, brightness, power,
}: LightsListProps) {
  const [query, setQuery] = useState('');
  const devices      = useAppStore((s) => s.devices);
  const removeDevice = useAppStore((s) => s.removeDevice);

  // Seed device (index 0) always gets live telemetry values;
  // others show as offline until they start sending uplinks.
  const enriched = devices.map((dev, i) => ({
    ...dev,
    status:     i === 0 ? primaryStatus : ('error' as const),
    brightness: i === 0 ? brightness    : 0,
    power:      i === 0 ? power         : 0,
  }));

  const filtered = enriched.filter(
    (d) =>
      d.id.toLowerCase().includes(query.toLowerCase()) ||
      d.name.toLowerCase().includes(query.toLowerCase()) ||
      d.address.toLowerCase().includes(query.toLowerCase()),
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
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel w-full max-w-7xl h-full md:h-[90vh] rounded-none md:rounded-2xl border glowing-border flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 md:p-6 border-b border-[var(--panel-border)] bg-[var(--bg-color)]/30 backdrop-blur-md gap-3">
              <div className="flex items-center space-x-3 min-w-0">
                <h2 className="text-lg md:text-2xl font-bold truncate">Active Lights Directory</h2>
                <span className="px-2 py-0.5 bg-primary/10 dark:bg-primary/20 text-primary rounded-full text-xs font-bold border border-primary/30 shrink-0">
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
                    placeholder="Search by ID, name or address…"
                    className="bg-transparent border-none outline-none text-sm w-full placeholder-[var(--text-secondary)] text-[var(--text-primary)]"
                  />
                </div>
                <button onClick={onClose} className="p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-error/20 hover:text-error transition-colors text-[var(--text-secondary)] border border-[var(--panel-border)] shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide bg-[var(--bg-color)]/10">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)] text-sm text-center gap-3">
                  <span className="text-3xl">🔍</span>
                  <span>No devices match "{query}"</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {filtered.map((dev, index) => (
                    <motion.div
                      key={dev.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative group"
                    >
                      <DeviceCard
                        id={dev.id}
                        name={dev.name}
                        status={dev.status}
                        brightness={dev.brightness}
                        power={dev.power}
                        onClick={() => onDeviceClick(dev)}
                      />
                      {/* Delete button — only for non-seed devices */}
                      {index !== 0 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); removeDevice(dev.id); }}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-error/10 border border-error/30 text-error opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error/20"
                          title="Remove device"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
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
