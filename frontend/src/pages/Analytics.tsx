import { useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Activity, Zap, Thermometer, Wifi, WifiOff, AlertTriangle, Clock } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useTelemetry, tlv } from '../hooks/useTelemetry';

// ── Colour palette ─────────────────────────────────────────────────────────────
const C = {
  primary:  '#00E5FF',
  success:  '#10b981',
  warning:  '#f59e0b',
  error:    '#ef4444',
  purple:   '#8b5cf6',
  pink:     '#ec4899',
};

// ── Custom tooltip ─────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel border border-[var(--panel-border)] rounded-xl p-3 text-xs shadow-xl">
      <p className="font-bold text-[var(--text-secondary)] mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-bold data-font">{p.value}{p.unit ?? ''}</span>
        </div>
      ))}
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, unit, colour }: {
  icon: React.ReactNode; label: string; value: string | number; unit?: string; colour: string;
}) {
  return (
    <div className="glass-panel rounded-xl p-5 border glowing-border relative overflow-hidden">
      <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-full blur-2xl opacity-20" style={{ background: colour }} />
      <div className="flex items-center gap-2 mb-3" style={{ color: colour }}>{icon}<span className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">{label}</span></div>
      <div className="text-2xl font-bold data-font text-glow">{value}<span className="text-sm font-normal text-[var(--text-secondary)] ml-1">{unit}</span></div>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="glass-panel rounded-xl border p-5 md:p-6 glowing-border">
      <div className="flex items-center gap-2 mb-5 text-primary">
        {icon}
        <h3 className="font-bold text-base md:text-lg">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function Analytics() {
  const devices              = useAppStore((s) => s.devices);
  const telemetryHistory     = useAppStore((s) => s.telemetryHistory);
  const pushTelemetrySnapshot = useAppStore((s) => s.pushTelemetrySnapshot);
  const isDarkMode           = useAppStore((s) => s.isDarkMode);

  const primaryDevice = devices[0];
  const { data: telemetry } = useTelemetry(primaryDevice?.ttsDeviceId);

  // ── Accumulate rolling history every 5 s ──────────────────────────────────
  useEffect(() => {
    if (!telemetry || Object.keys(telemetry).length === 0) return;
    const snap = {
      ts:         Date.now(),
      brightness: parseFloat(tlv(telemetry, 'brightness_percent', '0')) || 0,
      power:      parseFloat(tlv(telemetry, 'led_power_W',        '0')) || 0,
      temp:       parseFloat(tlv(telemetry, 'internal_temp_C',    '0')) || 0,
      voltage:    parseFloat(tlv(telemetry, 'input_voltage_V',    '0')) || 0,
      current:    parseFloat(tlv(telemetry, 'input_current_mA',   '0')) || 0,
    };
    pushTelemetrySnapshot(snap);
  }, [telemetry]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived values ─────────────────────────────────────────────────────────
  const hasLive        = !!telemetry && Object.keys(telemetry).length > 0;
  const liveBrightness = parseFloat(tlv(telemetry, 'brightness_percent', '0')) || 0;
  const livePower      = parseFloat(tlv(telemetry, 'led_power_W',        '0')) || 0;
  const liveTemp       = parseFloat(tlv(telemetry, 'internal_temp_C',    '0')) || 0;
  const liveUptime     = tlv(telemetry, 'operating_time_hours', '–');

  // Fake status for extra devices (they are registered but no telemetry yet)
  const deviceStatusData = [
    { name: 'Online',  value: hasLive ? 1 : 0, colour: C.success },
    { name: 'Offline', value: hasLive ? devices.length - 1 : devices.length, colour: C.error },
    { name: 'Warning', value: 0, colour: C.warning },
  ].filter((d) => d.value > 0);

  // Per-device brightness bar data
  const brightnessData = devices.map((dev, i) => ({
    name: dev.id,
    Brightness: i === 0 ? liveBrightness : 0,
  }));

  // Per-device power bar data
  const powerData = devices.map((dev, i) => ({
    name: dev.id,
    Power: i === 0 ? livePower : 0,
  }));

  // History chart data — format timestamps
  const historyData = telemetryHistory.map((s) => ({
    time:       new Date(s.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    Brightness: s.brightness,
    Power:      s.power,
    Temp:       s.temp,
  }));

  const gridColour  = isDarkMode ? '#1e3a4a' : '#e2e8f0';
  const textColour  = isDarkMode ? '#94a3b8' : '#64748b';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Live telemetry analysis across {devices.length} registered device{devices.length !== 1 ? 's' : ''}
          </p>
        </div>
        {!hasLive && (
          <div className="flex items-center gap-2 text-xs text-warning bg-warning/10 border border-warning/30 rounded-full px-3 py-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            No live data — charts will populate once device sends uplinks
          </div>
        )}
      </div>

      {/* ── KPI row ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Wifi className="w-4 h-4" />}       label="Online Devices"  value={hasLive ? 1 : 0}         unit={`/ ${devices.length}`} colour={C.success} />
        <StatCard icon={<Zap className="w-4 h-4" />}        label="Power Draw"      value={hasLive ? livePower : '–'} unit="W"                    colour={C.primary} />
        <StatCard icon={<Activity className="w-4 h-4" />}   label="Brightness"      value={hasLive ? liveBrightness : '–'} unit="%"             colour={C.purple} />
        <StatCard icon={<Thermometer className="w-4 h-4" />} label="Internal Temp"  value={hasLive ? liveTemp : '–'} unit="°C"                   colour={C.warning} />
      </div>

      {/* ── Row 1: history area + status pie ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Telemetry history */}
        <Section title="Live Telemetry History" icon={<Activity className="w-5 h-5" />} >
          <div className="lg:col-span-2">
            {historyData.length > 1 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={historyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gBrightness" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.primary}  stopOpacity={0.3} />
                      <stop offset="95%" stopColor={C.primary}  stopOpacity={0}   />
                    </linearGradient>
                    <linearGradient id="gPower" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.purple}   stopOpacity={0.3} />
                      <stop offset="95%" stopColor={C.purple}   stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={gridColour} strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fill: textColour, fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: textColour, fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: textColour }} />
                  <Area type="monotone" dataKey="Brightness" stroke={C.primary}  fill="url(#gBrightness)" strokeWidth={2} unit="%" dot={false} />
                  <Area type="monotone" dataKey="Power"      stroke={C.purple}   fill="url(#gPower)"      strokeWidth={2} unit=" W" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label="Collecting data… check back in a few seconds" />
            )}
          </div>
        </Section>

        {/* Device status pie */}
        <Section title="Device Status" icon={<Wifi className="w-5 h-5" />}>
          {deviceStatusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={deviceStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {deviceStatusData.map((entry, i) => (
                      <Cell key={i} fill={entry.colour} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number, n: string) => [`${v} device${v !== 1 ? 's' : ''}`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {deviceStatusData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.colour }} />
                    {d.name}: <strong className="text-[var(--text-primary)]">{d.value}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyChart label="No devices registered" />
          )}
        </Section>
      </div>

      {/* ── Row 2: brightness + power bar charts ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <Section title="Brightness per Device" icon={<Activity className="w-5 h-5" />}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={brightnessData} margin={{ top: 5, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid stroke={gridColour} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: textColour, fontSize: 10 }} tickLine={false} angle={-20} textAnchor="end" />
              <YAxis domain={[0, 100]} tick={{ fill: textColour, fontSize: 10 }} tickLine={false} axisLine={false} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Brightness" fill={C.primary} radius={[4, 4, 0, 0]} unit="%" maxBarSize={48}>
                {brightnessData.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? C.primary : C.error} fillOpacity={i === 0 ? 1 : 0.4} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Section>

        <Section title="Power Draw per Device" icon={<Zap className="w-5 h-5" />}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={powerData} margin={{ top: 5, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid stroke={gridColour} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: textColour, fontSize: 10 }} tickLine={false} angle={-20} textAnchor="end" />
              <YAxis tick={{ fill: textColour, fontSize: 10 }} tickLine={false} axisLine={false} unit=" W" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Power" fill={C.purple} radius={[4, 4, 0, 0]} unit=" W" maxBarSize={48}>
                {powerData.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? C.purple : C.error} fillOpacity={i === 0 ? 1 : 0.4} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Section>
      </div>

      {/* ── Row 3: temperature area + uptime info ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <Section title="Temperature Trend" icon={<Thermometer className="w-5 h-5" />}>
          <div className="lg:col-span-2">
            {historyData.length > 1 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={historyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.warning} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={C.warning} stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={gridColour} strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fill: textColour, fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: textColour, fontSize: 10 }} tickLine={false} axisLine={false} unit="°C" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="Temp" stroke={C.warning} fill="url(#gTemp)" strokeWidth={2} unit="°C" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label="Waiting for temperature data…" />
            )}
          </div>
        </Section>

        {/* Uptime + misc stats */}
        <Section title="Device Summary" icon={<Clock className="w-5 h-5" />}>
          <div className="space-y-3">
            {[
              { label: 'Total Registered',   value: `${devices.length} device${devices.length !== 1 ? 's' : ''}` },
              { label: 'Online',             value: hasLive ? '1' : '0' },
              { label: 'Operating Time',     value: liveUptime !== '–' ? `${liveUptime} hrs` : '–' },
              { label: 'Lamp-On Time',       value: tlv(telemetry, 'lamp_on_time_hours', '–') !== '–' ? `${tlv(telemetry, 'lamp_on_time_hours')} hrs` : '–' },
              { label: 'Power Factor',       value: tlv(telemetry, 'power_factor', '–') },
              { label: 'Input Frequency',    value: tlv(telemetry, 'input_frequency_Hz', '–') !== '–' ? `${tlv(telemetry, 'input_frequency_Hz')} Hz` : '–' },
              { label: 'RSSI',               value: tlv(telemetry, 'rssi', '–') !== '–' ? `${tlv(telemetry, 'rssi')} dBm` : '–' },
              { label: 'SNR',                value: tlv(telemetry, 'snr',  '–') !== '–' ? `${tlv(telemetry, 'snr')} dB`  : '–' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center text-sm py-2 border-b border-[var(--panel-border)] last:border-0">
                <span className="text-[var(--text-secondary)]">{label}</span>
                <span className="font-bold data-font">{value}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ── Row 4: device registry table ───────────────────────────────────── */}
      <Section title="Registered Devices" icon={<WifiOff className="w-5 h-5" />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--panel-border)]">
                <th className="pb-3 pr-4">Device ID</th>
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">Address</th>
                <th className="pb-3 pr-4">Lat / Lng</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--panel-border)]">
              {devices.map((dev, i) => {
                const online = i === 0 && hasLive;
                return (
                  <tr key={dev.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3 pr-4 font-bold data-font text-primary">{dev.id}</td>
                    <td className="py-3 pr-4">{dev.name}</td>
                    <td className="py-3 pr-4 text-[var(--text-secondary)] text-xs max-w-[200px] truncate">{dev.address}</td>
                    <td className="py-3 pr-4 data-font text-xs text-[var(--text-secondary)]">{dev.lat.toFixed(4)}, {dev.lng.toFixed(4)}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${online ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-error/10 text-error border-error/30'}`}>
                        {online ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-[var(--text-secondary)]">
                      {new Date(dev.addedAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[200px] text-[var(--text-secondary)] text-sm gap-2 border border-dashed border-[var(--panel-border)] rounded-xl">
      <span className="text-2xl">📡</span>
      <span className="text-center px-4">{label}</span>
    </div>
  );
}
