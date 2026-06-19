import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createUISlice } from './uiStore';
import { createAuthSlice } from './authStore';
import { createDeviceSlice } from './deviceStore';
import { createGatewaySlice } from './gatewayStore';
import { createProjectSlice } from './projectStore';
import { createAssetSlice } from './assetStore';

import type { Device, Project, Gateway, LightAsset, Fault, TelemetrySnapshot, Page } from './types';

// ── Root Store Interface ───────────────────────────────────────────────────
export interface AppState {
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

  projects: Project[];
  faults: Fault[];
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;

  gateways: Gateway[];
  selectedGatewayId: string | null;
  setSelectedGatewayId: (id: string | null) => void;
  isLoadingGateways: boolean;
  gatewayFetchError: string | null;
  fetchGateways: () => Promise<void>;
  addGateway: (gateway: Gateway) => void;
  deleteGateway: (id: string) => void;
  telemetryHistory: TelemetrySnapshot[];
  pushTelemetrySnapshot: (snap: TelemetrySnapshot) => void;
  clearTelemetryHistory: () => void;

  lights: LightAsset[];
  selectedLightId: string | null;
  setSelectedLightId: (id: string | null) => void;
}

// ── Store Initialization ───────────────────────────────────────────────────
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...createUISlice(set),
      ...createAuthSlice(set),
      ...createDeviceSlice(set, get),
      ...createGatewaySlice(set),
      ...createProjectSlice(set),
      ...createAssetSlice(set),
    }),
    {
      name: 'smartlight-store',
      partialize: (s) => ({
        isDarkMode:       s.isDarkMode,
        telemetryHistory: s.telemetryHistory,
      }),
    },
  ),
);