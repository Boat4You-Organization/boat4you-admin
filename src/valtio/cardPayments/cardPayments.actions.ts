import { CardPaymentsQuery } from '@/models/cardPayment.model';
import CardPaymentsService from '@/services/card-payments.service';

import { cardPaymentsStore } from './cardPayments.store';

// Only the latest request may write the list (fast tab/search changes can resolve out of order).
let latestRequest = 0;
let latestQuery: CardPaymentsQuery = { page: 0 };

export async function getCardPayments(query: CardPaymentsQuery): Promise<void> {
  latestRequest += 1;
  latestQuery = query;

  const request = latestRequest;

  cardPaymentsStore.isLoading = true;

  const { payload } = await CardPaymentsService.getCardPayments(query);

  if (request !== latestRequest) return;

  cardPaymentsStore.isLoading = false;
  cardPaymentsStore.loadFailed = !payload;
  cardPaymentsStore.cardPayments = payload?.content ?? [];
  cardPaymentsStore.totalPages = payload?.page?.totalPages ?? 0;
  cardPaymentsStore.totalReceivedMinor = payload?.totalReceivedMinor ?? 0;
}

/**
 * POST /refresh re-reads the payment from Mollie and applies it; the returned row replaces the one in the list.
 * A new status, refund or chargeback also reloads the list, so the status tab and "Total received" stay right.
 */
export async function refreshCardPayment(id: number): Promise<boolean> {
  const before = cardPaymentsStore.cardPayments.find(p => p.id === id);
  const { payload } = await CardPaymentsService.refresh(id);

  if (!payload) return false;

  const index = cardPaymentsStore.cardPayments.findIndex(p => p.id === id);

  if (index >= 0) cardPaymentsStore.cardPayments[index] = payload;

  if (
    payload.status !== before?.status ||
    payload.refundedAmountMinor !== before?.refundedAmountMinor ||
    payload.chargedBackAmountMinor !== before?.chargedBackAmountMinor
  ) {
    await getCardPayments(latestQuery);
  }

  return true;
}
