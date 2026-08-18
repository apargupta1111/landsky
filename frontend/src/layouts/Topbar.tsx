import { Bell, Moon, Sun, Menu, LogOut } from 'lucide-react';
import { useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../store/useAppStore';

export function Topbar() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { toggleSidebar, username, role, logout, activeFaultCount, fetchActiveFaultCount, setCurrentPage } = useAppStore();

  useEffect(() => {
    fetchActiveFaultCount();
  }, [fetchActiveFaultCount]);

  const initials = username
    ? username.slice(0, 2).toUpperCase()
    : 'AD';

  const formatRole = (r: string) => {
    if (!r) return 'User';
    if (r === 'superadmin') return 'System Admin';
    if (r === 'installer') return 'Installer';
    return 'Client User';
  };

  return (
    <header className="h-16 md:h-20 glass-panel border-b flex items-center justify-between px-4 md:px-8 z-10 shrink-0 gap-3">
      {/* Mobile hamburger */}
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors lg:hidden shrink-0"
      >
        <Menu className="w-5 h-5 text-primary" />
      </button>

      {/* Right side actions */}
      <div className="flex items-center space-x-3 md:space-x-4 ml-auto">

        {/* Notification bell */}
        <div 
          className="relative cursor-pointer"
          onClick={() => setCurrentPage('faults')}
        >
          <Bell className="w-5 h-5 md:w-6 md:h-6 text-[var(--text-secondary)] hover:text-primary transition-colors" />
          {activeFaultCount > 0 && (
            <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-[1.25rem] h-5 px-1 bg-error text-white text-[10px] font-bold rounded-full border-2 border-[var(--bg-color)] animate-pulse">
              {activeFaultCount > 99 ? '99+' : activeFaultCount}
            </span>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full glass-panel glowing-border flex items-center justify-center transition-all"
        >
          {isDarkMode ? <Sun className="w-4 h-4 md:w-5 md:h-5 text-warning" /> : <Moon className="w-4 h-4 md:w-5 md:h-5 text-secondary" />}
        </button>

        {/* User + Logout */}
        <div className="flex items-center gap-2 border-l border-[var(--panel-border)] pl-3 md:pl-4">
          <div className="text-right hidden md:block">
            <div className="text-sm font-bold">{username || 'Admin'}</div>
            <div className="text-xs text-[var(--text-secondary)]">{formatRole(role)}</div>
          </div>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/20 border border-primary flex items-center justify-center font-bold text-primary text-sm shrink-0">
            {initials}
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-2 rounded-full hover:bg-error/10 hover:text-error text-[var(--text-secondary)] transition-colors"
          >
            <LogOut className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
