import { CustomPaymentModel, CustomPaymentsQuery } from '@/models/customPayment.model';
import CustomPaymentsService from '@/services/custom-payments.service';

import { customPaymentsStore } from './customPayments.store';

// Only the latest request may write the list (fast tab/site/search changes can resolve out of order).
let latestRequest = 0;
let latestQuery: CustomPaymentsQuery = { page: 0 };

export async function getCustomPayments(query: CustomPaymentsQuery): Promise<void> {
  latestRequest += 1;
  latestQuery = query;

  const request = latestRequest;

  customPaymentsStore.isLoading = true;

  const { payload } = await CustomPaymentsService.getCustomPayments(query);

  if (request !== latestRequest) return;

  customPaymentsStore.isLoading = false;
  customPaymentsStore.loadFailed = !payload;
  customPaymentsStore.customPayments = payload?.content ?? [];
  customPaymentsStore.totalPages = payload?.page?.totalPages ?? 0;
  customPaymentsStore.totalReceivedMinor = payload?.totalReceivedMinor ?? 0;
}

export function replaceCustomPayment(row: CustomPaymentModel): void {
  const index = customPaymentsStore.customPayments.findIndex(p => p.id === row.id);

  if (index >= 0) customPaymentsStore.customPayments[index] = row;
}

/** Patches only the note, so a row refreshed meanwhile keeps its new status. */
export function setCustomPaymentNote(id: number, note: string | null): void {
  const row = customPaymentsStore.customPayments.find(p => p.id === id);

  if (row) row.adminNote = note;
}

/**
 * POST /refresh re-reads the payment from Mollie; the returned row replaces the one in the list.
 * A new status or refund also reloads the list, so the status tab and "Total received" stay right.
 */
export async function refreshCustomPayment(id: number): Promise<boolean> {
  const before = customPaymentsStore.customPayments.find(p => p.id === id);
  const oldStatus = before?.status;
  const oldRefunded = before?.refundedAmountMinor ?? 0;

  const { payload } = await CustomPaymentsService.refresh(id);

  if (!payload) return false;

  replaceCustomPayment(payload);

  if (payload.status !== oldStatus || (payload.refundedAmountMinor ?? 0) !== oldRefunded) {
    await getCustomPayments(latestQuery);
  }

  return true;
}

export function openNoteModal(row: CustomPaymentModel): void {
  // Copy: `row` is a frozen valtio snapshot.
  customPaymentsStore.selectedCustomPayment = { ...row };
  customPaymentsStore.noteModalOpen = true;
}

export function closeNoteModal(): void {
  customPaymentsStore.noteModalOpen = false;
  customPaymentsStore.selectedCustomPayment = undefined;
}
