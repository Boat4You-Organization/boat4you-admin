import { proxy, useSnapshot } from 'valtio';

import { CustomPaymentModel } from '@/models/customPayment.model';

interface CustomPaymentsStore {
  customPayments: CustomPaymentModel[];
  selectedCustomPayment?: CustomPaymentModel;
  totalPages: number;
  totalReceivedMinor: number;
  isLoading: boolean;
  loadFailed: boolean;
  noteModalOpen: boolean;
}

export const customPaymentsStore = proxy<CustomPaymentsStore>({
  customPayments: [],
  selectedCustomPayment: undefined,
  totalPages: 0,
  totalReceivedMinor: 0,
  isLoading: false,
  loadFailed: false,
  noteModalOpen: false,
});

export const useCustomPaymentsStore = (): CustomPaymentsStore => useSnapshot(customPaymentsStore);
