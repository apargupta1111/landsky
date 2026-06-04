import { Sun, Moon, Bell, Search, Menu, LogOut } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../store/useAppStore';

export function Topbar() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { toggleSidebar, username, logout } = useAppStore();

  const initials = username
    ? username.slice(0, 2).toUpperCase()
    : 'AD';

  return (
    <header className="h-16 md:h-20 glass-panel border-b flex items-center justify-between px-4 md:px-8 z-10 shrink-0 gap-3">
      {/* Mobile hamburger */}
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors lg:hidden shrink-0"
      >
        <Menu className="w-5 h-5 text-primary" />
      </button>

      {/* Search bar */}
      <div className="hidden sm:flex items-center bg-black/5 dark:bg-white/5 rounded-full px-4 py-2 flex-1 max-w-xs md:max-w-md border border-[var(--panel-border)]">
        <Search className="w-4 h-4 text-[var(--text-secondary)] mr-3 shrink-0" />
        <input
          type="text"
          placeholder="Search devices..."
          className="bg-transparent border-none outline-none text-sm w-full placeholder-[var(--text-secondary)] text-[var(--text-primary)]"
        />
      </div>

      {/* Right side actions */}
      <div className="flex items-center space-x-3 md:space-x-4 ml-auto">
        {/* Search icon on mobile only */}
        <button className="sm:hidden p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
          <Search className="w-5 h-5 text-[var(--text-secondary)]" />
        </button>

        {/* Notification bell */}
        <div className="relative">
          <Bell className="w-5 h-5 md:w-6 md:h-6 text-[var(--text-secondary)] hover:text-primary cursor-pointer transition-colors" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-error rounded-full animate-pulse" />
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
            <div className="text-xs text-[var(--text-secondary)]">System Admin</div>
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
