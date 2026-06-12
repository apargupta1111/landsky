import { create } from "zustand";

export interface Gateway {
  id: string;
  projectId: string;

  connectedLights: number;
  onlineLights: number;

  faults: number;

  signal: number;

  status: "Online" | "Warning" | "Offline";

  lat: number;
  lng: number;
}

interface GatewayState {
  gateways: Gateway[];

  setGateways: (gateways: Gateway[]) => void;

  addGateway: (gateway: Gateway) => void;

  removeGateway: (id: string) => void;

  fetchGateways: () => Promise<void>;
}

export const useGatewayStore = create<GatewayState>((set, get) => ({
  gateways: [],

  setGateways: (gateways) =>
    set({
      gateways,
    }),

  addGateway: (gateway) => {
    const exists = get().gateways.find(
      (g) => g.id === gateway.id
    );

    if (!exists) {
      set((state) => ({
        gateways: [...state.gateways, gateway],
      }));
    }
  },

  removeGateway: (id) =>
    set((state) => ({
      gateways: state.gateways.filter(
        (gateway) => gateway.id !== id
      ),
    })),

  fetchGateways: async () => {
    try {
      const response = await fetch("/api/gateways");

      if (!response.ok) {
        throw new Error("Failed to fetch gateways");
      }

      const data = await response.json();

      set({
        gateways: data,
      });
    } catch (error) {
      console.error(error);
    }
  },
}));