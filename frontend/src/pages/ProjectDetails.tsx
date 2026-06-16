import { useMemo, useState } from 'react';
import { ChevronLeft, Search } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export function ProjectDetails() {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const projects = useAppStore((s) => s.projects);
  const gateways = useAppStore((s) => s.gateways);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const setSelectedProjectId = useAppStore((s) => s.setSelectedProjectId);
  const setSelectedGatewayId = useAppStore((s) => s.setSelectedGatewayId);

  const project = projects.find((item) => item.id === selectedProjectId);
  const projectGateways = gateways.filter((gateway) => gateway.projectId === selectedProjectId);

  const [query, setQuery] = useState('');

  const filteredGateways = useMemo(
    () => projectGateways.filter((gateway) =>
      gateway.id.toLowerCase().includes(query.toLowerCase()) ||
      String(gateway.signal).includes(query.toLowerCase()) ||
      gateway.status.toLowerCase().includes(query.toLowerCase())
    ),
    [projectGateways, query],
  );

  if (!project) {
    return (
      <div className="glass-panel rounded-3xl border border-[var(--panel-border)] p-6">
        <div className="text-sm text-[var(--text-secondary)]">No project selected.</div>
        <button
          onClick={() => setCurrentPage('projects')}
          className="mt-4 px-4 py-2 rounded-full bg-primary text-black font-semibold"
        >
          Back to Projects
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
              setSelectedProjectId(null);
              setCurrentPage('projects');
            }}
            className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-primary transition-colors mb-3"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Projects
          </button>
          <h1 className="text-3xl font-bold">Gateway Directory</h1>
          <p className="mt-2 text-[var(--text-secondary)]">{project.name} · {gateways.length} gateways</p>
        </div>
      </div>

      <div className="glass-panel rounded-3xl border border-[var(--panel-border)] p-4 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold">Gateway Directory</h2>
            <p className="text-sm text-[var(--text-secondary)]">Search gateway...</p>
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

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredGateways.length === 0 ? (
            <div className="glass-panel rounded-3xl border border-dashed border-[var(--panel-border)] p-8 text-center text-sm text-[var(--text-secondary)]">
              No gateways match your search.
            </div>
          ) : (
            filteredGateways.map((gateway) => {
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
                  className="glass-panel rounded-3xl border glowing-border p-5 text-left hover:scale-[1.01] transition-transform"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold">{gateway.id}</h3>
                      <p className="text-sm text-[var(--text-secondary)]">Connected Lights: {gateway.connectedLights}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusClass}`}>{gateway.status}</span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4 text-sm text-[var(--text-secondary)]">
                    <div className="rounded-2xl bg-black/5 dark:bg-white/5 p-4 border border-[var(--panel-border)]">
                      <div className="text-[var(--text-secondary)]">Online</div>
                      <div className="mt-2 text-lg font-semibold data-font text-[var(--text-primary)]">{gateway.onlineLights}</div>
                    </div>
                    <div className="rounded-2xl bg-black/5 dark:bg-white/5 p-4 border border-[var(--panel-border)]">
                      <div className="text-[var(--text-secondary)]">Faults</div>
                      <div className="mt-2 text-lg font-semibold data-font text-error">{gateway.faults}</div>
                    </div>
                    <div className="rounded-2xl bg-black/5 dark:bg-white/5 p-4 border border-[var(--panel-border)] col-span-2">
                      <div className="text-[var(--text-secondary)]">Signal</div>
                      <div className="mt-2 text-lg font-semibold data-font">{gateway.signal} dBm</div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
