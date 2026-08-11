import { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, Search, Plus, Trash2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export function Gateways() {
  // ── Zustand State Binding ───────────────────────────────────────────────
  const allGateways = useAppStore((s) => s.gateways);
  const selectedWardId = useAppStore((s) => s.selectedWardId);
  const wards = useAppStore((s) => s.wards);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const setSelectedGatewayId = useAppStore((s) => s.setSelectedGatewayId);
  const fetchGateways = useAppStore((s) => s.fetchGateways);
  const isLoadingGateways = useAppStore((s) => s.isLoadingGateways);
  const gatewayFetchError = useAppStore((s) => s.gatewayFetchError);

  const ward = wards.find(w => w.id === selectedWardId);
  
  // Filter gateways by selected ward if one is selected
  // Note: currently mock data in backend doesn't have wardId, so we just show all if no ward is selected or fake it.
  const gateways = selectedWardId 
    ? allGateways.filter(g => g.wardId === selectedWardId || true) // Remove `|| true` when real API supports wardId
    : allGateways;

  // ── Search & Query State ─────────────────────────────────────────────────
  const [query, setQuery] = useState('');

  // ── Modal Toggle Controllers ─────────────────────────────────────────────
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGatewayId, setEditingGatewayId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // ── Form Input Formats ───────────────────────────────────────────────────
  const [newEui, setNewEui] = useState('');
  const [newName, setNewName] = useState('');
  const [newTenantId, setNewTenantId] = useState('1');
  const [newRegion, setNewRegion] = useState('IN865');
  const [newLat, setNewLat] = useState('26.876277');
  const [newLng, setNewLng] = useState('91.866539');

  // Auto-fetch data array sequence on mount
  useEffect(() => {
    fetchGateways().catch(() => {});
  }, [fetchGateways]);

  // ── API Submission Handlers ──────────────────────────────────────────────
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEui.trim()) return;

    setIsSubmitting(true);
    setActionError(null);

    try {
      const SERVER_IP = import.meta.env.VITE_SERVER_IP || 'http://localhost:3000';
      const url = editingGatewayId 
        ? `${SERVER_IP}/api/gateways/${editingGatewayId}`
        : `${SERVER_IP}/api/gateways`;
      
      const method = editingGatewayId ? 'PUT' : 'POST';

      const installRes = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eui: newEui.trim(),
          name: newName.trim() || "Unnamed Base Station",
          region: newRegion,
          latitude: Number(newLat),
          longitude: Number(newLng),
        }),
      });

      if (!installRes.ok) {
        const errorData = await installRes.json();
        throw new Error(errorData.error || `Installation response failure. Status code: ${installRes.status}`);
      }

      // Re-trigger global Zustand synchronization loop
      await fetchGateways();
      
      // Clear forms & modal context
      setIsAddModalOpen(false);
      setEditingGatewayId(null);
      setNewEui('');
      setNewName('');
    } catch (err: any) {
      console.error(err);
      setActionError(err.message || 'Failed to submit initialization payload to hardware index.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRow = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    const confirmed = window.confirm(`Are you sure you want to delete gateway "${name || id}"?`);
    if (!confirmed) return;

    setIsSubmitting(true);
    setActionError(null);

    try {
      const SERVER_IP = import.meta.env.VITE_SERVER_IP || 'http://localhost:3000';
      const deleteRes = await fetch(`${SERVER_IP}/api/gateways/${id}`, {
        method: 'DELETE',
      });

      if (!deleteRes.ok) {
        const errorData = await deleteRes.json();
        throw new Error(errorData.error || `Deletion target rejected. Status code: ${deleteRes.status}`);
      }

      await fetchGateways();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to delete gateway.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (gateway: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGatewayId(gateway.id);
    setNewEui(gateway.eui || '');
    setNewName(gateway.name || '');
    setNewTenantId(String(gateway.tenantId || 1));
    setNewRegion(gateway.region || 'IN865');
    setNewLat(String(gateway.lat || 0));
    setNewLng(String(gateway.lng || 0));
    setActionError(null);
    setIsAddModalOpen(true);
  };

  // ── Memoized Text Search Matching Filter ────────────────────────────────
  const filteredGateways = useMemo(
    () => gateways.filter((gateway) =>
      (gateway.id?.toLowerCase() || '').includes(query.toLowerCase()) ||
      (gateway.name?.toLowerCase() || '').includes(query.toLowerCase()) ||
      (gateway.status?.toLowerCase() || '').includes(query.toLowerCase()) ||
      (gateway.region?.toLowerCase() || '').includes(query.toLowerCase())
    ),
    [gateways, query],
  );

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-[1600px] mx-auto text-[var(--text-primary)]">
      {/* ── Top Navigation Header ────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <button
            onClick={() => setCurrentPage(ward ? 'wards' : 'dashboard')}
            className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-primary transition-colors mb-3 font-medium"
          >
            <ChevronLeft className="w-4 h-4" /> {ward ? 'Back to Wards' : 'Back to Dashboard'}
          </button>
          <h1 className="text-3xl font-bold tracking-tight">{ward ? `${ward.name} Gateways` : 'All Gateways'}</h1>
          <p className="mt-1 text-[var(--text-secondary)] text-sm">{gateways.length} total active hardware nodes connected</p>
        </div>
      </div>

      {/* ── Directory Wrapper Block ─────────────────────────────────────── */}
      <div className="glass-panel rounded-3xl border border-[var(--panel-border)] p-4 md:p-6 shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
        
        {/* Error State Banner Notifications */}
        {gatewayFetchError && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-500/10 text-red-500 text-sm font-medium border border-red-500/20">
            API Error Connection Failure: {gatewayFetchError}
          </div>
        )}

        {/* Global Directory Actions and Search Field */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[var(--panel-border)] pb-4">
          <div>
            <h2 className="text-lg font-bold">Gateways Directory</h2>
            <p className="text-sm text-[var(--text-secondary)]">Select a device block row to access individual light array details</p>
          </div>
          <div className="flex items-center bg-black/5 dark:bg-white/5 rounded-full px-4 py-2.5 border border-[var(--panel-border)] w-full max-w-md shadow-inner">
            <Search className="w-4 h-4 text-[var(--text-secondary)] mr-2 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by ID, name, status, or region..."
              className="bg-transparent border-none outline-none w-full text-sm placeholder-[var(--text-secondary)]"
            />
          </div>
        </div>

        {/* Management Execution Triggers */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => { 
              setActionError(null); 
              setEditingGatewayId(null);
              setNewEui(''); setNewName(''); setNewTenantId('1'); setNewRegion('IN865'); setNewLat('26.876277'); setNewLng('91.866539');
              setIsAddModalOpen(true); 
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-all shadow-md shadow-blue-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Gateway
          </button>
        </div>

        {/* ── Main Responsive Grid Directory Table ─────────────────────── */}
        <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--panel-border)] shadow-sm bg-transparent">
          <div className="min-w-[1300px]">
            {/* Header Columns Grid Structure */}
            <div className="grid grid-cols-10 gap-4 bg-black/[0.02] dark:bg-white/[0.02] text-[var(--text-secondary)] text-xs uppercase tracking-wider px-6 py-3.5 border-b border-[var(--panel-border)] font-bold">
              <div>EUI / Identifier</div>
              <div>Device Designation</div>
              <div>Tenant Namespace</div>
              <div>Region Node</div>
              <div>Network Status</div>
              <div>Lat/Long</div>
              <div>Operator Reference</div>
              <div>Deployment Stamp</div>
              <div>Keep-Alive Tracker</div>
              <div className="text-right">Actions</div>
            </div>

            {/* Content Payload Evaluators */}
            {isLoadingGateways && filteredGateways.length === 0 ? (
              <div className="p-12 text-center text-sm text-[var(--text-secondary)]">
                Querying development directory server data streams...
              </div>
            ) : filteredGateways.length === 0 ? (
              <div className="p-12 text-center text-sm text-[var(--text-secondary)]">
                No physical tracking parameters correspond to your active query layout.
              </div>
            ) : (
              filteredGateways.map((gateway, index) => {
                const badgeColorMap =
                  gateway.status === 'Online'
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : gateway.status === 'Warning'
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      : 'bg-red-500/10 text-red-500 border-red-500/20';

                return (
                  <button
                    key={gateway.id}
                    onClick={() => {
                      setSelectedGatewayId(gateway.id);
                      setCurrentPage('gatewayDetails');
                    }}
                    className={`w-full text-left px-6 py-4 transition-colors hover:bg-black/5 dark:hover:bg-white/5 grid grid-cols-10 gap-4 items-center border-b border-[var(--panel-border)] last:border-b-0 ${
                      index % 2 === 0 ? 'bg-transparent' : 'bg-black/[0.01] dark:bg-white/[0.01]'
                    }`}
                  >
                    <div className="font-mono text-xs font-semibold tracking-tight text-blue-600 dark:text-blue-400 truncate" title={gateway.eui}>
                      {gateway.eui}
                    </div>
                    <div className="font-medium truncate">{gateway.name || 'Unnamed Base Station'}</div>
                    <div className="text-xs font-medium text-[var(--text-secondary)]">Tenant-{gateway.tenantId}</div>
                    <div className="font-mono text-xs uppercase text-[var(--text-secondary)]">{gateway.region || 'IN865'}</div>
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeColorMap}`}>
                        {gateway.status || 'Offline'}
                      </span>
                    </div>
                    <div className="font-mono text-xs text-[var(--text-secondary)] truncate">
                      {(gateway.lat ?? 0).toFixed(5)}°, {(gateway.lng ?? 0).toFixed(5)}°
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">System User #{gateway.installedBy || 1}</div>
                    <div className="text-xs text-[var(--text-secondary)]">
                      {gateway.installedAt ? new Date(gateway.installedAt).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className="text-xs font-medium">
                      {gateway.lastSeen ? new Date(gateway.lastSeen).toLocaleTimeString() : 'Never Connect'}
                    </div>
                    <div className="text-right flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => handleEditClick(gateway, e)}
                        disabled={isSubmitting}
                        className="inline-flex items-center justify-center p-2 rounded-lg text-blue-500 hover:bg-blue-500/10 dark:hover:bg-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
                        title="Edit Gateway"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                      </button>
                      <button
                        onClick={(e) => handleDeleteRow(gateway.id, gateway.name, e)}
                        disabled={isSubmitting}
                        className="inline-flex items-center justify-center p-2 rounded-lg text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-all active:scale-95 disabled:opacity-50"
                        title="Delete Gateway"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Interactive Modal Layer: Register Gateway ─────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-[var(--panel-border)] p-6 bg-white dark:bg-slate-900 shadow-2xl relative animate-scale-up">
            <h3 className="text-xl font-bold mb-1">{editingGatewayId ? 'Edit Gateway' : 'Add New Gateway'}</h3>
            <p className="text-xs text-[var(--text-secondary)] mb-4">{editingGatewayId ? 'Update physical concentrator tracking details.' : 'Register new physical concentrator tracking routes directly to database storage context.'}</p>
            
            {actionError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 text-red-500 text-xs font-medium border border-red-500/20">{actionError}</div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Gateway EUI / Hardware ID *</label>
                <input
                  type="text"
                  required
                  value={newEui}
                  onChange={(e) => setNewEui(e.target.value)}
                  placeholder="e.g. 24E124128C017835"
                  className="w-full bg-black/5 dark:bg-white/5 border border-[var(--panel-border)] rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Friendly Label Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Sector-17 Central Router Hub"
                  className="w-full bg-black/5 dark:bg-white/5 border border-[var(--panel-border)] rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Tenant Group Assignment</label>
                  <input
                    type="number"
                    value={newTenantId}
                    onChange={(e) => setNewTenantId(e.target.value)}
                    className="w-full bg-black/5 dark:bg-white/5 border border-[var(--panel-border)] rounded-xl px-3 py-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">LoRa Frequency Band</label>
                  <select
                    value={newRegion}
                    onChange={(e) => setNewRegion(e.target.value)}
                    className="w-full bg-black/5 dark:bg-white/5 border border-[var(--panel-border)] rounded-xl px-3 py-2 text-sm outline-none"
                  >
                    <option value="IN865">IN865 (India)</option>
                    <option value="EU868">EU868 (Europe)</option>
                    <option value="US915">US915 (Americas)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Latitude Coordinate</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={newLat}
                    onChange={(e) => setNewLat(e.target.value)}
                    className="w-full bg-black/5 dark:bg-white/5 border border-[var(--panel-border)] rounded-xl px-3 py-2 text-sm outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Longitude Coordinate</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={newLng}
                    onChange={(e) => setNewLng(e.target.value)}
                    className="w-full bg-black/5 dark:bg-white/5 border border-[var(--panel-border)] rounded-xl px-3 py-2 text-sm outline-none font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--panel-border)]">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => { setIsAddModalOpen(false); setEditingGatewayId(null); }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-[var(--panel-border)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:opacity-50 min-w-[110px] text-center"
                >
                  {isSubmitting ? 'Saving...' : editingGatewayId ? 'Save Changes' : 'Add Gateway'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}