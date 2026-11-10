import type { StatusVariant } from '@/styles/bb';

/** Card payments of online bookings (Mollie hosted checkout): one row = one checkout attempt. */
export enum CardPaymentStatus {
  PENDING = 'PENDING',
  SUPERSEDED = 'SUPERSEDED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  NEEDS_REVIEW = 'NEEDS_REVIEW',
}

// Same bbStatusPill variants as the custom payments list; SUPERSEDED is still payable at Mollie, so amber.
export const CARD_PAYMENT_STATUS_PILL: Record<CardPaymentStatus, StatusVariant> = {
  [CardPaymentStatus.COMPLETED]: 'paid',
  [CardPaymentStatus.PENDING]: 'pending',
  [CardPaymentStatus.SUPERSEDED]: 'pending',
  [CardPaymentStatus.NEEDS_REVIEW]: 'overdue',
  [CardPaymentStatus.FAILED]: 'ended',
  [CardPaymentStatus.CANCELLED]: 'ended',
};

/** Status tabs of the "Booking payments" list → the backend `status` filter (comma-separated). */
export const CARD_PAYMENT_FILTERS = {
  all: [],
  paid: [CardPaymentStatus.COMPLETED],
  open: [CardPaymentStatus.PENDING, CardPaymentStatus.SUPERSEDED],
  notPaid: [CardPaymentStatus.FAILED, CardPaymentStatus.CANCELLED],
  review: [CardPaymentStatus.NEEDS_REVIEW],
} as const satisfies Record<string, readonly CardPaymentStatus[]>;

export type CardPaymentFilter = keyof typeof CARD_PAYMENT_FILTERS;

export interface CardPaymentModel {
  id: number;
  createdAt: string;
  completedAt: string | null;
  expiresAt: string;
  status: CardPaymentStatus;
  reservationId: number | null;
  reservationNumber: string | null;
  /** Booking number as sent to Mollie; the label when reservationNumber is null. */
  reference: string;
  clientName: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
  baseAmountMinor: number;
  surchargeAmountMinor: number;
  amountMinor: number;
  refundedAmountMinor: number;
  chargedBackAmountMinor: number;
  currency: string;
  /** Mollie payment id, tr_… */
  providerOrderId: string;
  /** 'KLARNA' when the checkout offered Klarna; 'CARD' (cards, Apple Pay) otherwise. Absent from an older backend. */
  method?: 'CARD' | 'KLARNA';
  payFullAmount: boolean;
  phaseIds: number[];
  reviewReason: string | null;
  /** FAILED = paid, but confirming the booking failed: the office confirms it by hand. */
  promoteState: 'PENDING' | 'DONE' | 'FAILED' | null;
  lastCheckedAt: string | null;
}

export interface CardPaymentsPage {
  content: CardPaymentModel[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
  totalReceivedMinor: number;
}

export interface CardPaymentsQuery {
  page: number;
  size?: number;
  statuses?: readonly CardPaymentStatus[];
  q?: string;
  reservationId?: number;
}

/** Live read of one Mollie payment (GET /admin/mollie-payments/{id}); `status` is Mollie's own. */
export interface MolliePaymentDetails {
  id: string;
  mode: string | null;
  status: string;
  method: string | null;
  description: string | null;
  amountMinor: number;
  refundedAmountMinor: number;
  chargedBackAmountMinor: number;
  currency: string;
  createdAt: string | null;
  paidAt: string | null;
  expiresAt: string | null;
  expiredAt: string | null;
  failedAt: string | null;
  canceledAt: string | null;
  cardLabel: string | null;
  cardLast4: string | null;
  cardCountryCode: string | null;
  cardFunding: string | null;
  cardAudience: string | null;
  feeRegion: string | null;
  failureReason: string | null;
  failureMessage: string | null;
  refunds: { id: string; amountMinor: number; status: string; createdAt: string | null; description: string | null }[];
  chargebacks: { id: string; amountMinor: number; createdAt: string | null; reason: string | null }[];
}

/** The payment in the Mollie dashboard (organisation Cusmanich d.o.o.). */
export const molliePaymentUrl = (paymentId: string): string =>
  `https://my.mollie.com/dashboard/org_19333861/payments/${encodeURIComponent(paymentId)}`;
