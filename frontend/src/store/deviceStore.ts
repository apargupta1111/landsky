import type { Device } from './types';

const SEED_DEVICES: Device[] = [
  {
    id: 'streetlight-01',
    name: 'Streetlight Node 01',
    address: 'Plot B-6/5, Surajpur Site V, Greater Noida, UP 201306',
    lat: 28.4859,
    lng: 77.5342,
    ttsDeviceId: 'streetlight-01',
    addedAt: new Date().toISOString(),
  },
  {
    id: 'streetlight-02',
    name: 'Streetlight Node 02',
    address: 'Plot B-6/5, Surajpur Site V, Greater Noida, UP 201306',
    lat: 28.4860,
    lng: 77.5343,
    ttsDeviceId: 'streetlight-02',
    addedAt: new Date().toISOString(),
  },
  {
    id: 'streetlight-03',
    name: 'Streetlight Node 03',
    address: 'Plot B-6/5, Surajpur Site V, Greater Noida, UP 201306',
    lat: 28.4861,
    lng: 77.5344,
    ttsDeviceId: 'streetlight-03',
    addedAt: new Date().toISOString(),
  },
  {
    id: 'streetlight-04',
    name: 'Streetlight Node 04',
    address: 'Plot B-6/5, Surajpur Site V, Greater Noida, UP 201306',
    lat: 28.4862,
    lng: 77.5345,
    ttsDeviceId: 'streetlight-04',
    addedAt: new Date().toISOString(),
  },
  {
    id: 'streetlight-05',
    name: 'Streetlight Node 05',
    address: 'Plot B-6/5, Surajpur Site V, Greater Noida, UP 201306',
    lat: 28.4863,
    lng: 77.5346,
    ttsDeviceId: 'streetlight-05',
    addedAt: new Date().toISOString(),
  },
];

export const createDeviceSlice = (set: any, get: any) => ({
  devices: SEED_DEVICES as Device[],
  addDevice: (device: Device) => {
    const existing = get().devices.find((d: Device) => d.id === device.id);
    if (!existing) set((s: any) => ({ devices: [...s.devices, device] }));
  },
  removeDevice: (id: string) => 
    set((s: any) => ({ devices: s.devices.filter((d: Device) => d.id !== id) })),
});