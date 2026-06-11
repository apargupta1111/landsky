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

// ── Telemetry snapshot for history charts ─────────────────────────────────────
export interface TelemetrySnapshot {
  ts: number;           // epoch ms
  brightness: number;
  power: number;
  temp: number;
  voltage: number;
  current: number;
}

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
  },
  {
    id: 'mohali-phase-1',
    name: 'Mohali Phase 1',
    gatewayCount: 18,
    lightCount: 340,
    onlineLights: 332,
    faults: 4,
    status: 'Active',
  },
];

const GATEWAYS: Gateway[] = [
  { id: 'GW001', projectId: 'chandigarh', connectedLights: 32, onlineLights: 30, faults: 2, signal: -68, status: 'Warning', lat: 28.4866, lng: 77.5341 },
  { id: 'GW002', projectId: 'chandigarh', connectedLights: 28, onlineLights: 28, faults: 0, signal: -70, status: 'Online', lat: 28.4871, lng: 77.5350 },
  { id: 'GW003', projectId: 'chandigarh', connectedLights: 24, onlineLights: 23, faults: 1, signal: -72, status: 'Online', lat: 28.4874, lng: 77.5355 },
  { id: 'GW004', projectId: 'mohali-phase-1', connectedLights: 30, onlineLights: 29, faults: 1, signal: -69, status: 'Online', lat: 28.4882, lng: 77.5360 },
  { id: 'GW005', projectId: 'mohali-phase-1', connectedLights: 31, onlineLights: 31, faults: 0, signal: -67, status: 'Online', lat: 28.4888, lng: 77.5367 },
  { id: 'GW006', projectId: 'mohali-phase-1', connectedLights: 28, onlineLights: 27, faults: 1, signal: -71, status: 'Warning', lat: 28.4891, lng: 77.5372 },
];

const LIGHTS: LightAsset[] = [
  { id: 'Pole-001', gatewayId: 'GW001', name: 'Pole 1', brightness: 80, power: 102, status: 'Online', voltage: 230, current: 0.44, temperature: 32, operatingTime: '1,230 hrs', powerFactor: 0.98, firmware: 'v1.2.7', gateway: 'GW001', lastCommunication: '2 min ago', lat: 28.4865, lng: 77.5340 },
  { id: 'Pole-002', gatewayId: 'GW001', name: 'Pole 2', brightness: 100, power: 105, status: 'Online', voltage: 231, current: 0.46, temperature: 30, operatingTime: '1,245 hrs', powerFactor: 0.99, firmware: 'v1.2.7', gateway: 'GW001', lastCommunication: '1 min ago', lat: 28.4863, lng: 77.5345 },
  { id: 'Pole-003', gatewayId: 'GW001', name: 'Pole 3', brightness: 0, power: 0, status: 'Offline', voltage: 0, current: 0, temperature: 0, operatingTime: '0 hrs', powerFactor: 0.0, firmware: 'v1.2.6', gateway: 'GW001', lastCommunication: '12 hrs ago', lat: 28.4861, lng: 77.5338 },
  { id: 'Pole-004', gatewayId: 'GW002', name: 'Pole 4', brightness: 92, power: 98, status: 'Online', voltage: 229, current: 0.42, temperature: 31, operatingTime: '1,150 hrs', powerFactor: 0.97, firmware: 'v1.2.7', gateway: 'GW002', lastCommunication: '3 min ago', lat: 28.4870, lng: 77.5351 },
  { id: 'Pole-005', gatewayId: 'GW003', name: 'Pole 5', brightness: 75, power: 95, status: 'Warning', voltage: 228, current: 0.41, temperature: 35, operatingTime: '1,180 hrs', powerFactor: 0.93, firmware: 'v1.2.6', gateway: 'GW003', lastCommunication: '8 min ago', lat: 28.4873, lng: 77.5356 },
];

const FAULTS: Fault[] = [
  { id: 'F-1301', projectId: 'chandigarh', projectName: 'Smart City Chandigarh', gatewayId: 'GW001', poleId: 'Pole-003', type: 'Power Failure', timestamp: '2026-06-10 09:18', status: 'Open', priority: 'High', assignedTo: 'Team Alpha' },
  { id: 'F-1302', projectId: 'chandigarh', projectName: 'Smart City Chandigarh', gatewayId: 'GW003', poleId: 'Pole-005', type: 'Low Brightness', timestamp: '2026-06-10 10:05', status: 'Assigned', priority: 'Medium', assignedTo: 'Team Bravo' },
  { id: 'F-2301', projectId: 'mohali-phase-1', projectName: 'Mohali Phase 1', gatewayId: 'GW006', poleId: 'Pole-006', type: 'Communication Loss', timestamp: '2026-06-10 07:45', status: 'Open', priority: 'High', assignedTo: 'Team Delta' },
];

const VALID_USER = 'admin123';
const VALID_PASS = 'admin123';

export type Page =
  | 'dashboard'
  | 'projects'
  | 'analytics'
  | 'settings'
  | 'faults'
  | 'organization'
  | 'projectDetails'
  | 'gatewayDetails';

// ── Store shape ────────────────────────────────────────────────────────────────
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
      gateways: GATEWAYS,
      lights: LIGHTS,
      faults: FAULTS,

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
