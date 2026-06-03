import { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { KpiCard } from '../components/KpiCard';
import { AlertItem } from '../components/AlertItem';
import { DeviceCard } from '../components/DeviceCard';
import { LightsList } from '../components/LightsList';
import { LightsData } from '../components/LightsData';
import { AddLightModal } from '../components/AddLightModal';
import { useTelemetry, tlv } from '../hooks/useTelemetry';
import { useAppStore } from '../store/useAppStore';

export function Dashboard() {
  const [isLightsListOpen,  setIsLightsListOpen]  = useState(false);
  const [isAddLightOpen,    setIsAddLightOpen]    = useState(false);
  const [activeLight,       setActiveLight]       = useState<any>(null);

  const devices = useAppStore((s) => s.devices);

  // Primary device telemetry (first / seed device)
  const primaryDevice = devices[0];
  const { data: telemetry, isLoading, error: telemetryError, lastUpdated } =
    useTelemetry(primaryDevice?.ttsDeviceId);

  // ── Derive primary device status ──────────────────────────────────────────
  const hasData      = !!telemetry && Object.keys(telemetry).length > 0;
  const faultStatus  = (telemetry as any)?.fault_status?.[0]?.value;
  const primaryStatus: 'online' | 'warning' | 'error' =
    !hasData        ? 'error'
    : faultStatus && faultStatus !== '–' && faultStatus !== '0' ? 'warning'
    : 'online';

  const brightness = parseFloat(tlv(telemetry, 'brightness_percent', '0')) || 0;
  const power      = parseFloat(tlv(telemetry, 'led_power_W', '0'))        || 0;

  // ── KPI aggregates ────────────────────────────────────────────────────────
  // Only primary device has live telemetry; others are "registered but pending"
  const activeLights  = hasData ? 1 : 0;
  const rawUptime     = tlv(telemetry, 'operating_time_hours', '–');
  const uptimeStr     = rawUptime === '–' ? '–' : `${rawUptime} hrs`;
  const rawPower      = tlv(telemetry, 'led_power_W', '–');
  const totalPowerStr = rawPower === '–' ? '– W' : `${rawPower} W`;

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
          title="Active Lights"
          value={String(activeLights)}
          sub={hasData ? 'Device online' : 'No signal yet'}
          trendUp={hasData}
          onClick={() => setIsLightsListOpen(true)}
        />
        <KpiCard
          title="System Uptime"
          value={uptimeStr}
          sub="Operating hours"
        />
        <KpiCard
          title="Total Power Draw"
          value={totalPowerStr}
          sub={hasData ? 'LED output power' : 'Awaiting data'}
        />
      </div>

      {/* ── Telemetry + Alerts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Telemetry panel */}
        <div className="lg:col-span-2 glass-panel rounded-xl p-4 md:p-6 border flex flex-col glowing-border min-h-[280px] md:h-[400px]">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h3 className="font-bold text-base md:text-lg">Live Telemetry</h3>
            <span className="flex items-center text-xs">
              <span className="w-2 h-2 rounded-full bg-primary mr-2 shadow-[0_0_8px_var(--accent-primary)] animate-pulse" />
              Live Stream
            </span>
          </div>

          {hasData ? (
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3 content-start overflow-y-auto scrollbar-hide">
              {[
                { label: 'Brightness',      value: tlv(telemetry, 'brightness_percent'), unit: '%'   },
                { label: 'LED Power',       value: tlv(telemetry, 'led_power_W'),        unit: 'W'   },
                { label: 'Output Current',  value: tlv(telemetry, 'output_current_mA'),  unit: 'mA'  },
                { label: 'Output Voltage',  value: tlv(telemetry, 'output_voltage_V'),   unit: 'Vdc' },
                { label: 'Input Power',     value: tlv(telemetry, 'input_power_W'),      unit: 'W'   },
                { label: 'Input Voltage',   value: tlv(telemetry, 'input_voltage_V'),    unit: 'Vac' },
                { label: 'Input Current',   value: tlv(telemetry, 'input_current_mA'),   unit: 'mA'  },
                { label: 'Frequency',       value: tlv(telemetry, 'input_frequency_Hz'), unit: 'Hz'  },
                { label: 'Internal Temp',   value: tlv(telemetry, 'internal_temp_C'),    unit: '°C'  },
                { label: 'Power Factor',    value: tlv(telemetry, 'power_factor'),        unit: ''    },
                { label: 'Lamp-On Time',    value: tlv(telemetry, 'lamp_on_time_hours'),  unit: 'hrs' },
                { label: 'Operating Time',  value: tlv(telemetry, 'operating_time_hours'),unit: 'hrs' },
              ].map(({ label, value, unit }) => (
                <div key={label} className="p-3 rounded-lg bg-black/5 dark:bg-white/5 border border-[var(--panel-border)]">
                  <div className="text-xs text-[var(--text-secondary)] mb-1">{label}</div>
                  <div className="font-bold data-font text-lg leading-tight">
                    {value} <span className="text-xs font-normal text-[var(--text-secondary)]">{unit}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 border border-dashed border-[var(--panel-border)] rounded-lg flex flex-col items-center justify-center text-[var(--text-secondary)] text-sm text-center px-4 gap-3">
              {isLoading
                ? <><RefreshCw className="w-5 h-5 animate-spin text-primary" /><span>Fetching live data…</span></>
                : <><span className="text-2xl">📡</span><span>No uplink received yet. Waiting for device…</span></>
              }
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="glass-panel rounded-xl p-4 md:p-6 border flex flex-col glowing-border min-h-[200px] md:h-[400px]">
          <h3 className="font-bold text-base md:text-lg mb-4 md:mb-6">System Status</h3>
          <div className="flex-1 space-y-3 md:space-y-4 overflow-y-auto pr-1 scrollbar-hide">
            {hasData ? (
              <>
                <AlertItem
                  id={primaryDevice?.id ?? 'device'}
                  issue={primaryStatus === 'online' ? 'Device Online' : 'Fault Detected'}
                  time={lastUpdated ? lastUpdated.toLocaleTimeString() : 'now'}
                  type={primaryStatus === 'online' ? 'info' : 'error'}
                />
                {parseFloat(tlv(telemetry, 'internal_temp_C', '0')) > 60 && (
                  <AlertItem id={primaryDevice?.id ?? 'device'} issue="High Temperature" time="now" type="warning" />
                )}
                {parseFloat(tlv(telemetry, 'rssi', '0')) < -110 && (
                  <AlertItem id={primaryDevice?.id ?? 'device'} issue="Weak LoRa Signal" time="now" type="warning" />
                )}
                {devices.length > 1 && (
                  <AlertItem
                    id={`+${devices.length - 1} device${devices.length > 2 ? 's' : ''}`}
                    issue="Registered — awaiting uplink"
                    time="pending"
                    type="warning"
                  />
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)] text-sm text-center gap-2">
                <span className="text-2xl">🔌</span>
                <span>No alerts — awaiting device signal</span>
              </div>
            )}
          </div>
        </div>
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
          {/* Primary device with live telemetry */}
          {primaryDevice && (
            <DeviceCard
              id={primaryDevice.id}
              name={primaryDevice.name}
              status={primaryStatus}
              brightness={brightness}
              power={power}
              onClick={() => handleDeviceClick({ ...primaryDevice, status: primaryStatus })}
            />
          )}

          {/* Additional registered devices (no live telemetry yet) */}
          {devices.slice(1).map((dev) => (
            <DeviceCard
              key={dev.id}
              id={dev.id}
              name={dev.name}
              status="error"
              brightness={0}
              power={0}
              onClick={() => handleDeviceClick({ ...dev, status: 'error' })}
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
        onDeviceClick={handleDeviceClick}
        primaryStatus={primaryStatus}
        brightness={brightness}
        power={power}
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
