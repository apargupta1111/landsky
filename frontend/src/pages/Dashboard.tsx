import { useState } from 'react';
import { KpiCard } from '../components/KpiCard';
import { AlertItem } from '../components/AlertItem';
import { DeviceCard } from '../components/DeviceCard';
import { LightsList } from '../components/LightsList';
import { LightsData } from '../components/LightsData';

export function Dashboard() {
  const [isLightsListOpen, setIsLightsListOpen] = useState(false);
  const [activeLight, setActiveLight] = useState<any>(null);

  const handleDeviceClick = (light: any) => {
    setActiveLight(light);
  };

  return (
    <>
      {/* ── KPI Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <KpiCard
          title="Active Lights"
          value="452 / 455"
          trend="+2"
          trendUp
          onClick={() => setIsLightsListOpen(true)}
        />
        <KpiCard title="System Uptime"    value="99.98%"  trend="+0.01%"  trendUp />
        <KpiCard title="Total Power Draw" value="1.24 MW" trend="-4.2%"   trendUp={false} />
      </div>

      {/* ── Telemetry + Alerts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Telemetry chart — full width on mobile, 2/3 on desktop */}
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
          <div className="flex-1 border border-dashed border-[var(--panel-border)] rounded-lg flex items-center justify-center text-[var(--text-secondary)] text-sm text-center px-4">
            [ Area Chart Visualization (Recharts) ]
          </div>
        </div>

        {/* Alerts — full width on mobile, 1/3 on desktop */}
        <div className="glass-panel rounded-xl p-4 md:p-6 border flex flex-col glowing-border min-h-[200px] md:h-[400px]">
          <h3 className="font-bold text-base md:text-lg mb-4 md:mb-6">Critical Alerts</h3>
          <div className="flex-1 space-y-3 md:space-y-4 overflow-y-auto pr-1 scrollbar-hide">
            <AlertItem id="SL-772" issue="Thermal Warning" time="2m ago"  type="warning" />
            <AlertItem id="SL-104" issue="Comms Offline"   time="14m ago" type="error" />
            <AlertItem id="SL-890" issue="Voltage Drop"    time="1h ago"  type="warning" />
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

        {/* 1 col → 2 col → 4 col as screen grows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
          <DeviceCard id="SL-001" name="Downtown Ave"  status="online"  brightness={85}  power={240} onClick={() => handleDeviceClick({ id: 'SL-001', name: 'Downtown Ave',  status: 'online'  })} />
          <DeviceCard id="SL-002" name="Downtown Ave"  status="online"  brightness={100} power={310} onClick={() => handleDeviceClick({ id: 'SL-002', name: 'Downtown Ave',  status: 'online'  })} />
          <DeviceCard id="SL-003" name="Central Plaza" status="warning" brightness={40}  power={120} onClick={() => handleDeviceClick({ id: 'SL-003', name: 'Central Plaza', status: 'warning' })} />
          <DeviceCard id="SL-004" name="North Bridge"  status="error"   brightness={0}   power={0}   onClick={() => handleDeviceClick({ id: 'SL-004', name: 'North Bridge',  status: 'error'   })} />
        </div>
      </div>

      <LightsList
        isOpen={isLightsListOpen}
        onClose={() => setIsLightsListOpen(false)}
        onDeviceClick={handleDeviceClick}
      />

      <LightsData
        light={activeLight}
        isOpen={!!activeLight}
        onClose={() => setActiveLight(null)}
      />
    </>
  );
}
