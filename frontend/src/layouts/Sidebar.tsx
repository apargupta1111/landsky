import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Map as MapIcon, Zap, Activity, Settings, Menu, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { ComingSoon } from '../components/ComingSoon';
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

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useAppStore();
  const [comingSoonPage, setComingSoonPage] = useState<string | null>(null);

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

  const openComingSoon = (name: string) => setComingSoonPage(name);
  const closeComingSoon = () => setComingSoonPage(null);

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
      <nav className="flex-1 px-3 space-y-1 mt-2 overflow-hidden">
        <NavItem icon={<LayoutDashboard className="w-5 h-5" />} label="Overview"    active       sidebarOpen={sidebarOpen} />
        <NavItem icon={<MapIcon        className="w-5 h-5" />} label="City Map"    sidebarOpen={sidebarOpen} onClick={() => setCityMapOpen(true)} />
        <NavItem icon={<Zap            className="w-5 h-5" />} label="Energy Grid" sidebarOpen={sidebarOpen} onClick={() => openComingSoon('Energy Grid')} />
        <NavItem icon={<Activity       className="w-5 h-5" />} label="Analytics"   sidebarOpen={sidebarOpen} onClick={() => openComingSoon('Analytics')} />
        <NavItem icon={<Settings       className="w-5 h-5" />} label="Settings"    sidebarOpen={sidebarOpen} onClick={() => openComingSoon('Settings')} />
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
      <ComingSoon
        isOpen={!!comingSoonPage}
        pageName={comingSoonPage ?? ''}
        onClose={closeComingSoon}
      />

      {/* City Map overlay */}
      <CityMap isOpen={cityMapOpen} onClose={() => setCityMapOpen(false)} />
    </>
  );
}
