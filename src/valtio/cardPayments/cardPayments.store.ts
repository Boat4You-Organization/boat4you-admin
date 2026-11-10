import { proxy, useSnapshot } from 'valtio';

import { CardPaymentModel } from '@/models/cardPayment.model';

interface CardPaymentsStore {
  cardPayments: CardPaymentModel[];
  totalPages: number;
  totalReceivedMinor: number;
  isLoading: boolean;
  loadFailed: boolean;
}

export const cardPaymentsStore = proxy<CardPaymentsStore>({
  cardPayments: [],
  totalPages: 0,
  totalReceivedMinor: 0,
  isLoading: false,
  loadFailed: false,
});

export const useCardPaymentsStore = (): CardPaymentsStore => useSnapshot(cardPaymentsStore);
