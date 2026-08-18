import { useMemo, useState } from 'react';
import { ChevronLeft, Search, Clock, Zap } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { LightsData } from '../components/LightsData';

export function GatewayDetails() {
  const selectedGatewayId = useAppStore((s) => s.selectedGatewayId);
  const gateways = useAppStore((s) => s.gateways);
  const districts = useAppStore((s) => s.districts);
  const devices = useAppStore((s) => s.devices);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const setSelectedGatewayId = useAppStore((s) => s.setSelectedGatewayId);

  const gateway = gateways.find((item) => item.id === selectedGatewayId);
  const district = districts.find((d) => d.id === gateway?.districtId);
  
  // Use gatewayEui for matching
  const gatewayLights = devices.filter((dev) => dev.gatewayEui && String(dev.gatewayEui) === String(selectedGatewayId));

  const [query, setQuery] = useState('');
  const [activeLight, setActiveLight] = useState<any>(null);

  const filteredLights = useMemo(
    () => gatewayLights.filter((light) =>
      light.id.toLowerCase().includes(query.toLowerCase()) ||
      light.name.toLowerCase().includes(query.toLowerCase())
    ),
    [gatewayLights, query]
  );

  if (!gateway) {
    return (
      <div className="glass-panel rounded-3xl border border-[var(--panel-border)] p-6">
        <div className="text-sm text-[var(--text-secondary)]">No gateway selected.</div>
        <button
          onClick={() => setCurrentPage('projectDetails')}
          className="mt-4 px-4 py-2 rounded-full bg-primary text-black font-semibold"
        >
          Back to Gateway Directory
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <button
            onClick={() => {
              setSelectedGatewayId(null);
              setCurrentPage('projectDetails');
            }}
            className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-primary transition-colors mb-3"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Gateway Directory
          </button>
          <h1 className="text-3xl font-bold">Connected Lights</h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            {gateway.id} · {district?.name ?? 'District'}
          </p>
        </div>
      </div>

      <div className="glass-panel rounded-3xl border border-[var(--panel-border)] p-4 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold">Connected Lights</h2>
            <p className="text-sm text-[var(--text-secondary)]">Search light...</p>
          </div>
          <div className="flex items-center bg-black/10 dark:bg-white/10 rounded-full px-3 py-2 border border-[var(--panel-border)] w-full max-w-md">
            <Search className="w-4 h-4 text-[var(--text-secondary)] mr-2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search light..."
              className="bg-transparent border-none outline-none w-full text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredLights.length === 0 ? (
            <div className="glass-panel rounded-3xl border border-dashed border-[var(--panel-border)] p-8 text-center text-sm text-[var(--text-secondary)]">
              No lights match your search.
            </div>
          ) : (
            filteredLights.map((light) => (
              <button
                key={light.id}
                onClick={() => setActiveLight(light)}
                className="glass-panel rounded-3xl border glowing-border p-5 text-left hover:scale-[1.01] transition-transform"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold">{light.id}</h3>
                    <p className="text-sm text-[var(--text-secondary)]">{light.name}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    light.connectionStatus === 'on' ? 'bg-primary/10 text-primary border-primary/30'
                    : light.connectionStatus === 'off' ? 'bg-error/10 text-error border-error/30'
                    : 'bg-warning/10 text-warning border-warning/30'
                  } border`}>
                    {light.connectionStatus === 'on' ? 'Online' : light.connectionStatus === 'off' ? 'Offline' : 'Warning'}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" /> Power Saved
                    </div>
                    <div className="text-lg font-bold data-font">{light.totalPowerSavedKwh ?? 0} <span className="text-xs">kWh</span></div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Added
                    </div>
                    <div className="text-sm font-bold truncate">
                      {light.addedAt ? new Date(light.addedAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {activeLight && (
        <LightsData
          isOpen={true}
          light={{
            id: activeLight.id,
            name: activeLight.name,
            status: activeLight.connectionStatus === 'on' ? 'online' : activeLight.connectionStatus === 'off' ? 'error' : 'warning',
            ttsDeviceId: activeLight.ttsDeviceId,
            dbId: activeLight.dbId,
            totalPowerSavedKwh: activeLight.totalPowerSavedKwh
          }}
          onClose={() => setActiveLight(null)}
        />
      )}
    </div>
  );
}
