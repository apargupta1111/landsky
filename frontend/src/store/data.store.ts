import type { StateCreator } from 'zustand';
import type { AppState } from './useAppStore';
import type { Project, Fault, Gateway, ApiGatewayItem } from './types';
type DataState = any;

const PROJECTS: Project[] = [
  { id: 'chandigarh', name: 'Smart City Chandigarh', gatewayCount: 24, lightCount: 520, onlineLights: 498, faults: 12, status: 'Active' }
];

const FAULTS: Fault[] = [
  { id: 'F-1301', projectId: 'chandigarh', projectName: 'Smart City Chandigarh', gatewayId: 'GW001', poleId: 'Pole-003', type: 'Power Failure', timestamp: '2026-06-10 09:18', status: 'Open', priority: 'High', assignedTo: 'Team Alpha' },
  { id: 'F-1302', projectId: 'chandigarh', projectName: 'Smart City Chandigarh', gatewayId: 'GW003', poleId: 'Pole-005', type: 'Low Brightness', timestamp: '2026-06-10 10:05', status: 'Assigned', priority: 'Medium', assignedTo: 'Team Bravo' },
  { id: 'F-2301', projectId: 'mohali-phase-1', projectName: 'Mohali Phase 1', gatewayId: 'GW006', poleId: 'Pole-006', type: 'Communication Loss', timestamp: '2026-06-10 07:45', status: 'Open', priority: 'High', assignedTo: 'Team Delta' }
];

export const createDataSlice: StateCreator<AppState, [], [], DataState> = (set) => ({
  projects: PROJECTS,
  gateways: [],
  lights: [],
  faults: FAULTS,
  selectedProjectId: null,
  selectedGatewayId: null,
  selectedLightId: null,
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
  setSelectedGatewayId: (id) => set({ selectedGatewayId: id }),
  setSelectedLightId: (id) => set({ selectedLightId: id }),

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
      const items: ApiGatewayItem[] = Array.isArray(json) ? json : (json?.data ?? []);
      if (!Array.isArray(items)) throw new Error('Unexpected API payload shape');

      const formattedGateways: Gateway[] = items.map((item: any) => ({
        eui: item.eui ?? '',
        tenantId: Number(item.tenantId ?? 0),
        name: item.name ?? '',
        description: item.description ?? '',
        region: item.region ?? '',
        connectionStatus: !!item.connectionStatus,
        lastSeen: item.lastSeen ?? '',
        location: {
          x: Number(item.location?.x ?? 0),
          y: Number(item.location?.y ?? 0),
        },
        installedAt: item.installedAt ?? item.createdAt ?? '',
        installedBy: Number(item.installedBy ?? 0),
        createdAt: item.createdAt ?? '',
        updatedAt: item.updatedAt ?? '',
        id: item.eui ?? '',
        projectId: String(item.tenantId ?? ''),
        connectedLights: Number(item.connectedLights ?? 0),
        onlineLights: Number(item.onlineLights ?? 0),
        faults: Number(item.faults ?? 0),
        signal: Number(item.signal ?? 0),
        status: item.connectionStatus ? 'Online' : 'Offline',
        lat/lng: Number(item.location?.y ?? 0),
        lng: Number(item.location?.x ?? 0),
      }));

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
});