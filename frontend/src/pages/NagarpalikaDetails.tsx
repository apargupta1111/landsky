import { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft, Power, Sun, Moon, Zap, Wifi, WifiOff,
  Lightbulb, RefreshCw, CheckCircle, XCircle, SlidersHorizontal,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { ttsCommands } from '../services/ttsDownlink';

// ─────────────────────────────────────────────────────────────────
// Inline mini map using Leaflet (loaded from CDN to avoid deps)
// ─────────────────────────────────────────────────────────────────
function NagarpalikaMap({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // Default centre to Bhimtal lake if no coords
  const centerLat = lat || 29.3500;
  const centerLng = lng || 79.5700;

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false }).setView([centerLat, centerLng], 13);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    const icon = L.divIcon({
      className: '',
      html: `<div style="background:#22c55e;border:2px solid #fff;border-radius:50%;width:14px;height:14px;box-shadow:0 0 8px #22c55e"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
    L.marker([centerLat, centerLng], { icon }).addTo(map).bindPopup(name).openPopup();

    return () => { map.remove(); mapInstanceRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
}

// ─────────────────────────────────────────────────────────────────
// Broadcast control panel (inline, simplified)
// ─────────────────────────────────────────────────────────────────
function BulkControl({ devices }: { devices: any[] }) {
  const [dimLevel, setDimLevel] = useState(100);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const [showPanel, setShowPanel] = useState(false);

  const onlineDevices = devices.filter((d) => d.status !== 'error' && d.status !== 'Offline');

  const run = async (cmd: 'powerOn' | 'powerOff' | 'setDimming', val?: number) => {
    if (onlineDevices.length === 0) {
      setStatus('error'); setMsg('No online lights.'); setTimeout(() => setStatus('idle'), 3000); return;
    }
    setStatus('sending'); setMsg('');
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
    let hasError = false;
    try {
      for (let i = 0; i < onlineDevices.length; i++) {
        const dev = onlineDevices[i];
        setMsg(`Sending… (${i + 1}/${onlineDevices.length})`);
        try {
          if (cmd === 'powerOn') await ttsCommands.powerOn(dev.ttsDeviceId);
          else if (cmd === 'powerOff') await ttsCommands.powerOff(dev.ttsDeviceId);
          else if (cmd === 'setDimming') await ttsCommands.setDimming(dev.ttsDeviceId, val ?? dimLevel);
        } catch { hasError = true; }
        if (i < onlineDevices.length - 1) await delay(2200);
      }
      setStatus(hasError ? 'error' : 'success');
      setMsg(hasError ? 'Some commands failed' : `Done — ${onlineDevices.length} lights updated`);
    } catch {
      setStatus('error'); setMsg('Broadcast failed');
    }
    setTimeout(() => { setStatus('idle'); setMsg(''); }, 4000);
  };

  const msgCls = {
    sending: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-green-500/10 text-green-400 border-green-500/20',
    error:   'bg-red-500/10 text-red-400 border-red-500/20',
    idle:    '',
  }[status];

  return (
    <div className="glass-panel rounded-2xl border border-[var(--panel-border)] p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-primary">
          <Zap className="w-5 h-5" />
          <h2 className="font-bold text-base">Control All Lights</h2>
          <span className="text-xs text-[var(--text-secondary)] font-normal ml-1">
            ({onlineDevices.length} online / {devices.length} total)
          </span>
        </div>
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-[var(--panel-border)] text-[var(--text-secondary)] hover:text-primary hover:border-primary/40 transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {showPanel ? 'Hide Controls' : 'Show Controls'}
        </button>
      </div>

      {showPanel && (
        <div className="space-y-4">
          {/* Status message */}
          {status !== 'idle' && (
            <div className={`inline-flex items-center px-3 py-2 text-xs font-medium gap-2 rounded-lg border ${msgCls}`}>
              {status === 'sending' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              {status === 'success' && <CheckCircle className="w-3.5 h-3.5" />}
              {status === 'error'   && <XCircle className="w-3.5 h-3.5" />}
              {msg}
            </div>
          )}

          {/* Quick action buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => run('powerOn')}
              disabled={status === 'sending'}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-black font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Sun className="w-4 h-4" /> All On
            </button>
            <button
              onClick={() => run('powerOff')}
              disabled={status === 'sending'}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/10 dark:bg-white/10 border border-[var(--panel-border)] text-[var(--text-primary)] font-semibold text-sm hover:border-red-400/60 hover:text-red-400 disabled:opacity-50 transition-colors"
            >
              <Moon className="w-4 h-4" /> All Off
            </button>
          </div>

          {/* Dimming slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[var(--text-secondary)]">Brightness</span>
              <span className="text-sm font-bold text-primary data-font">{dimLevel}%</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range" min={0} max={100} step={5} value={dimLevel}
                onChange={(e) => setDimLevel(Number(e.target.value))}
                className="flex-1 accent-[var(--accent-primary)]"
              />
              <button
                onClick={() => run('setDimming', dimLevel)}
                disabled={status === 'sending'}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/20 disabled:opacity-50 transition-colors"
              >
                <Power className="w-3.5 h-3.5" /> Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────
export function NagarpalikaDetails() {
  const selectedNagarpalikaId = useAppStore((s) => s.selectedNagarpalikaId);
  const nagarpalikas = useAppStore((s) => s.nagarpalikas);
  const districts = useAppStore((s) => s.districts);
  const lights = useAppStore((s) => s.lights);
  const devices = useAppStore((s) => s.devices);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const setSelectedNagarpalikaId = useAppStore((s) => s.setSelectedNagarpalikaId);
  const selectedDistrictId = useAppStore((s) => s.selectedDistrictId);

  const nagarpalika = nagarpalikas.find((n) => n.id === selectedNagarpalikaId);
  const district = districts.find((d) => d.id === selectedDistrictId);

  // Enrich devices for BulkControl
  const enrichedDevices = devices.map((dev) => ({
    id: dev.id,
    name: dev.name,
    ttsDeviceId: dev.ttsDeviceId,
    status: 'online' as const,
    brightness: 100,
    power: 0,
  }));

  if (!nagarpalika) {
    return (
      <div className="glass-panel rounded-3xl border border-[var(--panel-border)] p-6">
        <div className="text-sm text-[var(--text-secondary)]">No nagarpalika selected.</div>
        <button
          onClick={() => setCurrentPage('nagarpalikas')}
          className="mt-4 px-4 py-2 rounded-full bg-primary text-black font-semibold"
        >
          Back to Nagarpalikas
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <button
          onClick={() => { setSelectedNagarpalikaId(null); setCurrentPage('nagarpalikas'); }}
          className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-primary transition-colors mb-3"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Nagarpalikas
        </button>
        <h1 className="text-3xl font-bold">{nagarpalika.name}</h1>
        <p className="mt-1 text-[var(--text-secondary)] text-sm">
          {district?.name ?? ''} District · {nagarpalika.wardCount} Wards · {nagarpalika.lightCount} Lights
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Lights', value: nagarpalika.lightCount, icon: <Lightbulb className="w-4 h-4" />, color: 'text-primary' },
          { label: 'Online', value: nagarpalika.onlineLights, icon: <Wifi className="w-4 h-4" />, color: 'text-green-400' },
          { label: 'Offline', value: nagarpalika.lightCount - nagarpalika.onlineLights, icon: <WifiOff className="w-4 h-4" />, color: 'text-red-400' },
          { label: 'Gateways', value: nagarpalika.gatewayCount, icon: <Zap className="w-4 h-4" />, color: 'text-yellow-400' },
        ].map((kpi) => (
          <div key={kpi.label} className="glass-panel rounded-2xl border border-[var(--panel-border)] p-4 flex items-center gap-3">
            <div className={`p-2 rounded-full bg-current/10 ${kpi.color}`}>{kpi.icon}</div>
            <div>
              <div className="text-xs text-[var(--text-secondary)]">{kpi.label}</div>
              <div className={`text-xl font-bold data-font ${kpi.color}`}>{kpi.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Map */}
      <div className="glass-panel rounded-2xl border border-[var(--panel-border)] overflow-hidden" style={{ height: 340 }}>
        <NagarpalikaMap lat={29.3500} lng={79.5700} name={nagarpalika.name} />
      </div>

      {/* Bulk control */}
      <BulkControl devices={enrichedDevices} />

      {/* Lights list */}
      <div className="glass-panel rounded-2xl border border-[var(--panel-border)] p-4 md:p-5">
        <h2 className="font-bold text-base mb-4 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" /> Lights
        </h2>

        {lights.length === 0 ? (
          <div className="text-center py-10 text-sm text-[var(--text-secondary)]">
            No lights data available. Lights will appear here once the backend is connected.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--panel-border)] text-[var(--text-secondary)] text-xs uppercase tracking-wider">
                  <th className="text-left py-2 px-3">Light ID</th>
                  <th className="text-left py-2 px-3">Name</th>
                  <th className="text-left py-2 px-3">Status</th>
                  <th className="text-left py-2 px-3">Brightness</th>
                  <th className="text-left py-2 px-3">Power</th>
                  <th className="text-left py-2 px-3">Gateway</th>
                </tr>
              </thead>
              <tbody>
                {lights.map((light) => (
                  <tr key={light.id} className="border-b border-[var(--panel-border)]/50 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-xs text-[var(--text-secondary)]">{light.id}</td>
                    <td className="py-2.5 px-3 font-medium">{light.name}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                        light.status === 'Online'  ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : light.status === 'Warning' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>{light.status}</span>
                    </td>
                    <td className="py-2.5 px-3 data-font">{light.brightness}%</td>
                    <td className="py-2.5 px-3 data-font">{light.power} W</td>
                    <td className="py-2.5 px-3 text-xs text-[var(--text-secondary)]">{light.gateway}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
