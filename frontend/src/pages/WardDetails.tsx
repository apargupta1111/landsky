import { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft, Power, Sun, Moon, Zap, Wifi, WifiOff,
  Lightbulb, RefreshCw, CheckCircle, XCircle, SlidersHorizontal, MapPin,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { ttsCommands } from '../services/ttsDownlink';
import { fetchNodeRedTelemetry, tlv } from '../services/nodeRedTelemetry';

// ─────────────────────────────────────────────────────────────────
// Embedded map – CartoDB tiles matching CityMap theme
// ─────────────────────────────────────────────────────────────────
function WardMap({ devices, wardName }: { devices: any[]; wardName: string }) {
  const mapRef      = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<any>(null);
  const isDarkMode  = useAppStore((s) => s.isDarkMode);

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      // Remove old instance if theme/devices changed
      if (instanceRef.current) {
        instanceRef.current.remove();
        instanceRef.current = null;
      }

      const L = await import('leaflet');

      // Fix broken default icon URLs (common bundler issue)
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Center map around first device, or default to Bhimtal Lake center
      const defaultLat = 29.3500;
      const defaultLng = 79.5700;
      const centerLat = devices.length > 0 ? devices[0].lat : defaultLat;
      const centerLng = devices.length > 0 ? devices[0].lng : defaultLng;

      const map = L.map(mapRef.current, { zoomControl: true, attributionControl: true })
        .setView([centerLat, centerLng], 15);
      instanceRef.current = map;

      // Match CityMap tile selection based on dark/light mode
      const tileUrl = isDarkMode
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=cb1_2lwq_1_02284cb8882fd6148f92cc12'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=cb1_2lwq_1_02284cb8882fd6148f92cc12';

      L.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OSM contributors',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map);

      // Add a marker for each device in this ward
      devices.forEach((dev) => {
        const isOnline = dev.status === 'online';
        const colour = isOnline ? '#22c55e' : '#ef4444';

        const icon = L.divIcon({
          className: '',
          html: `
            <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
              <div style="position:absolute;inset:0;border-radius:50%;border:2px solid ${colour};animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;opacity:0.6;"></div>
              <div style="width:16px;height:16px;border-radius:50%;background:${colour}30;border:2px solid ${colour};box-shadow:0 0 12px ${colour};display:flex;align-items:center;justify-content:center;z-index:1;">
                <div style="width:6px;height:6px;border-radius:50%;background:${colour};"></div>
              </div>
            </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const popupContent = `
          <div style="font-family: sans-serif; padding: 4px; color: #333;">
            <strong style="font-size: 14px; color: #111;">${dev.name}</strong><br/>
            <span style="font-size: 12px; color: #666; display: block; margin-top: 2px; margin-bottom: 4px;">${dev.address}</span>
            <div style="font-size: 12px; border-top: 1px solid #eee; pt-2; margin-top: 4px;">
              Status: <span style="color: ${isOnline ? '#16a34a' : '#dc2626'}; font-weight: bold;">${dev.status.toUpperCase()}</span><br/>
              Brightness: <strong>${dev.brightness}%</strong><br/>
              Power: <strong>${dev.power} W</strong>
            </div>
          </div>
        `;

        L.marker([dev.lat, dev.lng], { icon })
          .addTo(map)
          .bindPopup(popupContent);
      });
    };

    initMap();

    return () => {
      if (instanceRef.current) {
        instanceRef.current.remove();
        instanceRef.current = null;
      }
    };
  }, [isDarkMode, devices, wardName]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
}

// ─────────────────────────────────────────────────────────────────
// Bulk Control Panel
// ─────────────────────────────────────────────────────────────────
function BulkControl({ devices }: { devices: any[] }) {
  const [dimLevel, setDimLevel] = useState(100);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const [showPanel, setShowPanel] = useState(false);

  const online = devices.filter((d) => d.status !== 'error' && d.status !== 'Offline');

  const run = async (cmd: 'powerOn' | 'powerOff' | 'setDimming', val?: number) => {
    if (online.length === 0) {
      setStatus('error'); setMsg('No online lights found.');
      setTimeout(() => setStatus('idle'), 3000); return;
    }
    setStatus('sending'); setMsg('');
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
    let hasError = false;
    try {
      for (let i = 0; i < online.length; i++) {
        const dev = online[i];
        setMsg(`Sending… (${i + 1}/${online.length})`);
        try {
          if (cmd === 'powerOn')     await ttsCommands.powerOn(dev.ttsDeviceId);
          else if (cmd === 'powerOff')  await ttsCommands.powerOff(dev.ttsDeviceId);
          else if (cmd === 'setDimming') await ttsCommands.setDimming(dev.ttsDeviceId, val ?? dimLevel);
        } catch { hasError = true; }
        if (i < online.length - 1) await delay(3000);
      }
      setStatus(hasError ? 'error' : 'success');
      setMsg(hasError ? 'Some commands failed' : `Done — ${online.length} lights updated`);
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          <Zap className="w-5 h-5" />
          <h2 className="font-bold text-base">Control All Lights</h2>
          <span className="text-xs text-[var(--text-secondary)] font-normal ml-1">
            ({online.length} online / {devices.length} total)
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
        <div className="mt-4 space-y-4">
          {status !== 'idle' && (
            <div className={`inline-flex items-center px-3 py-2 text-xs font-medium gap-2 rounded-lg border ${msgCls}`}>
              {status === 'sending' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              {status === 'success' && <CheckCircle className="w-3.5 h-3.5" />}
              {status === 'error'   && <XCircle className="w-3.5 h-3.5" />}
              {msg}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button onClick={() => run('powerOn')} disabled={status === 'sending'}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-black font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity">
              <Sun className="w-4 h-4" /> All On
            </button>
            <button onClick={() => run('powerOff')} disabled={status === 'sending'}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/10 dark:bg-white/10 border border-[var(--panel-border)] font-semibold text-sm hover:border-red-400/60 hover:text-red-400 disabled:opacity-50 transition-colors">
              <Moon className="w-4 h-4" /> All Off
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[var(--text-secondary)]">Brightness</span>
              <span className="text-sm font-bold text-primary data-font">{dimLevel}%</span>
            </div>
            <div className="flex items-center gap-3">
              <input type="range" min={0} max={100} step={5} value={dimLevel}
                onChange={(e) => setDimLevel(Number(e.target.value))}
                className="flex-1 accent-[var(--accent-primary)]" />
              <button onClick={() => run('setDimming', dimLevel)} disabled={status === 'sending'}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/20 disabled:opacity-50 transition-colors">
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
// Main Ward Details Page
// ─────────────────────────────────────────────────────────────────
export function WardDetails() {
  const selectedWardId     = useAppStore((s) => s.selectedWardId);
  const wards              = useAppStore((s) => s.wards);
  const nagarpalikas       = useAppStore((s) => s.nagarpalikas);
  const selectedNagarpalikaId = useAppStore((s) => s.selectedNagarpalikaId);
  const storeDevices       = useAppStore((s) => s.devices);
  const setCurrentPage     = useAppStore((s) => s.setCurrentPage);
  const setSelectedWardId  = useAppStore((s) => s.setSelectedWardId);

  const ward        = wards.find((w) => w.id === selectedWardId);
  const nagarpalika = nagarpalikas.find((n) => n.id === selectedNagarpalikaId);

  // Filter store streetlights to only include those in the current ward
  const wardDevices = storeDevices.filter((d) => d.wardId === selectedWardId);

  // ── Parallel Telemetry Loading Logic for Ward Streetlights ─────────────────
  const [telemetries, setTelemetries] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;
    const loadTelemetry = async () => {
      if (!wardDevices.length) return;
      setIsLoading(true);
      try {
        const results: Record<string, any> = {};
        await Promise.all(
          wardDevices.map(async (dev) => {
            try {
              const data = await fetchNodeRedTelemetry(dev.ttsDeviceId);
              results[dev.id] = data;
            } catch (e) {
              console.error(`Telemetry error for ${dev.id}:`, e);
            }
          })
        );
        if (active) {
          setTelemetries(results);
          setLastUpdated(new Date());
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadTelemetry();
    const interval = setInterval(loadTelemetry, 5000); // 5s polling
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [selectedWardId, wardDevices]); // Trigger re-load on ward change

  const getDeviceTelemetryProps = (dev: any) => {
    const telemetry = telemetries[dev.id];
    const faultStatus = (telemetry as any)?.fault_status?.[0]?.value;
    const status: 'online' | 'warning' | 'error' =
      dev.connectionStatus === 'off' ? 'error'
      : faultStatus && faultStatus !== '–' && faultStatus !== '0' && faultStatus.toLowerCase() !== 'normal' ? 'warning'
      : 'online';

    const brightness = parseFloat(tlv(telemetry, 'brightness_percent', '0')) || 0;
    const power = parseFloat(tlv(telemetry, 'led_power_W', '0')) || 0;

    return { status, brightness, power };
  };

  const enrichedWardDevices = wardDevices.map((dev) => {
    const props = getDeviceTelemetryProps(dev);
    return {
      ...dev,
      ...props,
    };
  });

  if (!ward) {
    return (
      <div className="glass-panel rounded-3xl border border-[var(--panel-border)] p-6">
        <div className="text-sm text-[var(--text-secondary)]">No ward selected.</div>
        <button onClick={() => setCurrentPage('wards')}
          className="mt-4 px-4 py-2 rounded-full bg-primary text-black font-semibold">
          Back to Wards
        </button>
      </div>
    );
  }

  // Aggregate local KPI values from live data if possible
  const onlineCount = enrichedWardDevices.filter((d) => d.status === 'online').length;
  const offlineCount = enrichedWardDevices.filter((d) => d.status === 'error').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <button
          onClick={() => { setSelectedWardId(null); setCurrentPage('wards'); }}
          className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-primary transition-colors mb-3"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Wards
        </button>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <MapPin className="w-7 h-7 text-primary" /> {ward.name}
            </h1>
            <p className="mt-1 text-[var(--text-secondary)] text-sm">
              {nagarpalika?.name ?? ''} Nagarpalika · {ward.gatewayCount} Gateways · {enrichedWardDevices.length} Lights
            </p>
          </div>
          {lastUpdated && (
            <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5 bg-black/10 dark:bg-white/5 px-3 py-1.5 rounded-full border border-[var(--panel-border)] self-start md:self-auto">
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-primary' : ''}`} />
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Lights', value: enrichedWardDevices.length,  icon: <Lightbulb className="w-4 h-4" />, color: 'text-primary' },
          { label: 'Online',       value: onlineCount, icon: <Wifi className="w-4 h-4" />,      color: 'text-green-400' },
          { label: 'Offline',      value: offlineCount, icon: <WifiOff className="w-4 h-4" />, color: 'text-red-400' },
          { label: 'Gateways',     value: ward.gatewayCount, icon: <Zap className="w-4 h-4" />,       color: 'text-yellow-400' },
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
      <div
        className="glass-panel rounded-2xl border border-[var(--panel-border)] overflow-hidden"
        style={{ height: 360 }}
      >
        <WardMap devices={enrichedWardDevices} wardName={ward.name} />
      </div>

      {/* Bulk control */}
      <BulkControl devices={enrichedWardDevices} />

      {/* Lights list */}
      <div className="glass-panel rounded-2xl border border-[var(--panel-border)] p-4 md:p-5">
        <h2 className="font-bold text-base mb-4 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" /> Streetlights in {ward.name}
        </h2>

        {enrichedWardDevices.length === 0 ? (
          <div className="text-center py-12 text-sm text-[var(--text-secondary)]">
            No streetlights registered for this ward yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--panel-border)] text-[var(--text-secondary)] text-xs uppercase tracking-wider">
                  <th className="text-left py-2 px-3">Device ID</th>
                  <th className="text-left py-2 px-3">Name</th>
                  <th className="text-left py-2 px-3">Location / Address</th>
                  <th className="text-left py-2 px-3">Status</th>
                  <th className="text-left py-2 px-3">Brightness</th>
                  <th className="text-left py-2 px-3">Power</th>
                </tr>
              </thead>
              <tbody>
                {enrichedWardDevices.map((dev) => (
                  <tr key={dev.id} className="border-b border-[var(--panel-border)]/50 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 font-mono text-xs text-[var(--text-secondary)]">{dev.id}</td>
                    <td className="py-3 px-3 font-medium">{dev.name}</td>
                    <td className="py-3 px-3 text-xs text-[var(--text-secondary)] max-w-xs truncate" title={dev.address}>
                      {dev.address}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        dev.status === 'online'
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : dev.status === 'warning'
                          ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>{dev.status.toUpperCase()}</span>
                    </td>
                    <td className="py-3 px-3 data-font">{dev.brightness}%</td>
                    <td className="py-3 px-3 data-font">{dev.power} W</td>
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
