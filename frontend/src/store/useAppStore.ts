import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Device type ────────────────────────────────────────────────────────────────
export interface Device {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  ttsDeviceId: string;
  addedAt: string;
}

// ── Telemetry snapshot for history charts ─────────────────────────────────────
export interface TelemetrySnapshot {
  ts: number;           // epoch ms
  brightness: number;
  power: number;
  temp: number;
  voltage: number;
  current: number;
}

// ── Hardcoded seed device ──────────────────────────────────────────────────────
const SEED_DEVICE: Device = {
  id:          'streetlight-01',
  name:        'Streetlight Node',
  address:     'Plot B-6/5, Surajpur Site V, Greater Noida, UP 201306',
  lat:         28.4859,
  lng:         77.5342,
  ttsDeviceId: 'streetlight-01',
  addedAt:     new Date().toISOString(),
};

const VALID_USER = 'admin123';
const VALID_PASS = 'admin123';

export type Page = 'dashboard' | 'analytics' | 'settings';

// ── Store shape ────────────────────────────────────────────────────────────────
interface AppState {
  isDarkMode: boolean;
  toggleTheme: () => void;

  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  currentPage: Page;
  setCurrentPage: (page: Page) => void;

  isAuthenticated: boolean;
  username: string;
  login: (user: string, pass: string) => boolean;
  logout: () => void;

  devices: Device[];
  addDevice: (device: Device) => void;
  removeDevice: (id: string) => void;

  // Rolling telemetry history (last 30 snapshots)
  telemetryHistory: TelemetrySnapshot[];
  pushTelemetrySnapshot: (snap: TelemetrySnapshot) => void;
  clearTelemetryHistory: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      isDarkMode: true,
      toggleTheme: () => set((s) => ({ isDarkMode: !s.isDarkMode })),

      sidebarOpen: true,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      currentPage: 'dashboard',
      setCurrentPage: (page) => set({ currentPage: page }),

      isAuthenticated: false,
      username: '',
      login: (user, pass) => {
        if (user === VALID_USER && pass === VALID_PASS) {
          set({ isAuthenticated: true, username: user, currentPage: 'dashboard' });
          return true;
        }
        return false;
      },
      logout: () => set({ isAuthenticated: false, username: '', currentPage: 'dashboard' }),

      devices: [SEED_DEVICE],
      addDevice: (device) => {
        const existing = get().devices.find((d) => d.id === device.id);
        if (!existing) set((s) => ({ devices: [...s.devices, device] }));
      },
      removeDevice: (id) =>
        set((s) => ({ devices: s.devices.filter((d) => d.id !== id) })),

      telemetryHistory: [],
      pushTelemetrySnapshot: (snap) =>
        set((s) => ({
          telemetryHistory: [...s.telemetryHistory.slice(-29), snap],
        })),
      clearTelemetryHistory: () => set({ telemetryHistory: [] }),
    }),
    {
      name: 'smartlight-store',
      partialize: (s) => ({
        isDarkMode:       s.isDarkMode,
        devices:          s.devices,
        telemetryHistory: s.telemetryHistory,
      }),
    },
  ),
);
