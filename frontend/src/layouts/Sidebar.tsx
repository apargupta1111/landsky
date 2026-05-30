import { motion } from 'framer-motion';
import { LayoutDashboard, Map as MapIcon, Zap, Activity, Settings, Menu } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

function NavItem({ icon, label, active = false, sidebarOpen }: any) {
  return (
    <div className={`flex items-center px-4 py-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-primary/20 border border-primary/50 text-primary shadow-[inset_4px_0_0_var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--text-primary)]'}`}>
      {icon}
      {sidebarOpen && <span className="ml-4 font-medium">{label}</span>}
    </div>
  );
}

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useAppStore();

  return (
    <motion.aside 
      initial={{ width: sidebarOpen ? 280 : 80 }}
      animate={{ width: sidebarOpen ? 280 : 80 }}
      className="h-screen glass-panel flex flex-col z-20 shrink-0 border-r"
    >
      <div className="p-6 flex items-center justify-between">
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-bold text-xl tracking-wider text-primary">
            LANDSKY
          </motion.div>
        )}
        <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
          <Menu className="w-6 h-6 text-primary" />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        <NavItem icon={<LayoutDashboard />} label="Overview" active sidebarOpen={sidebarOpen} />
        <NavItem icon={<MapIcon />} label="City Map" sidebarOpen={sidebarOpen} />
        <NavItem icon={<Zap />} label="Energy Grid" sidebarOpen={sidebarOpen} />
        <NavItem icon={<Activity />} label="Analytics" sidebarOpen={sidebarOpen} />
        <NavItem icon={<Settings />} label="Settings" sidebarOpen={sidebarOpen} />
      </nav>
    </motion.aside>
  );
}
