import type { District, Nagarpalika, Ward, Fault } from './types';

const DISTRICTS: District[] = [
  { id: 'nainital', name: 'Nainital', nagarpalikaCount: 1, wardCount: 9, gatewayCount: 24, lightCount: 520, onlineLights: 498, faults: 12, status: 'Active' },
  { id: 'almora', name: 'Almora', nagarpalikaCount: 0, wardCount: 0, gatewayCount: 0, lightCount: 0, onlineLights: 0, faults: 0, status: 'Active' },
  { id: 'bageshwar', name: 'Bageshwar', nagarpalikaCount: 0, wardCount: 0, gatewayCount: 0, lightCount: 0, onlineLights: 0, faults: 0, status: 'Active' },
  { id: 'chamoli', name: 'Chamoli', nagarpalikaCount: 0, wardCount: 0, gatewayCount: 0, lightCount: 0, onlineLights: 0, faults: 0, status: 'Active' },
  { id: 'champawat', name: 'Champawat', nagarpalikaCount: 0, wardCount: 0, gatewayCount: 0, lightCount: 0, onlineLights: 0, faults: 0, status: 'Active' },
  { id: 'dehradun', name: 'Dehradun', nagarpalikaCount: 0, wardCount: 0, gatewayCount: 0, lightCount: 0, onlineLights: 0, faults: 0, status: 'Active' },
  { id: 'haridwar', name: 'Haridwar', nagarpalikaCount: 0, wardCount: 0, gatewayCount: 0, lightCount: 0, onlineLights: 0, faults: 0, status: 'Active' },
  { id: 'pauri-garhwal', name: 'Pauri Garhwal', nagarpalikaCount: 0, wardCount: 0, gatewayCount: 0, lightCount: 0, onlineLights: 0, faults: 0, status: 'Active' },
  { id: 'pithoragarh', name: 'Pithoragarh', nagarpalikaCount: 0, wardCount: 0, gatewayCount: 0, lightCount: 0, onlineLights: 0, faults: 0, status: 'Active' },
  { id: 'rudraprayag', name: 'Rudraprayag', nagarpalikaCount: 0, wardCount: 0, gatewayCount: 0, lightCount: 0, onlineLights: 0, faults: 0, status: 'Active' },
  { id: 'tehri-garhwal', name: 'Tehri Garhwal', nagarpalikaCount: 0, wardCount: 0, gatewayCount: 0, lightCount: 0, onlineLights: 0, faults: 0, status: 'Active' },
  { id: 'udham-singh-nagar', name: 'Udham Singh Nagar', nagarpalikaCount: 0, wardCount: 0, gatewayCount: 0, lightCount: 0, onlineLights: 0, faults: 0, status: 'Active' },
  { id: 'uttarkashi', name: 'Uttarkashi', nagarpalikaCount: 0, wardCount: 0, gatewayCount: 0, lightCount: 0, onlineLights: 0, faults: 0, status: 'Active' }
];

const NAGARPALIKAS: Nagarpalika[] = [
  { id: 'bhimtal', districtId: 'nainital', name: 'Bhimtal', wardCount: 9, gatewayCount: 24, lightCount: 520, onlineLights: 498, status: 'Active' },
  { id: 'bhowali', districtId: 'nainital', name: 'Bhowali', wardCount: 0, gatewayCount: 0, lightCount: 0, onlineLights: 0, status: 'Active' },
  { id: 'ramnagar', districtId: 'nainital', name: 'Ramnagar', wardCount: 0, gatewayCount: 0, lightCount: 0, onlineLights: 0, status: 'Active' },
  { id: 'lalkua', districtId: 'nainital', name: 'Lalkua', wardCount: 0, gatewayCount: 0, lightCount: 0, onlineLights: 0, status: 'Active' },
  { id: 'kaladhungi', districtId: 'nainital', name: 'Kaladhungi', wardCount: 0, gatewayCount: 0, lightCount: 0, onlineLights: 0, status: 'Active' },
];

const WARDS: Ward[] = [
  { id: 'ward-1', nagarpalikaId: 'bhimtal', name: 'Mallital', gatewayCount: 2, lightCount: 50, onlineLights: 48, status: 'Active' },
  { id: 'ward-2', nagarpalikaId: 'bhimtal', name: 'Dak Bangla', gatewayCount: 3, lightCount: 60, onlineLights: 60, status: 'Active' },
  { id: 'ward-3', nagarpalikaId: 'bhimtal', name: 'Bilaspur', gatewayCount: 2, lightCount: 40, onlineLights: 38, status: 'Active' },
  { id: 'ward-4', nagarpalikaId: 'bhimtal', name: 'Naukuchiatal', gatewayCount: 4, lightCount: 80, onlineLights: 75, status: 'Active' },
  { id: 'ward-5', nagarpalikaId: 'bhimtal', name: 'Tallital', gatewayCount: 3, lightCount: 70, onlineLights: 69, status: 'Active' },
  { id: 'ward-6', nagarpalikaId: 'bhimtal', name: 'Junestate', gatewayCount: 2, lightCount: 50, onlineLights: 50, status: 'Active' },
  { id: 'ward-7', nagarpalikaId: 'bhimtal', name: 'Kuantal', gatewayCount: 3, lightCount: 60, onlineLights: 58, status: 'Active' },
  { id: 'ward-8', nagarpalikaId: 'bhimtal', name: 'Industrial Area', gatewayCount: 4, lightCount: 80, onlineLights: 75, status: 'Active' },
  { id: 'ward-9', nagarpalikaId: 'bhimtal', name: 'Mehragaon', gatewayCount: 1, lightCount: 30, onlineLights: 25, status: 'At Risk' },
];

const FAULTS: Fault[] = [
  { id: 'F-1301', projectId: 'nainital', projectName: 'Nainital', gatewayId: 'GW001', poleId: 'Pole-003', type: 'Power Failure', timestamp: '2026-06-10 09:18', status: 'Open', priority: 'High', assignedTo: 'Team Alpha' },
];

export const createProjectSlice = (set: any) => ({
  districts: DISTRICTS as District[],
  nagarpalikas: NAGARPALIKAS as Nagarpalika[],
  wards: WARDS as Ward[],
  faults: FAULTS as Fault[],
  selectedDistrictId: null as string | null,
  setSelectedDistrictId: (id: string | null) => set({ selectedDistrictId: id }),
  selectedNagarpalikaId: null as string | null,
  setSelectedNagarpalikaId: (id: string | null) => set({ selectedNagarpalikaId: id }),
  selectedWardId: null as string | null,
  setSelectedWardId: (id: string | null) => set({ selectedWardId: id }),
});