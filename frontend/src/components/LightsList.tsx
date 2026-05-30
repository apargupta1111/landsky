import { motion, AnimatePresence } from 'framer-motion';
import { X, Search } from 'lucide-react';
import { DeviceCard } from './DeviceCard';

interface LightsListProps {
  isOpen: boolean;
  onClose: () => void;
  onDeviceClick: (light: any) => void;
}

const DUMMY_LIGHTS = [
  { id: 'SL-001', name: 'Downtown Ave', status: 'online', brightness: 85, power: 240 },
  { id: 'SL-002', name: 'Downtown Ave', status: 'online', brightness: 100, power: 310 },
  { id: 'SL-003', name: 'Central Plaza', status: 'warning', brightness: 40, power: 120 },
  { id: 'SL-004', name: 'North Bridge', status: 'error', brightness: 0, power: 0 },
  { id: 'SL-005', name: 'West End', status: 'online', brightness: 75, power: 190 },
  { id: 'SL-006', name: 'East Side', status: 'online', brightness: 90, power: 260 },
  { id: 'SL-007', name: 'Harbor Park', status: 'warning', brightness: 50, power: 140 },
  { id: 'SL-008', name: 'Main Street', status: 'online', brightness: 100, power: 300 },
  { id: 'SL-009', name: 'Financial District', status: 'online', brightness: 80, power: 220 },
  { id: 'SL-010', name: 'Stadium Rd', status: 'online', brightness: 100, power: 320 },
] as const;

export function LightsList({ isOpen, onClose, onDeviceClick }: LightsListProps) {
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
                  {DUMMY_LIGHTS.length} Nodes
                </span>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="flex items-center bg-black/10 dark:bg-white/10 rounded-full px-3 py-2 flex-1 md:w-64 border border-[var(--panel-border)] focus-within:border-primary transition-colors">
                  <Search className="w-4 h-4 text-[var(--text-secondary)] mr-2 shrink-0" />
                  <input
                    type="text"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {DUMMY_LIGHTS.map((light, index) => (
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
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
