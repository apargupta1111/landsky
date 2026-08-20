import type { Device } from './types';
import { fetchWithAuth } from '../utils/api';

// Get Server IP from environment variable
const SERVER_IP = import.meta.env.VITE_SERVER_IP || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5001` : 'http://localhost:5001');

export const createDeviceSlice = (set: any, get: any) => ({
  devices: [] as Device[],
  isLoadingDevices: false,
  deviceFetchError: null as string | null,

  fetchDevices: async () => {
    set({ isLoadingDevices: true, deviceFetchError: null });
    try {
      const response = await fetchWithAuth(`${SERVER_IP}/api/devices`);
      if (!response.ok) {
        throw new Error(`Server returned HTTP Error Status: ${response.status}`);
      }

      const items = await response.json();
      if (!Array.isArray(items)) throw new Error('Unexpected API payload shape for devices');

      // The backend returns formatted devices matching the Device interface
      set({ devices: items, isLoadingDevices: false, deviceFetchError: `DEBUG_SUCCESS: fetched ${items.length} devices.` });
    } catch (error: any) {
      set({
        deviceFetchError: error.message || 'error retrieving devices',
        isLoadingDevices: false
      });
    }
  },

  addDevice: (device: Device) => {
    const existing = get().devices.find((d: Device) => d.id === device.id);
    if (!existing) set((s: any) => ({ devices: [...s.devices, device] }));
  },
  removeDevice: (id: string) => 
    set((s: any) => ({ devices: s.devices.filter((d: Device) => d.id !== id) })),
});