import { useState, useEffect } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { KpiCard } from '../components/KpiCard';
import { AlertItem } from '../components/AlertItem';
import { DeviceCard } from '../components/DeviceCard';
import { LightsList } from '../components/LightsList';
import { LightsData } from '../components/LightsData';
import { AddLightModal } from '../components/AddLightModal';
import { fetchNodeRedTelemetry, tlv } from '../services/nodeRedTelemetry';
import { useAppStore } from '../store/useAppStore';

export function Dashboard() {
  const [isLightsListOpen,  setIsLightsListOpen]  = useState(false);
  const [isAddLightOpen,    setIsAddLightOpen]    = useState(false);
  const [activeLight,       setActiveLight]       = useState<any>(null);

  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const devices        = useAppStore((s) => s.devices);
  const projects       = useAppStore((s) => s.projects);
  const gateways       = useAppStore((s) => s.gateways);
  const lights         = useAppStore((s) => s.lights);
  const faults         = useAppStore((s) => s.faults);

  // ── Parallel Telemetry Loading Logic for All Devices ─────────────────────────
  const [telemetries, setTelemetries] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [telemetryError, setTelemetryError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadAllTelemetry = async () => {
      if (!devices.length) return;
      setIsLoading(true);
      try {
        const results: Record<string, any> = {};
        await Promise.all(
          devices.map(async (dev) => {
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
          setTelemetryError(null);
        }
      } catch (err: any) {
        if (active) {
          setTelemetryError(err.message || 'Error loading telemetry');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadAllTelemetry();
    const interval = setInterval(loadAllTelemetry, 5000); // 5s live polling
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [devices]);

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

  const enrichedDevices = devices.map((dev) => {
    const props = getDeviceTelemetryProps(dev);
    return {
      ...dev,
      ...props,
    };
  });

  // ── KPI aggregates ────────────────────────────────────────────────────────
  const totalProjects = projects.length;
  const totalGateways = gateways.length;
  const totalLights   = lights.length;
  const onlineLights  = enrichedDevices.filter((d) => d.status === 'online').length;
  const offlineLights = enrichedDevices.filter((d) => d.status === 'error').length;
  const faultyLights  = enrichedDevices.filter((d) => d.status === 'warning').length;
  const todaysEnergy  = '1.4 MWh';
  const monthlySavings = '28.6%';

  const handleDeviceClick = (light: any) => setActiveLight(light);

  return (
    <>
      {/* ── Live indicator ── */}
      {(isLoading || lastUpdated || telemetryError) && (
        <div className="flex items-center gap-2 mb-4 text-xs text-[var(--text-secondary)]">
          {isLoading && <RefreshCw className="w-3 h-3 animate-spin text-primary" />}
          {lastUpdated && !isLoading && (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span>Live — last update {lastUpdated.toLocaleTimeString()}</span>
            </>
          )}
          {telemetryError && <span className="text-error">{telemetryError}</span>}
        </div>
      )}

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <KpiCard
          title="Total Projects"
          value={`${totalProjects}`}
          onClick={() => setCurrentPage('projects')}
        />
        <KpiCard
          title="Total Gateways"
          value={`${totalGateways}`}
          sub="Active network nodes"
          onClick={() => setCurrentPage('gateways')}
        />
        <KpiCard
          title="Total Lights"
          value={`${totalLights}`}
          onClick={() => setCurrentPage('analytics') }
        />
        <KpiCard
          title="Online Lights"
          value={`${onlineLights}`}
          sub="Live status"
        />
        <KpiCard
          title="Offline Lights"
          value={`${offlineLights}`}
        />
        <KpiCard
          title="Faulty Lights"
          value={`${faultyLights}`}
        />
        <KpiCard
          title="Today's Energy"
          value={todaysEnergy}
          sub="Estimated output"
        />
        <KpiCard
          title="Monthly Savings"
          value={monthlySavings}
          sub="Compared to last month"
        />
      </div>
      
      

  

      {/* ── Device Control ── */}
      <div className="mt-6 md:mt-8">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h3 className="font-bold text-lg md:text-xl">
            Device Control
            <span className="ml-2 text-xs font-normal text-[var(--text-secondary)]">
              ({devices.length} registered)
            </span>
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setIsAddLightOpen(true)}
              className="px-3 md:px-4 py-1.5 md:py-2 bg-primary text-white border border-primary rounded-lg text-xs md:text-sm font-bold shadow-md hover:brightness-110 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Light
            </button>
            <button
              onClick={() => setIsLightsListOpen(true)}
              className="px-3 md:px-4 py-1.5 md:py-2 bg-primary/10 dark:bg-primary/20 text-primary border border-primary rounded-lg text-xs md:text-sm font-bold shadow-md dark:shadow-[0_0_15px_var(--glow-shadow)] hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors cursor-pointer whitespace-nowrap"
            >
              Manage Devices
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
          {/* Render all registered devices with live telemetry */}
          {enrichedDevices.map((dev) => (
            <DeviceCard
              key={dev.id}
              id={dev.id}
              name={dev.name}
              status={dev.status}
              brightness={dev.brightness}
              power={dev.power}
              onClick={() => handleDeviceClick(dev)}
            />
          ))}

          {/* "Add Light" placeholder card */}
          <button
            onClick={() => setIsAddLightOpen(true)}
            className="glass-panel rounded-xl p-5 border border-dashed border-primary/40 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-primary min-h-[140px] group"
          >
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-primary/50 group-hover:border-primary flex items-center justify-center transition-colors">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold">Add Light</span>
          </button>
        </div>
      </div>

      {/* ── Modals ── */}
      <LightsList
        isOpen={isLightsListOpen}
        onClose={() => setIsLightsListOpen(false)}
        title="Active Lights Directory"
        searchPlaceholder="Search light..."
        itemCountLabel="Light"
        items={enrichedDevices}
        renderItem={(dev) => (
          <DeviceCard
            id={dev.id}
            name={dev.name}
            status={dev.status}
            brightness={dev.brightness}
            power={dev.power}
          />
        )}
        onItemClick={handleDeviceClick}
        emptyMessage="No lights match your search."
      />

      <LightsData
        light={activeLight}
        isOpen={!!activeLight}
        onClose={() => setActiveLight(null)}
      />

      <AddLightModal
        isOpen={isAddLightOpen}
        onClose={() => setIsAddLightOpen(false)}
      />
    </>
  );
}
