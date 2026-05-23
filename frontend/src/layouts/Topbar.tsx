import { Sun, Moon, Bell, Search } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export function Topbar() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <header className="h-20 glass-panel border-b flex items-center justify-between px-8 z-10 shrink-0">
      <div className="flex items-center bg-black/5 dark:bg-white/5 rounded-full px-4 py-2 w-96 border border-[var(--panel-border)]">
        <Search className="w-5 h-5 text-[var(--text-secondary)] mr-3" />
        <input 
          type="text" 
          placeholder="Search devices, nodes, coordinates..." 
          className="bg-transparent border-none outline-none text-sm w-full placeholder-[var(--text-secondary)] text-[var(--text-primary)]"
        />
      </div>

      <div className="flex items-center space-x-6">
        <div className="relative">
          <Bell className="w-6 h-6 text-[var(--text-secondary)] hover:text-primary cursor-pointer transition-colors" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-error rounded-full animate-pulse shadow-[0_0_10px_var(--accent-error)]" />
        </div>
        
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full glass-panel glowing-border flex items-center justify-center transition-all"
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-warning" /> : <Moon className="w-5 h-5 text-secondary" />}
        </button>

        <div className="flex items-center space-x-3 border-l border-[var(--panel-border)] pl-6">
          <div className="text-right hidden md:block">
            <div className="text-sm font-bold">Operator Alpha</div>
            <div className="text-xs text-[var(--text-secondary)]">System Admin</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary flex items-center justify-center font-bold text-primary shadow-[0_0_15px_rgba(var(--accent-primary),0.3)]">
            OA
          </div>
        </div>
      </div>
    </header>
  );
}
