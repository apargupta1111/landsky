export interface Device {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  ttsDeviceId: string;
  addedAt: string;
  wardId?: string;
  
  // Database fields
  dbId?: number;
  serialNumber?: string;
  poleNumber?: string;
  connectionStatus?: string;
  faultStatus?: string;
  lastSeenTime?: string;
  totalPowerSavedKwh?: number;
}

export interface District {
  id: string;
  name: string;
  nagarpalikaCount: number;
  wardCount: number;
  gatewayCount: number;
  lightCount: number;
  onlineLights: number;
  faults: number;
  status: 'Active' | 'At Risk';
}

export interface Nagarpalika {
  id: string;
  districtId: string;
  name: string;
  wardCount: number;
  gatewayCount: number;
  lightCount: number;
  onlineLights: number;
  status: 'Active' | 'At Risk';
}

export interface Ward {
  id: string;
  nagarpalikaId: string;
  name: string;
  gatewayCount: number;
  lightCount: number;
  onlineLights: number;
  status: 'Active' | 'At Risk';
}

export interface Gateway {
  eui: string;
  tenantId: number;
  name: string;
  description: string;
  region: string;
  connectionStatus: boolean;
  lastSeen: string;
  location: { x: number; y: number };
  installedAt: string;
  installedBy: number;
  createdAt: string;
  updatedAt: string;
  id: string;
  wardId: string;
  districtId: string;
  connectedLights: number;
  onlineLights: number;
  faults: number;
  signal: number;
  status: 'Online' | 'Warning' | 'Offline';
  lat: number;
  lng: number;
}

export interface LightAsset {
  id: string;
  gatewayId: string;
  name: string;
  brightness: number;
  power: number;
  status: 'Online' | 'Offline' | 'Warning';
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

export interface Fault {
  id: string;
  wardId: string;
  wardName: string;
  gatewayId: string;
  poleId: string;
  type: string;
  timestamp: string;
  status: 'Open' | 'Assigned' | 'Resolved';
  priority: 'High' | 'Medium' | 'Low';
  assignedTo: string;
}

export interface TelemetrySnapshot {
  ts: number;
  brightness: number;
  power: number;
  temp: number;
  voltage: number;
  current: number;
}

export interface ApiGatewayItem {
  eui: string;
  tenantId: number;
  name: string;
  description: string;
  region: string;
  connectionStatus: boolean;
  lastSeen: string;
  location?: { x: number; y: number };
  installedAt?: string;
  installedBy?: number;
  createdAt?: string;
  updatedAt?: string;
  connectedLights?: number;
  onlineLights?: number;
  faults?: number;
  signal?: number;
}

export type Page =
  | 'dashboard'
  | 'projects'
  | 'nagarpalikas'
  | 'nagarpalikaDetails'
  | 'wards'
  | 'wardDetails'
  | 'gateways'
  | 'analytics'
  | 'settings'
  | 'faults'
  | 'organization'
  | 'projectDetails'
  | 'gatewayDetails';
