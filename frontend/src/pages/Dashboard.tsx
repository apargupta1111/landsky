import { useState } from 'react';
import { KpiCard } from '../components/KpiCard';
import { AlertItem } from '../components/AlertItem';
import { DeviceCard } from '../components/DeviceCard';
import { LightsList } from '../components/LightsList';
import { LightsData } from '../components/LightsData';
import { useTelemetry, tlv } from '../hooks/useTelemetry';
import { DEVICE_CONFIG } from '../config/endpoints';
import { RefreshCw } from 'lucide-react';

export function Dashboard() {
  const [isLightsListOpen, setIsLightsListOpen] = useState(false);
  const [activeLight, setActiveLight] = useState<any>(null);

  // ── Live telemetry from Node-RED ──────────────────────────────────────────
  const { data: telemetry, isLoading, error: telemetryError, lastUpdated } = useTelemetry();

  // ── Derive device status from telemetry ───────────────────────────────────
  const hasData       = !!telemetry && Object.keys(telemetry).length > 0;
  const faultStatus   = (telemetry as any)?.fault_status?.[0]?.value;
  const deviceStatus: 'online' | 'warning' | 'error' =
    !hasData          ? 'error'
    : faultStatus && faultStatus !== '–' && faultStatus !== '0' ? 'warning'
    : 'online';

  // ── KPI values derived from live telemetry ────────────────────────────────
  const activeLights   = hasData ? 1 : 0;
  const rawPower       = tlv(telemetry, 'led_power_W', '–');
  const totalPowerStr  = rawPower === '–' ? '– W' : `${rawPower} W`;
  const rawUptime      = tlv(telemetry, 'operating_time_hours', '–');
  const uptimeStr      = rawUptime === '–' ? '–' : `${rawUptime} hrs`;

  // ── Device card values ────────────────────────────────────────────────────
  const brightness = parseFloat(tlv(telemetry, 'brightness_percent', '0')) || 0;
  const power      = parseFloat(tlv(telemetry, 'led_power_W', '0'))        || 0;

  const realDevice = {
    id:   DEVICE_CONFIG.endDeviceId,
    name: 'Streetlight Node',
    status: deviceStatus,
  };

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
            <div className="flex space-x-2">
              <span className="flex items-center text-xs">
                <span className="w-2 h-2 rounded-full bg-primary mr-2 shadow-[0_0_8px_var(--accent-primary)] animate-pulse" />
                Live Stream
              </span>
            </div>
          </div>

          {/* Live telemetry data grid */}
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
                  id={DEVICE_CONFIG.endDeviceId}
                  issue={deviceStatus === 'online' ? 'Device Online' : 'Fault Detected'}
                  time={lastUpdated ? lastUpdated.toLocaleTimeString() : 'now'}
                  type={deviceStatus === 'online' ? 'info' : 'error'}
                />
                {tlv(telemetry, 'internal_temp_C') !== '–' && parseFloat(tlv(telemetry, 'internal_temp_C')) > 60 && (
                  <AlertItem id={DEVICE_CONFIG.endDeviceId} issue="High Temperature" time="now" type="warning" />
                )}
                {tlv(telemetry, 'rssi') !== '–' && parseFloat(tlv(telemetry, 'rssi')) < -110 && (
                  <AlertItem id={DEVICE_CONFIG.endDeviceId} issue="Weak LoRa Signal" time="now" type="warning" />
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
          <h3 className="font-bold text-lg md:text-xl">Device Control</h3>
          <button
            onClick={() => setIsLightsListOpen(true)}
            className="px-3 md:px-4 py-1.5 md:py-2 bg-primary/10 dark:bg-primary/20 text-primary border border-primary rounded-lg text-xs md:text-sm font-bold shadow-md dark:shadow-[0_0_15px_var(--glow-shadow)] hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors cursor-pointer whitespace-nowrap"
          >
            Manage Devices
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
          <DeviceCard
            id={realDevice.id}
            name={realDevice.name}
            status={realDevice.status}
            brightness={brightness}
            power={power}
            onClick={() => handleDeviceClick(realDevice)}
          />
          {!hasData && (
            <div className="glass-panel rounded-xl p-5 border border-dashed border-[var(--panel-border)] flex flex-col items-center justify-center text-[var(--text-secondary)] text-sm text-center gap-2 min-h-[140px]">
              <span className="text-xl">📡</span>
              <span>No additional devices detected</span>
            </div>
          )}
        </div>
      </div>

      <LightsList
        isOpen={isLightsListOpen}
        onClose={() => setIsLightsListOpen(false)}
        onDeviceClick={handleDeviceClick}
        telemetry={telemetry}
        deviceStatus={deviceStatus}
        brightness={brightness}
        power={power}
      />

      <LightsData
        light={activeLight}
        isOpen={!!activeLight}
        onClose={() => setActiveLight(null)}
      />
    </>
  );
}
