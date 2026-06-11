import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Filter, X, ChevronLeft } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export function Faults() {
  const projects = useAppStore((s) => s.projects);
  const gateways = useAppStore((s) => s.gateways);
  const faults = useAppStore((s) => s.faults);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);

  const [projectFilter, setProjectFilter] = useState('');
  const [gatewayFilter, setGatewayFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [activeFault, setActiveFault] = useState<any>(null);

  const filteredFaults = useMemo(
    () => faults.filter((fault) => {
      const matchesProject = projectFilter ? fault.projectId === projectFilter : true;
      const matchesGateway = gatewayFilter ? fault.gatewayId === gatewayFilter : true;
      const matchesPriority = priorityFilter ? fault.priority === priorityFilter : true;
      const matchesStatus = statusFilter ? fault.status === statusFilter : true;
      const matchesDate = dateFilter ? fault.timestamp.startsWith(dateFilter) : true;
      return matchesProject && matchesGateway && matchesPriority && matchesStatus && matchesDate;
    }),
    [faults, projectFilter, gatewayFilter, priorityFilter, statusFilter, dateFilter],
  );

  const grouped = useMemo(() => {
    return filteredFaults.reduce((acc: Record<string, typeof faults>, fault) => {
      acc[fault.projectName] = acc[fault.projectName] || [];
      acc[fault.projectName].push(fault);
      return acc;
    }, {});
  }, [filteredFaults]);

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
          <h1 className="text-3xl font-bold">Faults</h1>
          <p className="mt-2 text-[var(--text-secondary)]">Manage active fault tickets by project, gateway, priority, and status.</p>
        </div>
      </div>

      <div className="glass-panel rounded-3xl border border-[var(--panel-border)] p-6">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          <div className="col-span-1 xl:col-span-2 grid grid-cols-1 gap-4">
            <div className="flex items-center gap-2 bg-black/10 dark:bg-white/10 rounded-full px-3 py-2 border border-[var(--panel-border)]">
              <Search className="w-4 h-4 text-[var(--text-secondary)]" />
              <input
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                placeholder="Filter by project"
                className="bg-transparent border-none outline-none text-sm w-full text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
              />
            </div>
            <div className="flex items-center gap-2 bg-black/10 dark:bg-white/10 rounded-full px-3 py-2 border border-[var(--panel-border)]">
              <Filter className="w-4 h-4 text-[var(--text-secondary)]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-full text-[var(--text-primary)]"
              >
                <option value="">Status</option>
                <option value="Open">Open</option>
                <option value="Assigned">Assigned</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 xl:col-span-3">
            <div className="flex items-center gap-2 bg-black/10 dark:bg-white/10 rounded-full px-3 py-2 border border-[var(--panel-border)]">
              <Filter className="w-4 h-4 text-[var(--text-secondary)]" />
              <select
                value={gatewayFilter}
                onChange={(e) => setGatewayFilter(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-full text-[var(--text-primary)]"
              >
                <option value="">Gateway</option>
                {gateways.map((gateway) => (
                  <option key={gateway.id} value={gateway.id}>{gateway.id}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 bg-black/10 dark:bg-white/10 rounded-full px-3 py-2 border border-[var(--panel-border)]">
                <Filter className="w-4 h-4 text-[var(--text-secondary)]" />
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm w-full text-[var(--text-primary)]"
                >
                  <option value="">Priority</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div className="flex items-center gap-2 bg-black/10 dark:bg-white/10 rounded-full px-3 py-2 border border-[var(--panel-border)]">
                <Filter className="w-4 h-4 text-[var(--text-secondary)]" />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm w-full text-[var(--text-primary)]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {Object.keys(grouped).length === 0 ? (
          <div className="glass-panel rounded-3xl border border-dashed border-[var(--panel-border)] p-8 text-center text-[var(--text-secondary)]">
            No faults match the selected filters.
          </div>
        ) : (
          Object.entries(grouped).map(([projectName, projectFaults]) => (
            <div key={projectName} className="glass-panel rounded-3xl border border-[var(--panel-border)] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold">{projectName}</h2>
                  <p className="text-sm text-[var(--text-secondary)]">{projectFaults.length} fault{projectFaults.length !== 1 ? 's' : ''}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-4">
                {projectFaults.map((fault) => (
                  <button
                    key={fault.id}
                    onClick={() => setActiveFault(fault)}
                    className="w-full text-left rounded-3xl border border-[var(--panel-border)] bg-black/5 dark:bg-white/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:border-primary transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="text-sm font-bold">{fault.type}</div>
                      <div className="text-xs text-[var(--text-secondary)]">
                        {fault.gatewayId} · {fault.poleId} · {fault.timestamp}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold text-[var(--text-secondary)]">
                      <span className="px-2 py-1 rounded-full bg-black/10 border border-[var(--panel-border)]">{fault.priority}</span>
                      <span className="px-2 py-1 rounded-full bg-black/10 border border-[var(--panel-border)]">{fault.status}</span>
                      <span className="px-2 py-1 rounded-full bg-black/10 border border-[var(--panel-border)]">{fault.assignedTo}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {activeFault && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-end p-4"
          >
            <motion.div
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              exit={{ x: 300 }}
              className="glass-panel w-full max-w-md h-full rounded-l-3xl border border-[var(--panel-border)] overflow-y-auto flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-[var(--panel-border)]">
                <div>
                  <h2 className="text-xl font-bold">Fault details</h2>
                  <p className="text-sm text-[var(--text-secondary)]">{activeFault.id}</p>
                </div>
                <button onClick={() => setActiveFault(null)} className="p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-error/20 text-[var(--text-secondary)] border border-[var(--panel-border)]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {[
                  ['Project', activeFault.projectName],
                  ['Gateway', activeFault.gatewayId],
                  ['Pole', activeFault.poleId],
                  ['Fault Type', activeFault.type],
                  ['Timestamp', activeFault.timestamp],
                  ['Status', activeFault.status],
                  ['Priority', activeFault.priority],
                  ['Assigned To', activeFault.assignedTo],
                ].map(([label, value]) => (
                  <div key={label} className="space-y-1 text-sm">
                    <div className="uppercase tracking-[0.2em] text-[var(--text-secondary)] text-[10px]">{label}</div>
                    <div className="rounded-2xl bg-black/5 dark:bg-white/5 p-4 border border-[var(--panel-border)] font-semibold">{value}</div>
                  </div>
                ))}
                <div className="flex gap-3">
                  <button className="flex-1 px-4 py-3 rounded-2xl bg-primary text-black font-bold">Assign</button>
                  <button className="flex-1 px-4 py-3 rounded-2xl bg-green-500/15 text-green-400 border border-green-400/30">Resolve</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
