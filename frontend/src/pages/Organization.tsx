import { useMemo } from 'react';
import { Building2, Users, Layers } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export function Organization() {
  const projects = useAppStore((s) => s.projects);
  const gateways = useAppStore((s) => s.gateways);
  const lights = useAppStore((s) => s.lights);

  const totals = useMemo(
    () => ({
      projects: projects.length,
      gateways: gateways.length,
      lights: lights.length,
      onlineLights: lights.filter((light) => light.status === 'Online').length,
    }),
    [projects, gateways, lights],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organization</h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Tenant hierarchy view for LandSky. Track project coverage, gateway health, and light operations across the platform.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel rounded-3xl border border-[var(--panel-border)] p-6">
          <div className="flex items-center gap-3 text-primary mb-4">
            <div className="rounded-2xl bg-primary/10 p-3"><Building2 className="w-5 h-5" /></div>
            <div>
              <div className="text-xs uppercase tracking-widest text-[var(--text-secondary)]">Tenant</div>
              <div className="text-xl font-bold">LANDSKY</div>
            </div>
          </div>
          <div className="space-y-3 text-sm text-[var(--text-secondary)]">
            <div>Platform-ready for multi-tenant deployment.</div>
            <div>Manage projects, gateways, and lights from a single enterprise view.</div>
          </div>
        </div>

        <div className="glass-panel rounded-3xl border border-[var(--panel-border)] p-6">
          <div className="flex items-center gap-3 text-primary mb-4">
            <div className="rounded-2xl bg-primary/10 p-3"><Layers className="w-5 h-5" /></div>
            <div>
              <div className="text-xs uppercase tracking-widest text-[var(--text-secondary)]">Projects</div>
              <div className="text-xl font-bold">{totals.projects}</div>
            </div>
          </div>
          <div className="text-sm text-[var(--text-secondary)]">Project-level deployments with gateway directories and light inventories.</div>
        </div>

        <div className="glass-panel rounded-3xl border border-[var(--panel-border)] p-6">
          <div className="flex items-center gap-3 text-primary mb-4">
            <div className="rounded-2xl bg-primary/10 p-3"><Users className="w-5 h-5" /></div>
            <div>
              <div className="text-xs uppercase tracking-widest text-[var(--text-secondary)]">Active Lights</div>
              <div className="text-xl font-bold">{totals.onlineLights}</div>
            </div>
          </div>
          <div className="text-sm text-[var(--text-secondary)]">Live streetlight status across connected gateways.</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="glass-panel rounded-3xl border border-[var(--panel-border)] p-6">
          <div className="text-xs uppercase tracking-widest text-[var(--text-secondary)]">Gateway Count</div>
          <div className="mt-4 text-3xl font-bold data-font">{totals.gateways}</div>
        </div>
        <div className="glass-panel rounded-3xl border border-[var(--panel-border)] p-6">
          <div className="text-xs uppercase tracking-widest text-[var(--text-secondary)]">Total Lights</div>
          <div className="mt-4 text-3xl font-bold data-font">{totals.lights}</div>
        </div>
        <div className="glass-panel rounded-3xl border border-[var(--panel-border)] p-6">
          <div className="text-xs uppercase tracking-widest text-[var(--text-secondary)]">Coverage</div>
          <div className="mt-4 text-3xl font-bold data-font">Tenant</div>
        </div>
      </div>
    </div>
  );
}
