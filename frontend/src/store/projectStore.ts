import type { Project, Fault } from './types';

const PROJECTS: Project[] = [
  { id: 'chandigarh', name: 'Smart City Chandigarh', gatewayCount: 24, lightCount: 520, onlineLights: 498, faults: 12, status: 'Active' }
];

const FAULTS: Fault[] = [
  { id: 'F-1301', projectId: 'chandigarh', projectName: 'Smart City Chandigarh', gatewayId: 'GW001', poleId: 'Pole-003', type: 'Power Failure', timestamp: '2026-06-10 09:18', status: 'Open', priority: 'High', assignedTo: 'Team Alpha' },
  { id: 'F-1302', projectId: 'chandigarh', projectName: 'Smart City Chandigarh', gatewayId: 'GW003', poleId: 'Pole-005', type: 'Low Brightness', timestamp: '2026-06-10 10:05', status: 'Assigned', priority: 'Medium', assignedTo: 'Team Bravo' },
  { id: 'F-2301', projectId: 'mohali-phase-1', projectName: 'Mohali Phase 1', gatewayId: 'GW006', poleId: 'Pole-006', type: 'Communication Loss', timestamp: '2026-06-10 07:45', status: 'Open', priority: 'High', assignedTo: 'Team Delta' }
];

export const createProjectSlice = (set: any) => ({
  projects: PROJECTS as Project[],
  faults: FAULTS as Fault[],
  selectedProjectId: null as string | null,
  setSelectedProjectId: (id: string | null) => set({ selectedProjectId: id }),
});