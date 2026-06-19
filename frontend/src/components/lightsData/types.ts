// Shared types for the LightsData modal

export interface Light {
  id: string;
  name: string;
  status: 'online' | 'warning' | 'error';
  ttsDeviceId?: string;
}

export interface Schedule {
  id: string;
  lightId: string;
  onTime: string;    // 'HH:mm'
  offTime: string;   // 'HH:mm'
  repeat: 'daily' | 'weekly' | 'custom';
  days: number[];    // 0=Sun … 6=Sat
  isActive: boolean;
  createdAt: string;
}

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
