import type { Gateway, TelemetrySnapshot, ApiGatewayItem } from './types';

// Get Serer IP from environment variable
const SERVER_IP = import.meta.env.VITE_SERVER_IP;


export const createGatewaySlice = (set: any) => ({
  gateways: [] as Gateway[],
  selectedGatewayId: null as string | null,
  setSelectedGatewayId: (id: string | null) => set({ selectedGatewayId: id }),
  isLoadingGateways: false,
  gatewayFetchError: null as string | null,

  fetchGateways: async () => {
    set({ isLoadingGateways: true, gatewayFetchError: null });
    try {
      console.log("fetchGateways called");
      console.log("SERVER_IP", SERVER_IP);
  
console.log("URL:", `${SERVER_IP}/gateways`);
      const response = await fetch(`${SERVER_IP}/gateways`);
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
        lat: Number(item.location?.y ?? 0),
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

  addGateway: (gateway: Gateway) => set((s: any) => ({
    gateways: [gateway, ...s.gateways]
  })),
  deleteGateway: (id: string) => set((s: any) => ({
    gateways: s.gateways.filter((g: any) => g.id !== id)
  })),

  telemetryHistory: [] as TelemetrySnapshot[],
  pushTelemetrySnapshot: (snap: TelemetrySnapshot) =>
    set((s: any) => ({
      telemetryHistory: [...s.telemetryHistory.slice(-29), snap],
    })),
  clearTelemetryHistory: () => set({ telemetryHistory: [] }),
});