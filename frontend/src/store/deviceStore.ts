// src/store/deviceStore.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Device {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  ttsDeviceId: string;
  addedAt: string;
}

const SEED_DEVICE: Device = {
  id: "streetlight-01",
  name: "Streetlight Node",
  address: "Plot B-6/5, Surajpur Site V, Greater Noida, UP 201306",
  lat: 28.4859,
  lng: 77.5342,
  ttsDeviceId: "streetlight-01",
  addedAt: new Date().toISOString(),
};

interface DeviceState {
  devices: Device[];

  addDevice: (device: Device) => void;
  removeDevice: (id: string) => void;

  setDevices: (devices: Device[]) => void;

  fetchDevices: () => Promise<void>;
}

export const useDeviceStore = create<DeviceState>()(
  persist(
    (set, get) => ({
      devices: [SEED_DEVICE],

      addDevice: (device) => {
        const exists = get().devices.find(
          (d) => d.id === device.id
        );

        if (!exists) {
          set((state) => ({
            devices: [...state.devices, device],
          }));
        }
      },

      removeDevice: (id) =>
        set((state) => ({
          devices: state.devices.filter(
            (device) => device.id !== id
          ),
        })),

      setDevices: (devices) =>
        set({
          devices,
        }),

      fetchDevices: async () => {
        try {
          const response = await fetch("/api/devices");

          if (!response.ok) {
            throw new Error("Failed to fetch devices");
          }

          const data = await response.json();

          set({
            devices: data,
          });
        } catch (error) {
          console.error(error);
        }
      },
    }),
    {
      name: "device-store",

      partialize: (state) => ({
        devices: state.devices,
      }),
    }
  )
);