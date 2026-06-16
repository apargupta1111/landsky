import type { LightAsset } from './types';

export const createAssetSlice = (set: any) => ({
  lights: [] as LightAsset[],
  selectedLightId: null as string | null,
  setSelectedLightId: (id: string | null) => set({ selectedLightId: id }),
});