import { useMemo, useState } from 'react';
import { ChevronLeft, Search, Building } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export function Nagarpalikas() {
  const selectedDistrictId = useAppStore((s) => s.selectedDistrictId);
  const districts = useAppStore((s) => s.districts);
  const allNagarpalikas = useAppStore((s) => s.nagarpalikas);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const setSelectedDistrictId = useAppStore((s) => s.setSelectedDistrictId);
  const setSelectedNagarpalikaId = useAppStore((s) => s.setSelectedNagarpalikaId);

  const district = districts.find((item) => item.id === selectedDistrictId);
  const districtNagarpalikas = allNagarpalikas.filter((n) => n.districtId === selectedDistrictId);

  const [query, setQuery] = useState('');

  const filteredNagarpalikas = useMemo(
    () => districtNagarpalikas.filter((n) =>
      n.name.toLowerCase().includes(query.toLowerCase()) ||
      n.status.toLowerCase().includes(query.toLowerCase())
    ),
    [districtNagarpalikas, query],
  );

  if (!district) {
    return (
      <div className="glass-panel rounded-3xl border border-[var(--panel-border)] p-6">
        <div className="text-sm text-[var(--text-secondary)]">No district selected.</div>
        <button
          onClick={() => setCurrentPage('projects')}
          className="mt-4 px-4 py-2 rounded-full bg-primary text-black font-semibold"
        >
          Back to Districts
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
              setSelectedDistrictId(null);
              setCurrentPage('projects');
            }}
            className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-primary transition-colors mb-3"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Districts
          </button>
          <h1 className="text-3xl font-bold">Nagarpalikas Directory</h1>
          <p className="mt-2 text-[var(--text-secondary)]">{district.name} District · {districtNagarpalikas.length} Nagarpalikas</p>
        </div>
      </div>

      <div className="glass-panel rounded-3xl border border-[var(--panel-border)] p-4 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold">Nagarpalikas</h2>
            <p className="text-sm text-[var(--text-secondary)]">Search nagarpalika...</p>
          </div>
          <div className="flex items-center bg-black/10 dark:bg-white/10 rounded-full px-3 py-2 border border-[var(--panel-border)] w-full max-w-md">
            <Search className="w-4 h-4 text-[var(--text-secondary)] mr-2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search nagarpalika..."
              className="bg-transparent border-none outline-none w-full text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredNagarpalikas.length === 0 ? (
            <div className="glass-panel rounded-3xl border border-dashed border-[var(--panel-border)] p-8 text-center text-sm text-[var(--text-secondary)]">
              No nagarpalikas match your search.
            </div>
          ) : (
            filteredNagarpalikas.map((nagarpalika) => {
              const statusClass =
                nagarpalika.status === 'Active'
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-warning/20 text-warning border-warning/50';

              return (
                <button
                  key={nagarpalika.id}
                  onClick={() => {
                    setSelectedNagarpalikaId(nagarpalika.id);
                    setCurrentPage('wards');
                  }}
                  className="glass-panel rounded-3xl border glowing-border p-5 text-left hover:scale-[1.01] transition-transform"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-full text-primary border border-primary/20">
                        <Building className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-widest text-[var(--text-secondary)]">Nagarpalika</div>
                        <h3 className="text-xl font-bold">{nagarpalika.name}</h3>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusClass}`}>{nagarpalika.status}</span>
                  </div>

                  <div className="mt-5 grid grid-cols-4 gap-4 text-sm text-[var(--text-secondary)]">
                    <div className="rounded-2xl bg-black/5 dark:bg-white/5 p-4 border border-[var(--panel-border)] text-center">
                      <div className="text-[var(--text-secondary)] text-xs uppercase tracking-wider">Wards</div>
                      <div className="mt-2 text-lg font-semibold data-font text-[var(--text-primary)]">{nagarpalika.wardCount}</div>
                    </div>
                    <div className="rounded-2xl bg-black/5 dark:bg-white/5 p-4 border border-[var(--panel-border)] text-center">
                      <div className="text-[var(--text-secondary)] text-xs uppercase tracking-wider">Gateways</div>
                      <div className="mt-2 text-lg font-semibold data-font text-[var(--text-primary)]">{nagarpalika.gatewayCount}</div>
                    </div>
                    <div className="rounded-2xl bg-black/5 dark:bg-white/5 p-4 border border-[var(--panel-border)] text-center">
                      <div className="text-[var(--text-secondary)] text-xs uppercase tracking-wider">Lights</div>
                      <div className="mt-2 text-lg font-semibold data-font text-[var(--text-primary)]">{nagarpalika.lightCount}</div>
                    </div>
                    <div className="rounded-2xl bg-black/5 dark:bg-white/5 p-4 border border-[var(--panel-border)] text-center">
                      <div className="text-[var(--text-secondary)] text-xs uppercase tracking-wider">Online</div>
                      <div className="mt-2 text-lg font-semibold data-font text-[var(--text-primary)]">{nagarpalika.onlineLights}</div>
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
