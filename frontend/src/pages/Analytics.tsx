import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Activity, Zap, Wifi, AlertTriangle, Lightbulb, Network } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

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
  const projects = useAppStore((s) => s.projects);
  const gateways = useAppStore((s) => s.gateways);
  const lights = useAppStore((s) => s.lights);
  const faults = useAppStore((s) => s.faults);
  const isDarkMode = useAppStore((s) => s.isDarkMode);

  // ── Aggregate metrics ──────────────────────────────────────────────────────
  const totalProjects = projects.length;
  const totalGateways = gateways.length;
  const totalLights = lights.length;
  const onlineLights = lights.filter((l) => l.status === 'Online').length;
  const offlineLights = lights.filter((l) => l.status === 'Offline').length;
  const warningLights = lights.filter((l) => l.status === 'Warning').length;
  const totalFaults = faults.filter((f) => f.status !== 'Resolved').length;

  // ── Light status distribution ──────────────────────────────────────────────
  const lightStatusData = [
    { name: 'Online', value: onlineLights, colour: C.success },
    { name: 'Warning', value: warningLights, colour: C.warning },
    { name: 'Offline', value: offlineLights, colour: C.error },
  ].filter((d) => d.value > 0);

  // ── Per-gateway light count ────────────────────────────────────────────────
  const gatewayLightData = gateways.map((gw) => ({
    name: gw.id,
    'Connected': gw.connectedLights,
    'Online': gw.onlineLights,
  })).slice(0, 10);

  // ── Per-project summary ────────────────────────────────────────────────────
  const projectData = projects.map((proj) => ({
    name: proj.name,
    'Total Lights': proj.lightCount,
    'Online': proj.onlineLights,
    'Faults': proj.faults,
  }));

  // ── Per-light brightness distribution ──────────────────────────────────────
  const lightsWithBrightness = lights
    .sort((a, b) => (b.brightness || 0) - (a.brightness || 0))
    .slice(0, 8)
    .map((light) => ({
      name: light.id,
      Brightness: light.brightness || 0,
    }));

  // ── Per-light power distribution ───────────────────────────────────────────
  const lightsWithPower = lights
    .sort((a, b) => (b.power || 0) - (a.power || 0))
    .slice(0, 8)
    .map((light) => ({
      name: light.id,
      Power: light.power || 0,
    }));

  const gridColour = isDarkMode ? '#1e3a4a' : '#e2e8f0';
  const textColour = isDarkMode ? '#94a3b8' : '#64748b';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Network Analytics</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Comprehensive overview across {totalProjects} project{totalProjects !== 1 ? 's' : ''}, {totalGateways} gateway{totalGateways !== 1 ? 's' : ''}, and {totalLights} light{totalLights !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* ── KPI row ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={<Lightbulb className="w-4 h-4" />}  label="Total Lights"    value={totalLights}       unit=""                colour={C.primary} />
        <StatCard icon={<Wifi className="w-4 h-4" />}       label="Online Lights"   value={onlineLights}      unit={`/ ${totalLights}`}  colour={C.success} />
        <StatCard icon={<AlertTriangle className="w-4 h-4" />} label="Warning"      value={warningLights}     unit=""                colour={C.warning} />
        <StatCard icon={<Network className="w-4 h-4" />}    label="Gateways"        value={totalGateways}     unit=""                colour={C.purple} />
        <StatCard icon={<Activity className="w-4 h-4" />}   label="Open Faults"     value={totalFaults}       unit=""                colour={C.error} />
      </div>

      {/* ── Row 1: Light status pie + project breakdown ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Light status pie */}
        <Section title="Light Status Distribution" icon={<Wifi className="w-5 h-5" />}>
          {lightStatusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={lightStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                    {lightStatusData.map((entry, i) => (
                      <Cell key={i} fill={entry.colour} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v} light${v !== 1 ? 's' : ''}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 mt-3">
                {lightStatusData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.colour }} />
                      <span>{d.name}</span>
                    </div>
                    <strong className="text-[var(--text-primary)]">{d.value}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-[var(--text-secondary)]">No lights data</div>
          )}
        </Section>

        {/* Per-project summary */}
        <Section title="Project Summary" icon={<Activity className="w-5 h-5" />}>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {projectData.length > 0 ? (
              projectData.map((proj, i) => (
                <div key={i} className="p-3 rounded-lg bg-black/5 dark:bg-white/5 border border-[var(--panel-border)]">
                  <div className="font-bold text-sm mb-2">{proj.name}</div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-[var(--text-secondary)]">
                    <div><span className="text-[var(--text-primary)]">{proj['Total Lights']}</span> Total</div>
                    <div><span className="text-success">{proj.Online}</span> Online</div>
                    <div><span className="text-error">{proj.Faults}</span> Faults</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-[var(--text-secondary)]">No projects</div>
            )}
          </div>
        </Section>

        {/* Top gateways */}
        <Section title="Gateway Load" icon={<Network className="w-5 h-5" />}>
          <div className="space-y-2 text-sm max-h-[300px] overflow-y-auto">
            {gateways.slice(0, 8).map((gw, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded bg-black/5 dark:bg-white/5">
                <span className="text-[var(--text-secondary)]">{gw.id}</span>
                <div className="flex gap-3 text-xs">
                  <span className="text-primary data-font">{gw.connectedLights}</span>
                  <span className="text-success data-font">{gw.onlineLights}</span>
                  <span className={`px-1.5 py-0.5 rounded text-white font-bold text-xs ${gw.status === 'Online' ? 'bg-success/40' : gw.status === 'Warning' ? 'bg-warning/40' : 'bg-error/40'}`}>
                    {gw.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ── Row 2: Brightness + Power bar charts ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <Section title="Top Lights by Brightness" icon={<Lightbulb className="w-5 h-5" />}>
          {lightsWithBrightness.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={lightsWithBrightness} margin={{ top: 5, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid stroke={gridColour} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: textColour, fontSize: 10 }} tickLine={false} angle={-20} textAnchor="end" />
                <YAxis domain={[0, 100]} tick={{ fill: textColour, fontSize: 10 }} tickLine={false} axisLine={false} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Brightness" fill={C.primary} radius={[4, 4, 0, 0]} unit="%" maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-[var(--text-secondary)]">No brightness data</div>
          )}
        </Section>

        <Section title="Top Lights by Power Draw" icon={<Zap className="w-5 h-5" />}>
          {lightsWithPower.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={lightsWithPower} margin={{ top: 5, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid stroke={gridColour} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: textColour, fontSize: 10 }} tickLine={false} angle={-20} textAnchor="end" />
                <YAxis tick={{ fill: textColour, fontSize: 10 }} tickLine={false} axisLine={false} unit=" W" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Power" fill={C.purple} radius={[4, 4, 0, 0]} unit=" W" maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-[var(--text-secondary)]">No power data</div>
          )}
        </Section>
      </div>

      {/* ── Row 3: All Lights Table ───────────────────────────────────────────── */}
      <Section title="All Lights Inventory" icon={<Lightbulb className="w-5 h-5" />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--panel-border)]">
                <th className="pb-3 pr-4">Light ID</th>
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">Gateway</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Brightness</th>
                <th className="pb-3 pr-4">Power</th>
                <th className="pb-3">Voltage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--panel-border)]">
              {lights.length > 0 ? (
                lights.map((light) => (
                  <tr key={light.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3 pr-4 font-bold data-font text-primary">{light.id}</td>
                    <td className="py-3 pr-4">{light.name}</td>
                    <td className="py-3 pr-4 text-[var(--text-secondary)]">{light.gatewayId}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                        light.status === 'Online' ? 'bg-success/10 text-success border-success/30'
                        : light.status === 'Warning' ? 'bg-warning/10 text-warning border-warning/30'
                        : 'bg-error/10 text-error border-error/30'
                      }`}>
                        {light.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 data-font">{light.brightness}%</td>
                    <td className="py-3 pr-4 data-font">{light.power} W</td>
                    <td className="py-3 data-font text-[var(--text-secondary)]">{light.voltage} V</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-[var(--text-secondary)]">No lights registered</td>
                </tr>
              )}
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
