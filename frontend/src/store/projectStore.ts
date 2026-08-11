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
  { id: 'ward-1', nagarpalikaId: 'bhimtal', name: 'Mallital', gatewayCount: 0, lightCount: 0, onlineLights: 0, status: 'Active' },
  { id: 'ward-2', nagarpalikaId: 'bhimtal', name: 'Dak Bangla', gatewayCount: 0, lightCount: 0, onlineLights: 0, status: 'Active' },
  { id: 'ward-3', nagarpalikaId: 'bhimtal', name: 'Bilaspur', gatewayCount: 0, lightCount: 0, onlineLights: 0, status: 'Active' },
  { id: 'ward-4', nagarpalikaId: 'bhimtal', name: 'Naukuchiatal', gatewayCount: 0, lightCount: 0, onlineLights: 0, status: 'Active' },
  { id: 'ward-5', nagarpalikaId: 'bhimtal', name: 'Tallital', gatewayCount: 0, lightCount: 0, onlineLights: 0, status: 'Active' },
  { id: 'ward-6', nagarpalikaId: 'bhimtal', name: 'Junestate', gatewayCount: 0, lightCount: 0, onlineLights: 0, status: 'Active' },
  { id: 'ward-7', nagarpalikaId: 'bhimtal', name: 'Kuantal', gatewayCount: 0, lightCount: 0, onlineLights: 0, status: 'Active' },
  { id: 'ward-8', nagarpalikaId: 'bhimtal', name: 'Industrial Area', gatewayCount: 0, lightCount: 0, onlineLights: 0, status: 'Active' },
  { id: 'ward-9', nagarpalikaId: 'bhimtal', name: 'Mehragaon', gatewayCount: 0, lightCount: 0, onlineLights: 0, status: 'At Risk' },
];

const FAULTS: Fault[] = [
  { id: 'F-1301', wardId: 'ward-1', wardName: 'Mallital', gatewayId: 'GW001', poleId: 'Pole-003', type: 'Power Failure', timestamp: '2026-06-10 09:18', status: 'Open', priority: 'High', assignedTo: 'Team Alpha' },
];

export const createProjectSlice = (set: any) => ({
  districts: DISTRICTS as District[],
  nagarpalikas: NAGARPALIKAS as Nagarpalika[],
  wards: WARDS as Ward[],
  faults: [] as Fault[],
  isLoadingFaults: false,
  fetchFaults: async () => {
    set({ isLoadingFaults: true });
    try {
      const SERVER_IP = import.meta.env.VITE_SERVER_IP || 'http://localhost:3000';
      const res = await fetch(`${SERVER_IP}/api/alerts?status=active`);
      if (res.ok) {
        const data = await res.json();
        const mappedFaults: Fault[] = data.map((alert: any) => ({
          id: `F-${alert.id}`,
          wardId: 'ward-1', // Mocked or derived from real topology if available
          wardName: 'Unassigned Ward',
          gatewayId: 'Unknown GW',
          poleId: alert.light_name || `Light-${alert.light_id}`,
          type: alert.alert_type,
          timestamp: new Date(alert.created_at).toLocaleString(),
          status: alert.status === 'active' ? 'Open' : alert.status === 'acknowledged' ? 'Assigned' : 'Resolved',
          priority: alert.severity === 'high' ? 'High' : alert.severity === 'medium' ? 'Medium' : 'Low',
          assignedTo: alert.acknowledged_by ? `User ${alert.acknowledged_by}` : 'Unassigned',
        }));
        set({ faults: mappedFaults });
      }
    } catch (error) {
      console.error('Failed to fetch faults', error);
    } finally {
      set({ isLoadingFaults: false });
    }
  },
  selectedDistrictId: null as string | null,
  setSelectedDistrictId: (id: string | null) => set({ selectedDistrictId: id }),
  selectedNagarpalikaId: null as string | null,
  setSelectedNagarpalikaId: (id: string | null) => set({ selectedNagarpalikaId: id }),
  selectedWardId: null as string | null,
  setSelectedWardId: (id: string | null) => set({ selectedWardId: id }),
});