import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Wifi, WifiOff, AlertTriangle, Navigation } from 'lucide-react';
import { fetchNodeRedTelemetry, tlv } from '../services/nodeRedTelemetry';
import { useAppStore } from '../store/useAppStore';
import { LightsData } from './LightsData';

interface CityMapProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CityMap({ isOpen, onClose }: CityMapProps) {
  const mapRef     = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const [activeLight, setActiveLight] = useState<any>(null);

  const isDarkMode    = useAppStore((s) => s.isDarkMode);
  const storeDevices  = useAppStore((s) => s.devices);
  const gateways      = useAppStore((s) => s.gateways);
  const lights        = useAppStore((s) => s.lights);

  // ── Parallel Telemetry Loading Logic for All Devices ─────────────────────────
  const [telemetries, setTelemetries] = useState<Record<string, any>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;
    const loadAllTelemetry = async () => {
      if (!storeDevices.length) return;
      try {
        const results: Record<string, any> = {};
        await Promise.all(
          storeDevices.map(async (dev) => {
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
      }
    };

    if (isOpen) {
      loadAllTelemetry();
      const interval = setInterval(loadAllTelemetry, 5000); // 5s live polling
      return () => {
        active = false;
        clearInterval(interval);
      };
    }
  }, [isOpen, storeDevices]);

  const getDeviceTelemetryProps = (dev: any) => {
    const telemetry = telemetries[dev.id];
    const hasData = !!telemetry && Object.keys(telemetry).length > 0;
    const faultStatus = (telemetry as any)?.fault_status?.[0]?.value;
    const status: 'online' | 'warning' | 'error' =
      !hasData ? 'error'
      : faultStatus && faultStatus !== '–' && faultStatus !== '0' ? 'warning'
      : 'online';

    const brightness = parseFloat(tlv(telemetry, 'brightness_percent', '0')) || 0;
    const power = parseFloat(tlv(telemetry, 'led_power_W', '0')) || 0;

    return { status, brightness, power };
  };

  const gatewayMarkers = gateways.map((gateway) => ({
    id: gateway.id,
    lat: gateway.lat,
    lng: gateway.lng,
    label: `Gateway ${gateway.id}`,
    type: 'gateway' as const,
    status: gateway.status === 'Online' ? 'online' : gateway.status === 'Warning' ? 'warning' : 'error',
    connectedLights: gateway.connectedLights,
    onlineLights: gateway.onlineLights,
    faults: gateway.faults,
    signal: gateway.signal,
  }));

  const lightMarkers = lights.map((light) => ({
    id: light.id,
    lat: light.lat,
    lng: light.lng,
    label: `${light.name} • ${light.gateway}`,
    type: 'light' as const,
    status: light.status === 'Online' ? 'online' : light.status === 'Warning' ? 'warning' : 'error',
    brightness: light.brightness,
    power: light.power,
    gateway: light.gateway,
    lastCommunication: light.lastCommunication,
  }));

  const devices = [
    ...storeDevices.map((dev) => {
      const props = getDeviceTelemetryProps(dev);
      return {
        id: dev.id,
        lat: dev.lat,
        lng: dev.lng,
        label: dev.address,
        name: dev.name,
        type: 'device' as const,
        status: props.status,
        brightness: props.brightness,
        power: props.power,
      };
    }),
    ...gatewayMarkers,
    ...lightMarkers,
  ];

  const active   = devices.filter((d) => d.status === 'online').length;
  const inactive = devices.filter((d) => d.status !== 'online').length;

  // ── Init Leaflet whenever the modal opens OR the theme changes ──────────
  useEffect(() => {
    if (!isOpen) return;

    let L: any;
    let map: any;

    async function initMap() {
      // Dynamically import leaflet so it only runs client-side
      L = await import('leaflet');

      // Fix default icon URLs broken by bundlers
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapRef.current) return;
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
      }

      // Centre on first device or default India
      const centre = devices.length > 0
        ? ([devices[0].lat, devices[0].lng] as [number, number])
        : ([20.5937, 78.9629] as [number, number]);

      map = L.map(mapRef.current, {
        center: centre,
        zoom: 15,
        zoomControl: true,
        attributionControl: true,
      });

      // Tile layer — dark vs light
      const tileUrl = isDarkMode
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      L.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OSM contributors',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map);

      // ── Place a marker for every device, gateway, and light ─────────────
      devices.forEach((dev) => {
        const colour =
          dev.type === 'gateway' ? '#38bdf8'
          : dev.type === 'light'   ? '#22c55e'
          : '#ef4444';

        const size = dev.type === 'gateway' ? 48 : dev.type === 'light' ? 28 : 40;
        const innerSize = dev.type === 'gateway' ? 12 : dev.type === 'light' ? 6 : 9;
        const outerRing = dev.type === 'light' ? '' : `
          <div style="position:absolute;inset:0;border-radius:50%;border:2px solid ${colour};animation:ping 1.2s cubic-bezier(0,0,0.2,1) infinite;opacity:0.7;"></div>
          <div style="position:absolute;inset:4px;border-radius:50%;border:1.5px solid ${colour};animation:ping 1.2s cubic-bezier(0,0,0.2,1) infinite;opacity:0.5;animation-delay:0.35s;"></div>
        `;

        const svgIcon = L.divIcon({
          className: '',
          html: `
            <div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">
              ${outerRing}
              <div style="
                width:${innerSize * 2.2}px;height:${innerSize * 2.2}px;border-radius:50%;
                background:${colour}30;border:2px solid ${colour};
                box-shadow:0 0 16px ${colour},0 0 28px ${colour}60;
                display:flex;align-items:center;justify-content:center;
                z-index:1;
              ">
                <div style="width:${innerSize}px;height:${innerSize}px;border-radius:50%;background:${colour};box-shadow:0 0 8px ${colour};"></div>
              </div>
            </div>
          `,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
          popupAnchor: [0, -size / 2],
        });

        const popupBg     = isDarkMode ? '#0f172a' : '#ffffff';
        const popupBorder = isDarkMode ? '#334155' : '#e2e8f0';
        const popupSub    = isDarkMode ? '#94a3b8' : '#64748b';
        const popupVal    = isDarkMode ? '#e2e8f0' : '#1e293b';

        const extraRows = dev.type === 'gateway'
          ? [
              ['Connected', `${(dev as any).connectedLights} lights`],
              ['Online', `${(dev as any).onlineLights}`],
              ['Faults', `${(dev as any).faults}`],
              ['Signal', `${(dev as any).signal} dBm`],
            ]
          : dev.type === 'light'
          ? [
              ['Gateway', `${(dev as any).gateway}`],
              ['Brightness', `${dev.brightness}%`],
              ['Power', `${dev.power} W`],
              ['Last Seen', `${(dev as any).lastCommunication}`],
            ]
          : [
              ['Brightness', `${dev.brightness}%`],
              ['Power', `${dev.power} W`],
            ];

        const extraHtml = extraRows
          .map(([label, value]) => `
            <div style="display:flex;justify-content:space-between;font-size:12px;padding:4px 0;border-top:1px solid ${popupBorder};">
              <span style="color:${popupSub}">${label}</span>
              <span style="color:${popupVal};font-weight:600;">${value}</span>
            </div>
          `)
          .join('');

        const popupHtml = `
          <div style="font-family:monospace;min-width:220px;padding:4px 0;background:${popupBg};">
            <div style="font-size:16px;font-weight:700;color:${colour};margin-bottom:6px;">${dev.id}</div>
            <div style="font-size:11px;color:${popupSub};margin-bottom:8px;line-height:1.4;">${dev.label}</div>
            <div style="display:flex;justify-content:space-between;font-size:12px;padding:4px 0;border-top:1px solid ${popupBorder};">
              <span style="color:${popupSub}">Type</span>
              <span style="color:${colour};font-weight:600;text-transform:uppercase;">${dev.type}</span>
            </div>
            ${extraHtml}
            <div style="display:flex;justify-content:space-between;font-size:12px;padding:4px 0;border-top:1px solid ${popupBorder};">
              <span style="color:${popupSub}">Lat / Lng</span>
              <span style="color:${popupVal};font-weight:600;">${dev.lat.toFixed(5)}, ${dev.lng.toFixed(5)}</span>
            </div>
          </div>
        `;

        const marker = L.marker([dev.lat, dev.lng], { icon: svgIcon })
          .addTo(map)
          .bindPopup(popupHtml, {
            maxWidth: 260,
            className: 'sl-popup',
          });

        // Add click handler for light markers to open LightsData modal
        if (dev.type === 'light') {
          marker.on('click', () => {
            const light = lights.find((l) => l.id === dev.id);
            if (light) {
              setActiveLight(light);
            }
          });
        }
      });

      // Fit map to all markers if multiple devices
      if (devices.length > 1) {
        const bounds = L.latLngBounds(devices.map((d) => [d.lat, d.lng]));
        map.fitBounds(bounds, { padding: [60, 60] });
      }

      leafletRef.current = map;
    }

    // Small delay so the modal is fully rendered before measuring the container
    const tid = setTimeout(initMap, 120);
    return () => clearTimeout(tid);
  }, [isOpen, isDarkMode, storeDevices, gateways, lights]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update marker colours when telemetry changes without re-creating the map
  useEffect(() => {
    if (!leafletRef.current || !isOpen) return;
    leafletRef.current.eachLayer((layer: any) => {
      if (layer.setStyle) layer.setStyle({});
    });
  }, [telemetries, isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[70] flex items-center justify-center p-4 md:p-8"
          >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel w-full max-w-6xl h-[90vh] rounded-2xl border glowing-border flex flex-col shadow-2xl overflow-hidden"
          >
            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between p-4 md:p-5 border-b border-[var(--panel-border)] bg-[var(--bg-color)]/40 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-lg leading-tight">City Map</h2>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Live device positions &amp; status
                    {lastUpdated && ` · Updated ${lastUpdated.toLocaleTimeString()}`}
                  </p>
                </div>
              </div>

              {/* ── KPI pills ─── */}
              <div className="hidden sm:flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-xs font-bold text-primary">
                  <Wifi className="w-3.5 h-3.5" />
                  <span>{active} Active</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-error/10 border border-error/30 text-xs font-bold text-error">
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>{inactive} Inactive</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/10 dark:bg-white/5 border border-[var(--panel-border)] text-xs font-bold text-[var(--text-secondary)]">
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{devices.length} Total</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-error/20 hover:text-error transition-colors text-[var(--text-secondary)] border border-[var(--panel-border)] ml-3"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── Mobile KPI row ──────────────────────────────────────── */}
            <div className="sm:hidden flex items-center gap-2 px-4 py-2 border-b border-[var(--panel-border)] bg-[var(--bg-color)]/20 shrink-0">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs font-bold text-primary">
                <Wifi className="w-3 h-3" /> {active} Active
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-error/10 border border-error/30 text-xs font-bold text-error">
                <WifiOff className="w-3 h-3" /> {inactive} Inactive
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-[var(--panel-border)] text-xs font-bold text-[var(--text-secondary)]">
                <Navigation className="w-3 h-3" /> {devices.length} Total
              </div>
            </div>

            {/* ── Map container ───────────────────────────────────────── */}
            <div className="flex flex-1 overflow-hidden">
              {/* Map */}
              <div ref={mapRef} className="flex-1 z-0" style={{ minHeight: 0 }} />

              {/* ── Device sidebar list ──────────────────────────────── */}
              <div className="hidden lg:flex flex-col w-64 shrink-0 border-l border-[var(--panel-border)] bg-[var(--bg-color)]/60 backdrop-blur-sm overflow-y-auto scrollbar-hide">
                <div className="p-4 border-b border-[var(--panel-border)]">
                  <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Device List</p>
                </div>
                <div className="flex-1 p-3 space-y-2">
                  {devices.map((dev) => {
                    const colour =
                      dev.status === 'online'  ? 'text-primary border-primary/40 bg-primary/5'
                      : dev.status === 'warning' ? 'text-warning border-warning/40 bg-warning/5'
                      : 'text-error border-error/40 bg-error/5';
                    const dot =
                      dev.status === 'online'  ? 'bg-primary'
                      : dev.status === 'warning' ? 'bg-warning'
                      : 'bg-error';

                    const infoRows = dev.type === 'gateway'
                      ? [
                          ['Connected', `${(dev as any).connectedLights} lights`],
                          ['Online', `${(dev as any).onlineLights}`],
                          ['Faults', `${(dev as any).faults}`],
                        ]
                      : dev.type === 'light'
                      ? [
                          ['Gateway', `${(dev as any).gateway}`],
                          ['Brightness', `${dev.brightness}%`],
                          ['Power', `${dev.power} W`],
                        ]
                      : [
                          ['Brightness', `${dev.brightness}%`],
                          ['Power', `${dev.power} W`],
                        ];

                    return (
                      <div
                        key={dev.id}
                        onClick={() => {
                          if (leafletRef.current) {
                            leafletRef.current.setView([dev.lat, dev.lng], 16, { animate: true });
                          }
                        }}
                        className={`p-3 rounded-xl border cursor-pointer hover:scale-[1.02] transition-transform ${colour}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold data-font text-sm">{dev.id}</span>
                          <span className={`w-2 h-2 rounded-full ${dot} animate-pulse`} />
                        </div>
                        <div className="text-xs opacity-70 mb-2 leading-snug">{dev.label}</div>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <div className="opacity-60">Type</div>
                          <div className="font-bold text-right uppercase">{dev.type}</div>
                          <div className="opacity-60">Status</div>
                          <div className="font-bold text-right uppercase">{dev.status}</div>
                          {infoRows.map(([label, value]) => (
                            <>
                              <div className="opacity-60" key={`${dev.id}-${label}-label`}>{label}</div>
                              <div className="font-bold text-right" key={`${dev.id}-${label}-value`}>{value}</div>
                            </>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {devices.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-[var(--text-secondary)] text-xs text-center gap-2">
                      <AlertTriangle className="w-6 h-6" />
                      <span>No devices configured</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    <LightsData light={activeLight} isOpen={!!activeLight} onClose={() => setActiveLight(null)} />
  </>
  );
}
