import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── TypeScript Interfaces ──────────────────────────────────────────────────
export interface Device {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  ttsDeviceId: string;
  addedAt: string;
}

export interface Project {
  id: string;
  name: string;
  gatewayCount: number;
  lightCount: number;
  onlineLights: number;
  faults: number;
  status: 'Active' | 'At Risk';
}

export interface Gateway {
  id: string;
  projectId: string;
  connectedLights: number;
  onlineLights: number;
  faults: number;
  signal: number;
  status: 'Online' | 'Warning' | 'Offline';
  lat: number;
  lng: number;
}

export interface LightAsset {
  id: string;
  gatewayId: string;
  name: string;
  brightness: number;
  power: number;
  status: 'Online' | 'Offline' | 'Warning';
  voltage: number;
  current: number;
  temperature: number;
  operatingTime: string;
  powerFactor: number;
  firmware: string;
  gateway: string;
  lastCommunication: string;
  lat: number;
  lng: number;
}

export interface Fault {
  id: string;
  projectId: string;
  projectName: string;
  gatewayId: string;
  poleId: string;
  type: string;
  timestamp: string;
  status: 'Open' | 'Assigned' | 'Resolved';
  priority: 'High' | 'Medium' | 'Low';
  assignedTo: string;
}

export interface TelemetrySnapshot {
  ts: number;           // epoch ms
  brightness: number;
  power: number;
  temp: number;
  voltage: number;
  current: number;
}



export interface Gateway {
  // API fields
  eui: string;
  tenantId: number;
  name: string;
  description: string;
  region: string;
  connectionStatus: boolean;
  lastSeen: string;

  location: {
    x: number;
    y: number;
  };

  installedAt: string;
  installedBy: number;
  createdAt: string;
  updatedAt: string;

  // UI fields (derived)
  id: string;
  projectId: string;
  connectedLights: number;
  onlineLights: number;
  faults: number;
  status: 'Online' | 'Warning' | 'Offline';
  lat: number;
  lng: number;
}

// ── Static Mock Seed Data ──────────────────────────────────────────────────
const SEED_DEVICE: Device = {
  id:          'streetlight-01',
  name:        'Streetlight Node',
  address:     'Plot B-6/5, Surajpur Site V, Greater Noida, UP 201306',
  lat:         28.4859,
  lng:         77.5342,
  ttsDeviceId: 'streetlight-01',
  addedAt:     new Date().toISOString(),
};

const PROJECTS: Project[] = [
  {
    id: 'chandigarh',
    name: 'Smart City Chandigarh',
    gatewayCount: 24,
    lightCount: 520,
    onlineLights: 498,
    faults: 12,
    status: 'Active',
  }
];

const FAULTS: Fault[] = [
  { id: 'F-1301', projectId: 'chandigarh', projectName: 'Smart City Chandigarh', gatewayId: 'GW001', poleId: 'Pole-003', type: 'Power Failure', timestamp: '2026-06-10 09:18', status: 'Open', priority: 'High', assignedTo: 'Team Alpha' },
  { id: 'F-1302', projectId: 'chandigarh', projectName: 'Smart City Chandigarh', gatewayId: 'GW003', poleId: 'Pole-005', type: 'Low Brightness', timestamp: '2026-06-10 10:05', status: 'Assigned', priority: 'Medium', assignedTo: 'Team Bravo' },
  { id: 'F-2301', projectId: 'mohali-phase-1', projectName: 'Mohali Phase 1', gatewayId: 'GW006', poleId: 'Pole-006', type: 'Communication Loss', timestamp: '2026-06-10 07:45', status: 'Open', priority: 'High', assignedTo: 'Team Delta' },
];

const VALID_USER = 'a';
const VALID_PASS = 'a';

export type Page =
  | 'dashboard'
  | 'projects'
  | 'gateways'
  | 'analytics'
  | 'settings'
  | 'faults'
  | 'organization'
  | 'projectDetails'
  | 'gatewayDetails';

// ── Zustand Store State Interface ──────────────────────────────────────────
interface AppState {
  isDarkMode: boolean;
  toggleTheme: () => void;

  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  currentPage: Page;
  setCurrentPage: (page: Page) => void;

  selectedProjectId: string | null;
  selectedGatewayId: string | null;
  selectedLightId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  setSelectedGatewayId: (id: string | null) => void;
  setSelectedLightId: (id: string | null) => void;

  isAuthenticated: boolean;
  username: string;
  login: (user: string, pass: string) => boolean;
  logout: () => void;

  devices: Device[];
  addDevice: (device: Device) => void;
  removeDevice: (id: string) => void;

  projects: Project[];
  gateways: Gateway[];
  lights: LightAsset[];
  faults: Fault[];

  // API Integration States
  isLoadingGateways: boolean;
  gatewayFetchError: string | null;
  fetchGateways: () => Promise<void>;

  telemetryHistory: TelemetrySnapshot[];
  pushTelemetrySnapshot: (snap: TelemetrySnapshot) => void;
  clearTelemetryHistory: () => void;
}

// ── Store Implementation ────────────────────────────────────────────────────
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

      selectedProjectId: null,
      selectedGatewayId: null,
      selectedLightId: null,
      setSelectedProjectId: (id) => set({ selectedProjectId: id }),
      setSelectedGatewayId: (id) => set({ selectedGatewayId: id }),
      setSelectedLightId: (id) => set({ selectedLightId: id }),

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

      projects: PROJECTS,
      gateways: [], // Stays blank until fetchGateways handles loading state
      lights: [],
      faults: FAULTS,

      // Live Backend Integration Action
      isLoadingGateways: false,
      gatewayFetchError: null,
      fetchGateways: async () => {
        set({ isLoadingGateways: true, gatewayFetchError: null });
        try {
            console.log("fetchGateways called");
          const response = await fetch('http://192.168.1.47:3000/api/landsky_streetlight/gateways');
          if (!response.ok) {
            throw new Error(`Server returned HTTP Error Status: ${response.status}`);
          }
          
          const json = await response.json();
          console.log("API Data:", JSON.stringify(json, null, 2));

          // Support APIs that return either an array or a wrapper { success: true, data: [...] }
          const items: ApiGatewayItem[] = Array.isArray(json) ? json : (json?.data ?? []);
          if (!Array.isArray(items)) throw new Error('Unexpected API payload shape');

          // Data sanitization and key mapping pipeline
         const formattedGateways: Gateway[] = items.map((item: any) => ({
  id: item.eui,                       // <-- unique id
  projectId: String(item.tenantId),   // <-- or "default"

  status: item.connectionStatus
    ? "Online"
    : "Offline",
 region: item.region,
  lat: item.location?.y ?? 0,
  lng: item.location?.x ?? 0,
}));

          console.log('Formatted gateways count:', formattedGateways.length);
          set({ gateways: formattedGateways, isLoadingGateways: false });
        } catch (error: any) {
          set({ 
            gatewayFetchError: error.message || 'error retrieving remote assets', 
            isLoadingGateways: false 
          });
        }
      },

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