import { useMemo, useState } from 'react';
import { ChevronLeft, Search, MapPin } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export function Wards() {
  const selectedNagarpalikaId = useAppStore((s) => s.selectedNagarpalikaId);
  const nagarpalikas = useAppStore((s) => s.nagarpalikas);
  const allWards = useAppStore((s) => s.wards);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const setSelectedNagarpalikaId = useAppStore((s) => s.setSelectedNagarpalikaId);
  const setSelectedWardId = useAppStore((s) => s.setSelectedWardId);

  const nagarpalika = nagarpalikas.find((item) => item.id === selectedNagarpalikaId);
  const nagarpalikaWards = allWards.filter((w) => w.nagarpalikaId === selectedNagarpalikaId);

  const [query, setQuery] = useState('');

  const filteredWards = useMemo(
    () => nagarpalikaWards.filter((ward) =>
      ward.name.toLowerCase().includes(query.toLowerCase()) ||
      ward.status.toLowerCase().includes(query.toLowerCase())
    ),
    [nagarpalikaWards, query],
  );

  if (!nagarpalika) {
    return (
      <div className="glass-panel rounded-3xl border border-[var(--panel-border)] p-6">
        <div className="text-sm text-[var(--text-secondary)]">No nagarpalika selected.</div>
        <button
          onClick={() => setCurrentPage('nagarpalikas')}
          className="mt-4 px-4 py-2 rounded-full bg-primary text-black font-semibold"
        >
          Back to Nagarpalikas
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
              setSelectedNagarpalikaId(null);
              setCurrentPage('nagarpalikas');
            }}
            className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-primary transition-colors mb-3"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Nagarpalikas
          </button>
          <h1 className="text-3xl font-bold">Wards Directory</h1>
          <p className="mt-2 text-[var(--text-secondary)]">{nagarpalika.name} Nagarpalika · {nagarpalikaWards.length} Wards</p>
        </div>
      </div>

      <div className="glass-panel rounded-3xl border border-[var(--panel-border)] p-4 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold">Wards</h2>
            <p className="text-sm text-[var(--text-secondary)]">Search ward...</p>
          </div>
          <div className="flex items-center bg-black/10 dark:bg-white/10 rounded-full px-3 py-2 border border-[var(--panel-border)] w-full max-w-md">
            <Search className="w-4 h-4 text-[var(--text-secondary)] mr-2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ward..."
              className="bg-transparent border-none outline-none w-full text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredWards.length === 0 ? (
            <div className="glass-panel rounded-3xl border border-dashed border-[var(--panel-border)] p-8 text-center text-sm text-[var(--text-secondary)]">
              No wards match your search.
            </div>
          ) : (
            filteredWards.map((ward) => {
              const statusClass =
                ward.status === 'Active'
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-warning/20 text-warning border-warning/50';

              return (
                <button
                  key={ward.id}
                  onClick={() => {
                    setSelectedWardId(ward.id);
                    setCurrentPage('wardDetails');
                  }}
                  className="glass-panel rounded-3xl border glowing-border p-5 text-left hover:scale-[1.01] transition-transform"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-full text-primary border border-primary/20">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{ward.name}</h3>
                        <p className="text-sm text-[var(--text-secondary)]">Ward ID: {ward.id}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusClass}`}>{ward.status}</span>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-4 text-sm text-[var(--text-secondary)]">
                    <div className="rounded-2xl bg-black/5 dark:bg-white/5 p-4 border border-[var(--panel-border)] text-center">
                      <div className="text-[var(--text-secondary)] text-xs uppercase tracking-wider">Gateways</div>
                      <div className="mt-2 text-lg font-semibold data-font text-[var(--text-primary)]">{ward.gatewayCount}</div>
                    </div>
                    <div className="rounded-2xl bg-black/5 dark:bg-white/5 p-4 border border-[var(--panel-border)] text-center">
                      <div className="text-[var(--text-secondary)] text-xs uppercase tracking-wider">Lights</div>
                      <div className="mt-2 text-lg font-semibold data-font text-[var(--text-primary)]">{ward.lightCount}</div>
                    </div>
                    <div className="rounded-2xl bg-black/5 dark:bg-white/5 p-4 border border-[var(--panel-border)] text-center">
                      <div className="text-[var(--text-secondary)] text-xs uppercase tracking-wider">Online</div>
                      <div className="mt-2 text-lg font-semibold data-font text-[var(--text-primary)]">{ward.onlineLights}</div>
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
