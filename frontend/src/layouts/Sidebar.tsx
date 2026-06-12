import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Map as MapIcon, Folder, Activity, Settings, Menu, X, Users, AlertCircle, ChevronDown } from 'lucide-react';
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

function ProjectsDropdown({ sidebarOpen }: { sidebarOpen: boolean }) {
  const projects = useAppStore((s) => s.projects);
  const currentPage = useAppStore((s) => s.currentPage);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const setSelectedProjectId = useAppStore((s) => s.setSelectedProjectId);
  const [isOpen, setIsOpen] = useState(false);

  const handleProjectClick = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentPage('projectDetails');
    setIsOpen(false);
  };

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all
          ${currentPage === 'projectDetails' || isOpen
            ? 'bg-primary/20 border border-primary/50 text-primary shadow-[inset_4px_0_0_var(--accent-primary)]'
            : 'text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--text-primary)]'
          }`}
      >
        <div className="flex items-center shrink-0">
          <Folder className="w-5 h-5" />
          {sidebarOpen && (
            <span className="ml-4 font-medium whitespace-nowrap">Projects</span>
          )}
        </div>
        {sidebarOpen && (
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-1 overflow-hidden"
          >
            {projects.length === 0 ? (
              <div className="px-4 py-2 text-xs text-[var(--text-secondary)]">No projects</div>
            ) : (
              projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleProjectClick(project.id)}
                  className="w-full px-6 py-2 text-left text-sm rounded-lg text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-primary transition-colors whitespace-nowrap overflow-hidden text-ellipsis"
                  title={project.name}
                >
                  {project.name}
                </button>
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
      <nav className="flex-1 px-3 space-y-1 mt-2 overflow-hidden">
        <NavItem icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard"   active={currentPage === 'dashboard'}  sidebarOpen={sidebarOpen} onClick={() => setCurrentPage('dashboard')} />
        <ProjectsDropdown sidebarOpen={sidebarOpen} />
        <NavItem icon={<MapIcon        className="w-5 h-5" />} label="Live Map"    active={false}                       sidebarOpen={sidebarOpen} onClick={() => setCityMapOpen(true)} />
        <NavItem icon={<Activity       className="w-5 h-5" />} label="Analytics"   active={currentPage === 'analytics'} sidebarOpen={sidebarOpen} onClick={() => setCurrentPage('analytics')} />
        <NavItem icon={<AlertCircle    className="w-5 h-5" />} label="Faults"      active={currentPage === 'faults'}    sidebarOpen={sidebarOpen} onClick={() => setCurrentPage('faults')} />
        <NavItem icon={<Users          className="w-5 h-5" />} label="Organization" active={currentPage === 'organization'} sidebarOpen={sidebarOpen} onClick={() => setCurrentPage('organization')} />
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
