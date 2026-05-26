import { SortDirection } from '@/config/constants.config';
import { InvoiceLanguage, InvoiceStatus, RecipientType } from '@/models/invoices.model';
import InvoicesService from '@/services/invoices.service';

import { invoicesStore } from './invoices.store';

export async function getInvoices(
  page?: number,
  sortBy?: string,
  sortDirection?: SortDirection,
  status?: InvoiceStatus,
  search?: string,
  reservationId?: string,
  recipientType?: RecipientType | string,
  agencyId?: string,
  departureDate?: string,
  language?: InvoiceLanguage
): Promise<void> {
  invoicesStore.isLoading = true;

  const { content, page: contentPage } = await InvoicesService.getInvoices(
    page,
    sortBy,
    sortDirection,
    status,
    search,
    reservationId,
    recipientType,
    language,
    departureDate,
    agencyId
  );

  invoicesStore.isLoading = false;
  invoicesStore.invoices = content;
  invoicesStore.totalCount = contentPage?.totalElements || 0;
}

export async function getSelectedInvoice(id: number): Promise<void> {
  const response = await InvoicesService.getInvoice(id);

  invoicesStore.selectedInvoice = response!;
}

export function findInvoice(index: string): void {
  invoicesStore.selectedInvoice = invoicesStore.invoices[+index];
}

export function isInvoiceForDrafted(index: number): boolean {
  const selectInvoice = invoicesStore.invoices[+index];

  const status = selectInvoice.invoiceStatus;

  return status === InvoiceStatus.DRAFT;
}

export function clearSelectedInvoice(): void {
  invoicesStore.selectedInvoice = undefined;
}

export function toggleUpdateInvoiceModal(isOpen?: boolean | React.MouseEvent): void {
  invoicesStore.updateInvoiceModalOpen = typeof isOpen === 'boolean' ? isOpen : !invoicesStore.updateInvoiceModalOpen;
}

export function toggleMarkAsPaidInvoiceModal(isOpen?: boolean | React.MouseEvent): void {
  invoicesStore.markAsPaidModalOpen = typeof isOpen === 'boolean' ? isOpen : !invoicesStore.markAsPaidModalOpen;
}
