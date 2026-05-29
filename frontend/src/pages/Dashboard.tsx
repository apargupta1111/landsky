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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <KpiCard 
          title="Active Lights" 
          value="452 / 455" 
          trend="+2" 
          trendUp 
          onClick={() => setIsLightsListOpen(true)}
        />
        <KpiCard title="System Uptime" value="99.98%" trend="+0.01%" trendUp />
        <KpiCard title="Total Power Draw" value="1.24 MW" trend="-4.2%" trendUp={false} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-xl p-6 border h-[400px] flex flex-col glowing-border">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">Live Telemetry</h3>
            <div className="flex space-x-2">
              <span className="flex items-center text-xs"><span className="w-2 h-2 rounded-full bg-primary mr-2 shadow-[0_0_8px_var(--accent-primary)] animate-pulse" /> Live Stream</span>
            </div>
          </div>
          {/* Chart Placeholder */}
          <div className="flex-1 border border-dashed border-[var(--panel-border)] rounded-lg flex items-center justify-center text-[var(--text-secondary)]">
            [ Area Chart Visualization (Recharts) ]
          </div>
        </div>

        <div className="glass-panel rounded-xl p-6 border h-[400px] flex flex-col glowing-border">
          <h3 className="font-bold text-lg mb-6">Critical Alerts</h3>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-hide">
            <AlertItem id="SL-772" issue="Thermal Warning" time="2m ago" type="warning" />
            <AlertItem id="SL-104" issue="Comms Offline" time="14m ago" type="error" />
            <AlertItem id="SL-890" issue="Voltage Drop" time="1h ago" type="warning" />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-xl">Device Control</h3>
          <button 
            onClick={() => setIsLightsListOpen(true)}
            className="px-4 py-2 bg-primary/20 text-primary border border-primary rounded-lg text-sm font-bold shadow-[0_0_15px_var(--glow-shadow)] hover:bg-primary/30 transition-colors cursor-pointer"
          >
            Manage Devices
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <DeviceCard id="SL-001" name="Downtown Ave"   status="online"  brightness={85}  power={240} onClick={() => handleDeviceClick({ id: 'SL-001', name: 'Downtown Ave',   status: 'online'  })} />
          <DeviceCard id="SL-002" name="Downtown Ave"   status="online"  brightness={100} power={310} onClick={() => handleDeviceClick({ id: 'SL-002', name: 'Downtown Ave',   status: 'online'  })} />
          <DeviceCard id="SL-003" name="Central Plaza"  status="warning" brightness={40}  power={120} onClick={() => handleDeviceClick({ id: 'SL-003', name: 'Central Plaza',  status: 'warning' })} />
          <DeviceCard id="SL-004" name="North Bridge"   status="error"   brightness={0}   power={0}   onClick={() => handleDeviceClick({ id: 'SL-004', name: 'North Bridge',   status: 'error'   })} />
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
