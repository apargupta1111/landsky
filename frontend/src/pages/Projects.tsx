import { useMemo } from 'react';
import { ArrowRight, Layers } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export function Projects() {
  const projects = useAppStore((s) => s.projects);
  const setSelectedProjectId = useAppStore((s) => s.setSelectedProjectId);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);

  const stats = useMemo(
    () => ({
      total: projects.length,
      gateways: projects.reduce((sum, project) => sum + project.gatewayCount, 0),
      lights: projects.reduce((sum, project) => sum + project.lightCount, 0),
    }),
    [projects],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="mt-2 text-[var(--text-secondary)] max-w-2xl">
            Browse active smart street lighting projects across tenants, inspect gateway directories, and drill into live light health.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="glass-panel rounded-xl border border-[var(--panel-border)] p-4 text-sm">
            <div className="text-[var(--text-secondary)]">Projects</div>
            <div className="mt-2 text-3xl font-bold data-font">{stats.total}</div>
          </div>
          <div className="glass-panel rounded-xl border border-[var(--panel-border)] p-4 text-sm">
            <div className="text-[var(--text-secondary)]">Gateways</div>
            <div className="mt-2 text-3xl font-bold data-font">{stats.gateways}</div>
          </div>
          <div className="glass-panel rounded-xl border border-[var(--panel-border)] p-4 text-sm">
            <div className="text-[var(--text-secondary)]">Street Lights</div>
            <div className="mt-2 text-3xl font-bold data-font">{stats.lights}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => {
              setSelectedProjectId(project.id);
              setCurrentPage('projectDetails');
            }}
            className="glass-panel rounded-3xl p-6 border glowing-border text-left hover:scale-[1.01] transition-transform"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-widest text-[var(--text-secondary)]">Project</div>
                <h2 className="text-xl font-bold leading-tight">{project.name}</h2>
                <div className="text-sm text-[var(--text-secondary)]">Status: {project.status}</div>
              </div>
              <div className="rounded-full bg-primary/10 border border-primary/30 text-primary p-3">
                <Layers className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-[var(--text-secondary)]">
              <div className="rounded-2xl bg-black/5 dark:bg-white/5 p-4 border border-[var(--panel-border)]">
                <div className="text-xs uppercase tracking-widest">Gateways</div>
                <div className="mt-2 text-xl font-bold data-font">{project.gatewayCount}</div>
              </div>
              <div className="rounded-2xl bg-black/5 dark:bg-white/5 p-4 border border-[var(--panel-border)]">
                <div className="text-xs uppercase tracking-widest">Lights</div>
                <div className="mt-2 text-xl font-bold data-font">{project.lightCount}</div>
              </div>
              <div className="rounded-2xl bg-black/5 dark:bg-white/5 p-4 border border-[var(--panel-border)]">
                <div className="text-xs uppercase tracking-widest">Online</div>
                <div className="mt-2 text-xl font-bold data-font">{project.onlineLights}</div>
              </div>
              <div className="rounded-2xl bg-black/5 dark:bg-white/5 p-4 border border-[var(--panel-border)]">
                <div className="text-xs uppercase tracking-widest">Faults</div>
                <div className="mt-2 text-xl font-bold data-font">{project.faults}</div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between text-sm text-[var(--text-primary)] font-bold">
              <span>Open Gateway Directory</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
