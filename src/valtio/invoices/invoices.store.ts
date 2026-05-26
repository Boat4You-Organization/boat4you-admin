import { proxy, useSnapshot } from 'valtio';

import { InvoiceModel } from '@/models/invoices.model';

interface InvoicesStore {
  invoices: InvoiceModel[];
  selectedInvoice?: InvoiceModel;
  totalCount: number;
  isLoading: boolean;
  updateInvoiceModalOpen: boolean;
  markAsPaidModalOpen: boolean;
}

export const invoicesStore = proxy<InvoicesStore>({
  invoices: [],
  selectedInvoice: undefined,
  totalCount: 0,
  isLoading: false,
  updateInvoiceModalOpen: false,
  markAsPaidModalOpen: false,
});

export const useInvoicesStore = (): InvoicesStore => useSnapshot(invoicesStore);
