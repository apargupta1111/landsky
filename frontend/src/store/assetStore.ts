import { create } from "zustand";

export interface Project {
  id: string;
  name: string;
  gatewayCount: number;
  lightCount: number;
  onlineLights: number;
  faults: number;
  status: "Active" | "At Risk";
}

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

export interface LightAsset {
  id: string;
  gatewayId: string;
  name: string;
  brightness: number;
  power: number;
  status: "Online" | "Offline" | "Warning";
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

interface AssetState {
  projects: Project[];
  gateways: Gateway[];
  lights: LightAsset[];

  setProjects: (projects: Project[]) => void;
  setGateways: (gateways: Gateway[]) => void;
  setLights: (lights: LightAsset[]) => void;

  fetchProjects: () => Promise<void>;
  fetchGateways: () => Promise<void>;
  fetchLights: () => Promise<void>;
}

export const useAssetStore = create<AssetState>((set) => ({
  projects: [],
  gateways: [],
  lights: [],

  setProjects: (projects) =>
    set({
      projects,
    }),

  setGateways: (gateways) =>
    set({
      gateways,
    }),

  setLights: (lights) =>
    set({
      lights,
    }),

  fetchProjects: async () => {
    const res = await fetch("/api/projects");
    const data = await res.json();

    set({
      projects: data,
    });
  },

  fetchGateways: async () => {
    const res = await fetch("/api/gateways");
    const data = await res.json();

    set({
      gateways: data,
    });
  },

  fetchLights: async () => {
    const res = await fetch("/api/lights");
    const data = await res.json();

    set({
      lights: data,
    });
  },
}));