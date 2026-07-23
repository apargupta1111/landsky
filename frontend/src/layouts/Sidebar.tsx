import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Map as MapIcon, Folder, Settings, Menu, X, AlertCircle, ChevronDown } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { CityMap } from '../components/CityMap';


function NavItem({ icon, label, active = false, sidebarOpen, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center px-4 py-3 rounded-xl cursor-pointer transition-all
        ${active
          ? 'bg-primary/20 border border-primary/50 text-primary shadow-[inset_4px_0_0_var(--accent-primary)]'
          : 'text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--text-primary)]'
        }`}
    >
      <span className="shrink-0">{icon}</span>
      {sidebarOpen && (
        <span className="ml-4 font-medium whitespace-nowrap">{label}</span>
      )}
    </div>
  );
}

function HierarchyDropdown({ sidebarOpen }: { sidebarOpen: boolean }) {
  const districts = useAppStore((s) => s.districts);
  const nagarpalikas = useAppStore((s) => s.nagarpalikas);
  const wards = useAppStore((s) => s.wards);
  const currentPage = useAppStore((s) => s.currentPage);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const setSelectedDistrictId = useAppStore((s) => s.setSelectedDistrictId);
  const setSelectedNagarpalikaId = useAppStore((s) => s.setSelectedNagarpalikaId);
  const setSelectedWardId = useAppStore((s) => s.setSelectedWardId);

  // Expanded states for the nested tree
  const [isMainOpen, setIsMainOpen] = useState(false);
  const [expandedDistrictId, setExpandedDistrictId] = useState<string | null>(null);
  const [expandedNagarpalikaId, setExpandedNagarpalikaId] = useState<string | null>(null);

  const handleDistrictClick = (e: React.MouseEvent, districtId: string) => {
    e.stopPropagation();
    setSelectedDistrictId(districtId);
    setExpandedDistrictId(expandedDistrictId === districtId ? null : districtId);
    setCurrentPage('nagarpalikas');
  };

  const handleNagarpalikaClick = (e: React.MouseEvent, nagarpalikaId: string) => {
    e.stopPropagation();
    setSelectedNagarpalikaId(nagarpalikaId);
    setExpandedNagarpalikaId(expandedNagarpalikaId === nagarpalikaId ? null : nagarpalikaId);
    setCurrentPage('wards');
  };

  const handleWardClick = (e: React.MouseEvent, wardId: string) => {
    e.stopPropagation();
    setSelectedWardId(wardId);
    setCurrentPage('wardDetails');
  };

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsMainOpen(!isMainOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all
          ${['projects', 'nagarpalikas', 'wards'].includes(currentPage) || isMainOpen
            ? 'bg-primary/20 border border-primary/50 text-primary shadow-[inset_4px_0_0_var(--accent-primary)]'
            : 'text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--text-primary)]'
          }`}
      >
        <div className="flex items-center shrink-0">
          <Folder className="w-5 h-5" />
          {sidebarOpen && (
            <span className="ml-4 font-medium whitespace-nowrap">Districts</span>
          )}
        </div>
        {sidebarOpen && (
          <motion.div animate={{ rotate: isMainOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        )}
      </button>

      <AnimatePresence>
        {isMainOpen && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-1 overflow-hidden"
          >
            {districts.length === 0 ? (
              <div className="px-4 py-2 text-xs text-[var(--text-secondary)]">No districts</div>
            ) : (
              districts.map((district) => (
                <div key={district.id} className="w-full">
                  {/* District Row */}
                  <button
                    onClick={(e) => handleDistrictClick(e, district.id)}
                    className="w-full flex items-center justify-between px-6 py-2 text-left text-sm rounded-lg text-[var(--text-primary)] font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    title={district.name}
                  >
                    <span className="truncate">{district.name}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedDistrictId === district.id ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Nagarpalikas for District */}
                  <AnimatePresence>
                    {expandedDistrictId === district.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pl-4 border-l border-black/10 dark:border-white/10 ml-6 mt-1 space-y-1"
                      >
                        {nagarpalikas.filter(n => n.districtId === district.id).map(nagarpalika => (
                          <div key={nagarpalika.id} className="w-full">
                            {/* Nagarpalika Row */}
                            <button
                              onClick={(e) => handleNagarpalikaClick(e, nagarpalika.id)}
                              className="w-full flex items-center justify-between px-3 py-1.5 text-left text-sm rounded-lg text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-primary transition-colors"
                              title={nagarpalika.name}
                            >
                              <span className="truncate">{nagarpalika.name}</span>
                              <ChevronDown className={`w-3 h-3 transition-transform ${expandedNagarpalikaId === nagarpalika.id ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Wards for Nagarpalika */}
                            <AnimatePresence>
                              {expandedNagarpalikaId === nagarpalika.id && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="pl-3 border-l border-black/10 dark:border-white/10 ml-3 mt-1 space-y-1"
                                >
                                  {wards.filter(w => w.nagarpalikaId === nagarpalika.id).map(ward => (
                                    <button
                                      key={ward.id}
                                      onClick={(e) => handleWardClick(e, ward.id)}
                                      className="w-full px-3 py-1.5 text-left text-xs rounded-lg text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-primary transition-colors truncate"
                                      title={ward.name}
                                    >
                                      {ward.name}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, setSidebarOpen, currentPage, setCurrentPage } = useAppStore();
  // Detect whether we're on a mobile/tablet breakpoint (< 1024px = lg)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );

  useEffect(() => {
    const handler = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // Auto-close on mobile when resizing to small, auto-open on desktop
      if (!mobile) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [setSidebarOpen]);

  const [cityMapOpen, setCityMapOpen] = useState(false);

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="p-4 flex items-center justify-between h-16 md:h-20 shrink-0">
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              key="logo"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="font-bold text-xl tracking-wider text-primary whitespace-nowrap"
            >
              LANDSKY
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0 ml-auto"
        >
          {(isMobile || sidebarOpen)
            ? <X className="w-5 h-5 text-primary" />
            : <Menu className="w-6 h-6 text-primary" />
          }
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1 mt-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <NavItem icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard"   active={currentPage === 'dashboard'}  sidebarOpen={sidebarOpen} onClick={() => setCurrentPage('dashboard')} />
        <HierarchyDropdown sidebarOpen={sidebarOpen} />
        <NavItem icon={<MapIcon        className="w-5 h-5" />} label="Live Map"    active={false}                       sidebarOpen={sidebarOpen} onClick={() => setCityMapOpen(true)} />
        {/* <NavItem icon={<Activity       className="w-5 h-5" />} label="Analytics"   active={currentPage === 'analytics'} sidebarOpen={sidebarOpen} onClick={() => setCurrentPage('analytics')} /> */}
        <NavItem icon={<AlertCircle    className="w-5 h-5" />} label="Faults"      active={currentPage === 'faults'}    sidebarOpen={sidebarOpen} onClick={() => setCurrentPage('faults')} />
        {/* <NavItem icon={<Users          className="w-5 h-5" />} label="Organization" active={currentPage === 'organization'} sidebarOpen={sidebarOpen} onClick={() => setCurrentPage('organization')} /> */}
        <NavItem icon={<Settings       className="w-5 h-5" />} label="Settings"    active={currentPage === 'settings'}  sidebarOpen={sidebarOpen} onClick={() => setCurrentPage('settings')} />
      </nav>
    </>
  );

  return (
    <>
      {isMobile ? (
        /* ── MOBILE: Fixed overlay drawer ── */
        <>
          <AnimatePresence>
            {sidebarOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  key="backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSidebarOpen(false)}
                  className="fixed inset-0 bg-black/50 z-[49]"
                />
                {/* Drawer */}
                <motion.aside
                  key="drawer"
                  initial={{ x: -280 }}
                  animate={{ x: 0 }}
                  exit={{ x: -280 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="fixed top-0 left-0 h-screen w-[280px] glass-panel flex flex-col z-[50] border-r overflow-hidden"
                >
                  {sidebarContent}
                </motion.aside>
              </>
            )}
          </AnimatePresence>
        </>
      ) : (
        /* ── DESKTOP: Flex-flow sidebar that squeezes content ── */
        <motion.aside
          animate={{ width: sidebarOpen ? 280 : 80 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="h-screen glass-panel flex flex-col z-20 shrink-0 border-r overflow-hidden relative"
        >
          {sidebarContent}
        </motion.aside>
      )}

      {/* Coming Soon overlay */}
      <CityMap isOpen={cityMapOpen} onClose={() => setCityMapOpen(false)} />
    </>
  );
}
