import { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, Search } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export function Gateways() {
  const gateways = useAppStore((s) => s.gateways);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const setSelectedGatewayId = useAppStore((s) => s.setSelectedGatewayId);
  const fetchGateways = useAppStore((s) => s.fetchGateways);
  const isLoadingGateways = useAppStore((s) => s.isLoadingGateways);
  const gatewayFetchError = useAppStore((s) => s.gatewayFetchError);

  const [query, setQuery] = useState('');

  const filteredGateways = useMemo(
    () => gateways.filter((gateway) =>
      gateway.id.toLowerCase().includes(query.toLowerCase()) ||
      gateway.name.toLowerCase().includes(query.toLowerCase()) ||
      gateway.status.toLowerCase().includes(query.toLowerCase()) ||
      gateway.region.toLowerCase().includes(query.toLowerCase())
    ),
    [gateways, query],
  );

  useEffect(() => {
    fetchGateways().catch(() => {});
  }, [fetchGateways]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-primary transition-colors mb-3"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold">All Gateways</h1>
          <p className="mt-2 text-[var(--text-secondary)]">{gateways.length} total gateways across all projects</p>
        </div>
      </div>

      <div className="glass-panel rounded-3xl border border-[var(--panel-border)] p-4 md:p-6">
        {gatewayFetchError && (
          <div className="mb-4 p-3 rounded-md bg-error/10 text-error text-sm font-medium border border-error/30">API Error: {gatewayFetchError}</div>
        )}

        {isLoadingGateways && (
          <div className="mb-4 p-3 rounded-md bg-black/5 text-[var(--text-secondary)] text-sm">Loading gateways…</div>
        )}
        
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold">Gateways Directory</h2>
            <p className="text-sm text-[var(--text-secondary)]">Click on a gateway to view connected lights</p>
          </div>
          <div className="flex items-center bg-black/10 dark:bg-white/10 rounded-full px-3 py-2 border border-[var(--panel-border)] w-full max-w-md">
            <Search className="w-4 h-4 text-[var(--text-secondary)] mr-2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search gateway..."
              className="bg-transparent border-none outline-none w-full text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
            />
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-3xl border border-[var(--panel-border)]">
          <div className="min-w-[1400px]">
            {/* Header: Exact 10 Column Grid Grid-Cols-10 Layout */}
            <div className="grid grid-cols-10 gap-4 bg-black/5 dark:bg-white/5 text-[var(--text-secondary)] text-xs uppercase tracking-wider px-4 py-3 border-b border-[var(--panel-border)] font-semibold">
              <div>EUI</div>
              <div>Name</div>
              <div>Tenant ID</div>
              <div>Region</div>
              <div>Status</div>
              <div>Latitude</div>
              <div>Longitude</div>
              <div>Installed By</div>
              <div>Installed At</div>
              <div>Last Seen</div>
            </div>

            {filteredGateways.length === 0 ? (
              <div className="p-8 text-center text-sm text-[var(--text-secondary)] bg-white/80 dark:bg-slate-950/80">
                No gateways match your search.
              </div>
            ) : (
              filteredGateways.map((gateway, index) => {
                const statusClass =
                  gateway.status === 'Online'
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : gateway.status === 'Warning'
                      ? 'bg-warning/20 text-warning border-warning/50'
                      : 'bg-error/20 text-error border-error/50';

                return (
                  <button
                    key={gateway.id}
                    onClick={() => {
                      setSelectedGatewayId(gateway.id);
                      setCurrentPage('gatewayDetails');
                    }}
                    className={`w-full text-left px-4 py-4 transition-colors hover:bg-black/5 dark:hover:bg-white/5 border-b border-[var(--panel-border)] last:border-b-0 ${
                      index % 2 === 0 ? 'bg-white/80 dark:bg-slate-950/80' : 'bg-transparent'
                    }`}
                  >
                    {/* Rows: Fixed to align exactly with the 10 grid columns */}
                    <div className="grid grid-cols-10 gap-4 items-center text-sm text-[var(--text-primary)]">
                      <div className="font-mono font-medium truncate" title={gateway.id}>{gateway.id}</div>
                      <div className="font-semibold truncate">{gateway.name || 'N/A'}</div>
                      <div>Tenant-{gateway.tenantId}</div>
                      <div className="capitalize">{gateway.region}</div>
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusClass}`}>
                          {gateway.status}
                        </span>
                      </div>
                      <div className="font-mono text-xs">{gateway.lat.toFixed(6)}</div>
                      <div className="font-mono text-xs">{gateway.lng.toFixed(6)}</div>
                      <div>User #{gateway.installedBy}</div>
                      <div className="text-xs text-[var(--text-secondary)]">
                        {gateway.installedAt ? new Date(gateway.installedAt).toLocaleDateString() : 'N/A'}
                      </div>
                      <div className="text-xs font-medium text-[var(--text-secondary)]">
                        {gateway.lastSeen ? new Date(gateway.lastSeen).toLocaleTimeString() : 'Never'}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}