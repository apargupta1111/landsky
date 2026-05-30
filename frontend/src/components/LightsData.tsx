import { motion, AnimatePresence } from 'framer-motion';
import { X, Power, Settings2, Activity, Zap, Info, Thermometer, Clock, AlertTriangle, RefreshCw, CheckCircle, XCircle, Wifi } from 'lucide-react';
import { useState } from 'react';
import { useTelemetry, tlv } from '../hooks/useTelemetry';
import { useLightControl } from '../hooks/useLightControl';
import { ENDPOINTS } from '../config/endpoints';

interface Light {
  id: string;
  name: string;
  status: 'online' | 'warning' | 'error';
}

interface LightsDataProps {
  light: Light | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LightsData({ light, isOpen, onClose }: LightsDataProps) {
  const [dimLevel, setDimLevel] = useState(100);
  const [maxCurrentPct, setMaxCurrentPct] = useState(100);
  const [dimMode, setDimMode] = useState('DALI');
  const [pendingReset, setPendingReset] = useState(false);

  // Telemetry polling — fetches live data from Node-RED every 5 seconds
  const { data: telemetry, isLoading, error: telemetryError, lastUpdated, refresh } = useTelemetry();

  // MQTT control — publishes to smartlight/control topic (disabled; using TTS REST instead)
  const ctrl = useLightControl();

  if (!light) return null;

  const handleDimApply = () => ctrl.setDimmingLevel(dimLevel);
  const handleMaxCurrentApply = () => ctrl.setMaxCurrent(maxCurrentPct);
  const handleModeApply = () => ctrl.setDimmingMode(dimMode);
  const handleReset = async () => {
    if (!pendingReset) { setPendingReset(true); return; }
    await ctrl.resetDriver();
    setPendingReset(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4 md:p-8 overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-panel w-full max-w-7xl min-h-full md:min-h-[85vh] rounded-none md:rounded-2xl border glowing-border flex flex-col shadow-2xl dark:shadow-[0_0_50px_rgba(var(--accent-primary),0.15)] relative my-auto"
          >
            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-start justify-between p-4 md:p-6 border-b border-[var(--panel-border)] bg-[var(--bg-color)]/30 backdrop-blur-md rounded-t-none md:rounded-t-2xl gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold data-font">{light.id}</h2>
                  <div className="text-[var(--text-secondary)] text-sm">{light.name}</div>
                </div>

                {/* Status Badge */}
                <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center ${
                  light.status === 'online'  ? 'bg-primary/10 dark:bg-primary/20 text-primary border-primary/30 dark:border-primary/50 shadow-sm dark:shadow-[0_0_10px_var(--glow-shadow)]'
                  : light.status === 'warning' ? 'bg-warning/20 text-warning border-warning/50'
                  : 'bg-error/20 text-error border-error/50'
                }`}>
                  <span className={`w-2 h-2 rounded-full mr-2 ${light.status === 'online' ? 'bg-primary animate-pulse' : light.status === 'warning' ? 'bg-warning' : 'bg-error'}`} />
                  {light.status.toUpperCase()}
                </span>

                {/* Last updated */}
                {lastUpdated && (
                  <span className="text-xs text-[var(--text-secondary)] flex items-center">
                    <RefreshCw className="w-3 h-3 mr-1" /> {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
                {isLoading && <RefreshCw className="w-4 h-4 animate-spin text-primary" />}
                {telemetryError && <span className="text-xs text-error truncate max-w-[180px]">{telemetryError}</span>}
              </div>

              <div className="flex items-center gap-2 md:gap-3 ml-auto">
                <button onClick={refresh} className="p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-primary/20 text-[var(--text-secondary)] hover:text-primary border border-[var(--panel-border)] transition-colors">
                  <RefreshCw className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <button onClick={onClose} className="p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-error/20 hover:text-error transition-colors text-[var(--text-secondary)] border border-[var(--panel-border)]">
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>
            </div>

            {/* ── Command Status Bar ──────────────────────────────────── */}
            <AnimatePresence>
              {ctrl.status !== 'idle' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`flex items-center px-6 py-3 text-sm font-medium gap-2 ${
                    ctrl.status === 'sending' ? 'bg-primary/10 text-primary'
                    : ctrl.status === 'success' ? 'bg-green-500/10 text-green-400'
                    : 'bg-error/10 text-error'
                  }`}
                >
                  {ctrl.status === 'sending' && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {ctrl.status === 'success' && <CheckCircle className="w-4 h-4" />}
                  {ctrl.status === 'error' && <XCircle className="w-4 h-4" />}
                  {ctrl.status === 'sending' ? 'Sending command to device via LoRaWAN...'
                    : ctrl.status === 'success' ? 'Command delivered successfully'
                    : `Error: ${ctrl.errorMsg}`}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Main Grid ──────────────────────────────────────────── */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── Left: Controls ─────────────────────────────────── */}
                <div className="space-y-6">
                  <div className="glass-panel p-6 rounded-xl border">
                    <div className="flex items-center mb-6 text-primary">
                      <Settings2 className="w-5 h-5 mr-2" />
                      <h3 className="font-bold text-lg">Active Controls</h3>
                    </div>

                    <div className="space-y-7">
                      {/* Digital Dimming */}
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-[var(--text-secondary)]">Digital Dimming Level</span>
                          <span className="data-font font-bold">{dimLevel} <span className="text-[var(--text-secondary)] text-xs">/ 100</span></span>
                        </div>
                        <input
                          type="range" min="0" max="100" value={dimLevel}
                          onChange={(e) => setDimLevel(Number(e.target.value))}
                          className="w-full h-2 rounded-lg cursor-pointer accent-primary"
                        />
                        <div className="flex justify-between mt-2">
                          <div className="text-xs text-[var(--text-secondary)]">{(dimLevel / 100 * 100).toFixed(0)}% brightness</div>
                          <button
                            onClick={handleDimApply}
                            disabled={ctrl.status === 'sending'}
                            className="px-3 py-1 text-xs bg-primary/20 text-primary border border-primary/50 rounded-lg hover:bg-primary/30 disabled:opacity-40 transition-colors"
                          >
                            Apply
                          </button>
                        </div>
                      </div>

                      {/* Max Current */}
                      {/* <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-[var(--text-secondary)]">Max Current Limit</span>
                          <span className="data-font font-bold">{maxCurrentPct}%</span>
                        </div>
                        <input
                          type="range" min="10" max="100" value={maxCurrentPct}
                          onChange={(e) => setMaxCurrentPct(Number(e.target.value))}
                          className="w-full h-2 rounded-lg cursor-pointer accent-primary"
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={handleMaxCurrentApply}
                            disabled={ctrl.status === 'sending'}
                            className="px-3 py-1 text-xs bg-primary/20 text-primary border border-primary/50 rounded-lg hover:bg-primary/30 disabled:opacity-40 transition-colors"
                          >
                            Set Current
                          </button>
                        </div>
                      </div> */}

                      {/* Dimming Mode
                      <div>
                        <div className="text-sm text-[var(--text-secondary)] mb-2">Driver Dimming Mode</div>
                        <select
                          value={dimMode} onChange={(e) => setDimMode(e.target.value)}
                          className="w-full bg-black/5 dark:bg-white/5 border border-[var(--panel-border)] rounded-lg p-3 text-sm text-[var(--text-primary)] outline-none focus:border-primary transition-colors cursor-pointer"
                        >
                          <option value="DALI">DALI Protocol</option>
                          <option value="0-10V">0-10V Analog</option>
                          <option value="PWM">PWM</option>
                          <option value="TIMER">Astro Timer</option>
                        </select>
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-xs text-warning flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1" /> Reset required after change
                          </div>
                          <button
                            onClick={handleModeApply}
                            disabled={ctrl.status === 'sending'}
                            className="px-3 py-1 text-xs bg-primary/20 text-primary border border-primary/50 rounded-lg hover:bg-primary/30 disabled:opacity-40 transition-colors"
                          >
                            Set Mode
                          </button>
                        </div>
                      </div> */}

                      {/* Quick Power */}
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--panel-border)]">
                        <button
                          onClick={() => ctrl.powerOn()}
                          disabled={ctrl.status === 'sending'}
                          className="py-2.5 rounded-lg bg-primary/20 text-primary border border-primary/50 text-sm font-bold hover:bg-primary/30 disabled:opacity-40 transition-colors"
                        >
                          Power ON
                        </button>
                        <button
                          onClick={() => ctrl.powerOff()}
                          disabled={ctrl.status === 'sending'}
                          className="py-2.5 rounded-lg bg-error/10 text-error border border-error/30 text-sm font-bold hover:bg-error/20 disabled:opacity-40 transition-colors"
                        >
                          Power OFF
                        </button>
                      </div>

                      {/* Reset Driver */}
                      <button
                        onClick={handleReset}
                        disabled={ctrl.status === 'sending'}
                        className={`w-full py-2.5 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40 ${
                          pendingReset
                            ? 'bg-error/20 text-error border-error/50'
                            : 'bg-black/5 dark:bg-white/5 text-[var(--text-secondary)] border-[var(--panel-border)] hover:border-error/50 hover:text-error'
                        }`}
                      >
                        <Power className="w-4 h-4" />
                        {pendingReset ? 'Click again to confirm RESET' : 'Reset Driver'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Right: Telemetry ───────────────────────────────── */}
                <div className="lg:col-span-2 space-y-6">

                  {/* Output + Input */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-panel p-6 rounded-xl border">
                      <div className="flex items-center mb-5 text-secondary">
                        <Zap className="w-5 h-5 mr-2" />
                        <h3 className="font-bold">Output Telemetry (DC)</h3>
                      </div>
                      <div className="space-y-3">
                        <TelRow label="Output Current"   value={tlv(telemetry, 'output_current_mA', '–')}  unit="mA"  />
                        <TelRow label="Output Voltage"   value={tlv(telemetry, 'output_voltage_V', '–')}   unit="Vdc" />
                        <TelRow label="LED Output Power" value={tlv(telemetry, 'led_power_W', '–')}        unit="W"   />
                        <TelRow label="Brightness"       value={tlv(telemetry, 'brightness_percent', '–')} unit="%"   />
                      </div>
                    </div>

                    <div className="glass-panel p-6 rounded-xl border">
                      <div className="flex items-center mb-5 text-primary">
                        <Activity className="w-5 h-5 mr-2" />
                        <h3 className="font-bold">Input Telemetry (AC)</h3>
                      </div>
                      <div className="space-y-3">
                        <TelRow label="Input Current"   value={tlv(telemetry, 'input_current_mA', '–')}   unit="mA"  />
                        <TelRow label="Input Voltage"   value={tlv(telemetry, 'input_voltage_V', '–')}    unit="Vac" />
                        <TelRow label="Input Power"     value={tlv(telemetry, 'input_power_W', '–')}      unit="W"   />
                        <TelRow label="Input Frequency" value={tlv(telemetry, 'input_frequency_Hz', '–')} unit="Hz"  />
                      </div>
                    </div>
                  </div>

                  {/* Env & Time */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <DataBox icon={<Thermometer className="w-4 h-4" />}            title="Internal Temp"  value={tlv(telemetry, 'internal_temp_C', '–')}       unit="°C" />
                    <DataBox icon={<Thermometer className="w-4 h-4 text-secondary" />} title="Power Factor"  value={tlv(telemetry, 'power_factor', '–')}         unit="" />
                    <DataBox icon={<Clock className="w-4 h-4" />}                  title="Lamp-On Time"   value={tlv(telemetry, 'lamp_on_time_hours', '–')}    unit="hrs" />
                    <DataBox icon={<Activity className="w-4 h-4" />}               title="Operating Time" value={tlv(telemetry, 'operating_time_hours', '–')} unit="hrs" />
                  </div>

                
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TelRow({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-black/5 dark:bg-white/5 border border-[var(--panel-border)] hover:border-primary/30 transition-colors">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="font-bold data-font text-lg">{value}</span>
        <span className="text-xs text-[var(--text-secondary)]">{unit}</span>
      </div>
    </div>
  );
}

function DataBox({ icon, title, value, unit }: { icon: React.ReactNode; title: string; value: string; unit: string }) {
  return (
    <div className="p-4 rounded-xl border border-[var(--panel-border)] bg-black/5 dark:bg-white/5">
      <div className="flex items-center text-[var(--text-secondary)] mb-2 gap-1.5">
        {icon}
        <span className="text-xs font-medium truncate">{title}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-bold data-font text-2xl">{value}</span>
        <span className="text-xs text-[var(--text-secondary)]">{unit}</span>
      </div>
    </div>
  );
}

function Divider() {
  return <div className="h-10 w-px bg-[var(--panel-border)] hidden md:block" />;
}

function ExtLink({ href, label, sub }: { href: string; label: string; sub: string }) {
  return (
    <a
      href={href} target="_blank" rel="noopener noreferrer"
      className="flex items-center justify-between p-4 glass-panel rounded-xl border hover:border-primary/50 transition-colors group"
    >
      <div>
        <div className="font-bold text-sm group-hover:text-primary transition-colors">{label} ↗</div>
        <div className="text-xs text-[var(--text-secondary)]">{sub}</div>
      </div>
    </a>
  );
}
