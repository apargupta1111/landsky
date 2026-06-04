import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import { X, Activity, Zap, Thermometer, Wifi } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useTelemetry, tlv } from '../hooks/useTelemetry';

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  primary : '#00E5FF',
  success : '#10b981',
  warning : '#f59e0b',
  error   : '#ef4444',
  purple  : '#8b5cf6',
  pink    : '#ec4899',
  orange  : '#f97316',
};

// ── Custom tooltip ─────────────────────────────────────────────────────────────
function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel border border-[var(--panel-border)] rounded-xl p-3 text-xs shadow-2xl backdrop-blur-xl">
      <p className="font-bold text-[var(--text-secondary)] mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-6">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-bold data-font">{p.value}{p.unit ?? ''}</span>
        </div>
      ))}
    </div>
  );
}

// ── Chart panel ───────────────────────────────────────────────────────────────
function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="glass-panel rounded-xl border border-[var(--panel-border)] p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-primary text-sm font-bold">
        {icon}<span>{title}</span>
      </div>
      {children}
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-40 text-[var(--text-secondary)] text-xs gap-2 border border-dashed border-[var(--panel-border)] rounded-xl">
      <span className="text-xl">📡</span><span>{label}</span>
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────────
interface AnalyticsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Analytics({ isOpen, onClose }: AnalyticsProps) {
  const devices               = useAppStore((s) => s.devices);
  const telemetryHistory      = useAppStore((s) => s.telemetryHistory);
  const pushTelemetrySnapshot = useAppStore((s) => s.pushTelemetrySnapshot);
  const isDarkMode            = useAppStore((s) => s.isDarkMode);

  const primaryDevice = devices[0];
  const { data: telemetry } = useTelemetry(primaryDevice?.ttsDeviceId);

  // ── Push snapshot into rolling history on each telemetry update ───────────
  useEffect(() => {
    if (!telemetry || Object.keys(telemetry).length === 0) return;
    pushTelemetrySnapshot({
      ts:         Date.now(),
      brightness: parseFloat(tlv(telemetry, 'brightness_percent', '0')) || 0,
      power:      parseFloat(tlv(telemetry, 'led_power_W',        '0')) || 0,
      temp:       parseFloat(tlv(telemetry, 'internal_temp_C',    '0')) || 0,
      voltage:    parseFloat(tlv(telemetry, 'input_voltage_V',    '0')) || 0,
      current:    parseFloat(tlv(telemetry, 'input_current_mA',   '0')) || 0,
    });
  }, [telemetry]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived ───────────────────────────────────────────────────────────────
  const hasLive        = !!telemetry && Object.keys(telemetry).length > 0;
  const liveBrightness = parseFloat(tlv(telemetry, 'brightness_percent', '0')) || 0;
  const livePower      = parseFloat(tlv(telemetry, 'led_power_W',        '0')) || 0;
  const liveTemp       = parseFloat(tlv(telemetry, 'internal_temp_C',    '0')) || 0;
  const liveVoltage    = parseFloat(tlv(telemetry, 'input_voltage_V',    '0')) || 0;
  const liveCurrent    = parseFloat(tlv(telemetry, 'input_current_mA',   '0')) || 0;
  const livePF         = parseFloat(tlv(telemetry, 'power_factor',       '0')) || 0;

  // Device status pie
  const statusData = [
    { name: 'Online',  value: hasLive ? 1 : 0,              fill: C.success },
    { name: 'Offline', value: hasLive ? devices.length - 1 : devices.length, fill: C.error   },
  ].filter((d) => d.value > 0);

  // Per-device bar data
  const brightnessData = devices.map((d, i) => ({ id: d.id, Brightness: i === 0 ? liveBrightness : 0 }));
  const powerData      = devices.map((d, i) => ({ id: d.id, Power:      i === 0 ? livePower      : 0 }));

  // History
  const history = telemetryHistory.map((s) => ({
    t:          new Date(s.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    Brightness: s.brightness,
    Power:      s.power,
    Temp:       s.temp,
    Voltage:    s.voltage,
    Current:    s.current,
  }));

  // Radar — current snapshot for primary device
  const radarData = [
    { metric: 'Brightness', value: liveBrightness,          max: 100  },
    { metric: 'Power (W)',  value: Math.min(livePower, 100), max: 100  },
    { metric: 'Temp (°C)',  value: Math.min(liveTemp,  100), max: 100  },
    { metric: 'Voltage',    value: Math.min(liveVoltage / 2.5, 100), max: 100 },
    { metric: 'Current',    value: Math.min(liveCurrent / 10,  100), max: 100 },
    { metric: 'Power Factor', value: livePF * 100,           max: 100  },
  ];

  const grid = isDarkMode ? '#1e3a4a' : '#e2e8f0';
  const tick  = isDarkMode ? '#94a3b8' : '#64748b';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-[70] flex items-center justify-center p-4 md:p-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel w-full max-w-7xl h-[92vh] rounded-2xl border glowing-border flex flex-col shadow-2xl overflow-hidden"
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--panel-border)] bg-[var(--bg-color)]/30 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-lg leading-tight">Analytics</h2>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {devices.length} device{devices.length !== 1 ? 's' : ''} · {hasLive ? 'Live data active' : 'Awaiting uplink'}
                  </p>
                </div>
              </div>

              {/* Live badge */}
              {hasLive && (
                <span className="hidden sm:flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 border border-green-400/30 rounded-full px-3 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Live Stream
                </span>
              )}

              <button onClick={onClose} className="p-2 rounded-full hover:bg-error/10 hover:text-error text-[var(--text-secondary)] border border-[var(--panel-border)] transition-colors ml-3">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── Chart Grid ── */}
            <div className="flex-1 overflow-y-auto p-4 md:p-5 scrollbar-hide">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 h-full">

                {/* 1 ── Brightness + Power history (spans 2 cols) */}
                <div className="md:col-span-2">
                  <Panel title="Live Telemetry — Brightness & Power" icon={<Zap className="w-4 h-4" />}>
                    {history.length > 1 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={history} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                          <defs>
                            <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor={C.primary} stopOpacity={0.35} />
                              <stop offset="95%" stopColor={C.primary} stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor={C.purple} stopOpacity={0.35} />
                              <stop offset="95%" stopColor={C.purple} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke={grid} strokeDasharray="3 3" />
                          <XAxis dataKey="t" tick={{ fill: tick, fontSize: 9 }} tickLine={false} interval="preserveStartEnd" />
                          <YAxis tick={{ fill: tick, fontSize: 9 }} tickLine={false} axisLine={false} />
                          <Tooltip content={<Tip />} />
                          <Legend wrapperStyle={{ fontSize: 11, color: tick }} />
                          <Area type="monotone" dataKey="Brightness" stroke={C.primary} fill="url(#gB)" strokeWidth={2} unit="%" dot={false} />
                          <Area type="monotone" dataKey="Power"      stroke={C.purple}  fill="url(#gP)" strokeWidth={2} unit=" W" dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : <EmptyChart label="Collecting data… history builds every 5 s" />}
                  </Panel>
                </div>

                {/* 2 ── Device status pie */}
                <Panel title="Device Status" icon={<Wifi className="w-4 h-4" />}>
                  {statusData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={175}>
                        <PieChart>
                          <Pie data={statusData} cx="50%" cy="50%" innerRadius={48} outerRadius={75} dataKey="value" paddingAngle={4}>
                            {statusData.map((d, i) => <Cell key={i} fill={d.fill} stroke="transparent" />)}
                          </Pie>
                          <Tooltip formatter={(v: number, n: string) => [`${v}`, n]} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex justify-center gap-4">
                        {statusData.map((d) => (
                          <div key={d.name} className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }} />
                            {d.name}: <strong className="text-[var(--text-primary)] ml-0.5">{d.value}</strong>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : <EmptyChart label="No devices" />}
                </Panel>

                {/* 3 ── Brightness per device */}
                <Panel title="Brightness per Device" icon={<Activity className="w-4 h-4" />}>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={brightnessData} margin={{ top: 5, right: 10, left: -15, bottom: 18 }}>
                      <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="id" tick={{ fill: tick, fontSize: 9 }} tickLine={false} angle={-15} textAnchor="end" />
                      <YAxis domain={[0, 100]} tick={{ fill: tick, fontSize: 9 }} tickLine={false} axisLine={false} unit="%" />
                      <Tooltip content={<Tip />} />
                      <Bar dataKey="Brightness" radius={[4, 4, 0, 0]} unit="%" maxBarSize={40}>
                        {brightnessData.map((_, i) => <Cell key={i} fill={i === 0 ? C.primary : C.error} fillOpacity={i === 0 ? 1 : 0.4} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Panel>

                {/* 4 ── Power per device */}
                <Panel title="Power Draw per Device" icon={<Zap className="w-4 h-4" />}>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={powerData} margin={{ top: 5, right: 10, left: -15, bottom: 18 }}>
                      <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="id" tick={{ fill: tick, fontSize: 9 }} tickLine={false} angle={-15} textAnchor="end" />
                      <YAxis tick={{ fill: tick, fontSize: 9 }} tickLine={false} axisLine={false} unit=" W" />
                      <Tooltip content={<Tip />} />
                      <Bar dataKey="Power" radius={[4, 4, 0, 0]} unit=" W" maxBarSize={40}>
                        {powerData.map((_, i) => <Cell key={i} fill={i === 0 ? C.purple : C.error} fillOpacity={i === 0 ? 1 : 0.4} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Panel>

                {/* 5 ── Temperature trend */}
                <Panel title="Temperature Trend" icon={<Thermometer className="w-4 h-4" />}>
                  {history.length > 1 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={history} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gT" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={C.warning} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={C.warning} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke={grid} strokeDasharray="3 3" />
                        <XAxis dataKey="t" tick={{ fill: tick, fontSize: 9 }} tickLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fill: tick, fontSize: 9 }} tickLine={false} axisLine={false} unit="°C" />
                        <Tooltip content={<Tip />} />
                        <Area type="monotone" dataKey="Temp" stroke={C.warning} fill="url(#gT)" strokeWidth={2} unit="°C" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : <EmptyChart label="Temperature history loading…" />}
                </Panel>

                {/* 6 ── Voltage + Current history */}
                <Panel title="Voltage & Current Trend" icon={<Activity className="w-4 h-4" />}>
                  {history.length > 1 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={history} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={C.success} stopOpacity={0.35} />
                            <stop offset="95%" stopColor={C.success} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={C.orange} stopOpacity={0.35} />
                            <stop offset="95%" stopColor={C.orange} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke={grid} strokeDasharray="3 3" />
                        <XAxis dataKey="t" tick={{ fill: tick, fontSize: 9 }} tickLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fill: tick, fontSize: 9 }} tickLine={false} axisLine={false} />
                        <Tooltip content={<Tip />} />
                        <Legend wrapperStyle={{ fontSize: 11, color: tick }} />
                        <Area type="monotone" dataKey="Voltage" stroke={C.success} fill="url(#gV)" strokeWidth={2} unit=" V" dot={false} />
                        <Area type="monotone" dataKey="Current" stroke={C.orange}  fill="url(#gC)" strokeWidth={2} unit=" mA" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : <EmptyChart label="Voltage/current history loading…" />}
                </Panel>

                {/* 7 ── Radar — current device health snapshot */}
                <Panel title="Device Health Snapshot" icon={<Activity className="w-4 h-4" />}>
                  {hasLive ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={80}>
                        <PolarGrid stroke={grid} />
                        <PolarAngleAxis dataKey="metric" tick={{ fill: tick, fontSize: 9 }} />
                        <Radar name="Live" dataKey="value" stroke={C.primary} fill={C.primary} fillOpacity={0.2} strokeWidth={2} />
                        <Tooltip formatter={(v: number) => [`${v.toFixed(1)}`, 'Value']} />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : <EmptyChart label="Awaiting live data for radar chart" />}
                </Panel>

              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
