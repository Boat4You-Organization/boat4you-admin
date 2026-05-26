import { proxy, useSnapshot } from 'valtio';

import { ExtrasModel } from '@/models/extras.model';

interface ExtrasStore {
  extras: ExtrasModel[];
  selectedExtras?: ExtrasModel;
  totalCount: number;
  isLoading: boolean;
}

export const extrasStore = proxy<ExtrasStore>({
  extras: [],
  selectedExtras: undefined,
  totalCount: 0,
  isLoading: false,
});

export const useExtrasStore = (): ExtrasStore => useSnapshot(extrasStore);
