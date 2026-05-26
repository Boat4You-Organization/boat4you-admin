import { proxy, useSnapshot } from 'valtio';

import { CustomYachtModel, CustomYachtModelShortInfo } from '@/models/custom-yacht.model';

interface CustomYachtsStore {
  customYachts: CustomYachtModelShortInfo[];
  selectedCustomYacht?: CustomYachtModel;
  totalCount: number;
  isLoading: boolean;
  createCustomYachtModalOpen: boolean;
  updateCustomYachtModalOpen: boolean;
  deleteCustomYachtModalOpen: boolean;
}

export const customYachtsStore = proxy<CustomYachtsStore>({
  customYachts: [],
  selectedCustomYacht: undefined,
  totalCount: 0,
  isLoading: false,
  createCustomYachtModalOpen: false,
  updateCustomYachtModalOpen: false,
  deleteCustomYachtModalOpen: false,
});

export const useCustomYachtsStore = (): CustomYachtsStore => useSnapshot(customYachtsStore);
