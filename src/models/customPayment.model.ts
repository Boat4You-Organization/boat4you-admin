import type { StatusVariant } from '@/styles/bb';

/** Payments made through the secret /pay/<linkKey> page on the 7 sites (Mollie hosted checkout). */
export enum CustomPaymentStatus {
  COMPLETED = 'COMPLETED',
  PENDING = 'PENDING',
  NEEDS_REVIEW = 'NEEDS_REVIEW',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export const CUSTOM_PAYMENT_STATUS_ARRAY = Object.values(CustomPaymentStatus);

/** English fallbacks; the translations live in locales/<lng>/custom-payments.json under `status`. */
export const CUSTOM_PAYMENT_STATUS_LABEL_MAP: Record<CustomPaymentStatus, string> = {
  [CustomPaymentStatus.COMPLETED]: 'Completed',
  [CustomPaymentStatus.PENDING]: 'Pending',
  [CustomPaymentStatus.NEEDS_REVIEW]: 'Needs review',
  [CustomPaymentStatus.FAILED]: 'Failed',
  [CustomPaymentStatus.CANCELLED]: 'Cancelled',
};

// bbStatusPill variants: paid = green, pending = amber, overdue = red, ended = grey
// (the `cancelled` variant is red, so CANCELLED uses the grey `ended`).
export const CUSTOM_PAYMENT_STATUS_PILL: Record<CustomPaymentStatus, StatusVariant> = {
  [CustomPaymentStatus.COMPLETED]: 'paid',
  [CustomPaymentStatus.PENDING]: 'pending',
  [CustomPaymentStatus.NEEDS_REVIEW]: 'overdue',
  [CustomPaymentStatus.FAILED]: 'ended',
  [CustomPaymentStatus.CANCELLED]: 'ended',
};

/** Site keys as the backend sends them (CustomPaymentSites.kt), with the brand shown in the list. */
export const CUSTOM_PAYMENT_SITES = [
  { key: 'boat4you', label: 'Boat4You' },
  { key: 'catamaran-charter-greece', label: 'Catamaran Charter Greece' },
  { key: 'catamaran-croatia-charter', label: 'Catamaran Charter Croatia' },
  { key: 'catamarancharteritaly', label: 'Catamaran Charter Italy' },
  { key: 'catamaran-charter-caribbean', label: 'Catamaran Charter Caribbean' },
  { key: 'europe-yachts', label: 'Europe Yachts Charter' },
  { key: 'croatia-yachting', label: 'Yacht Charter Croatia' },
] as const;

export const customPaymentSiteLabel = (site: string): string =>
  CUSTOM_PAYMENT_SITES.find(s => s.key === site)?.label ?? site;

export interface CustomPaymentModel {
  id: number;
  site: string;
  createdAt: string;
  completedAt: string | null;
  reference: string;
  amountMinor: number;
  refundedAmountMinor: number | null;
  currency: string;
  status: CustomPaymentStatus;
  payerEmail: string;
  providerOrderId: string | null;
  /** 'KLARNA' or 'CARD' (cards, Apple Pay, Pay by Bank). Absent from an older backend. */
  method?: 'CARD' | 'KLARNA';
  adminNote: string | null;
  reservationId: number | null;
  reservationNumber: string | null;
}

export interface CustomPaymentsPage {
  content: CustomPaymentModel[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
  totalReceivedMinor: number;
}

export interface CustomPaymentsQuery {
  page: number;
  status?: CustomPaymentStatus;
  site?: string;
  q?: string;
}
