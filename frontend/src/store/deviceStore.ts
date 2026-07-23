import type { Device } from './types';

const SEED_DEVICES: Device[] = [
  {
    id: 'streetlight-01',
    name: 'Streetlight Node 01',
    address: 'Mallital Road, near Bhimtal Lake, Nainital, Uttarakhand 263136',
    lat: 29.3520,
    lng: 79.5680,
    ttsDeviceId: 'streetlight-01',
    addedAt: new Date().toISOString(),
    wardId: 'ward-1',
  },
  {
    id: 'streetlight-02',
    name: 'Streetlight Node 02',
    address: 'Mallital Bazaar Road, Bhimtal, Uttarakhand 263136',
    lat: 29.3530,
    lng: 79.5690,
    ttsDeviceId: 'streetlight-02',
    addedAt: new Date().toISOString(),
    wardId: 'ward-1',
  },
  {
    id: 'streetlight-03',
    name: 'Streetlight Node 03',
    address: 'Mallital Heights, Bhimtal, Uttarakhand 263136',
    lat: 29.3540,
    lng: 79.5700,
    ttsDeviceId: 'streetlight-03',
    addedAt: new Date().toISOString(),
    wardId: 'ward-1',
  },
  {
    id: 'streetlight-04',
    name: 'Streetlight Node 04',
    address: 'Dak Bangla Road, near Lake View Point, Bhimtal, Uttarakhand 263136',
    lat: 29.3480,
    lng: 79.5710,
    ttsDeviceId: 'streetlight-04',
    addedAt: new Date().toISOString(),
    wardId: 'ward-2',
  },
  {
    id: 'streetlight-05',
    name: 'Streetlight Node 05',
    address: 'Dak Bangla Forest Rest House Rd, Bhimtal, Uttarakhand 263136',
    lat: 29.3470,
    lng: 79.5725,
    ttsDeviceId: 'streetlight-05',
    addedAt: new Date().toISOString(),
    wardId: 'ward-2',
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