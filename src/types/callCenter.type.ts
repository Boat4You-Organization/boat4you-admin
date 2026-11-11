/* Call centar (AI call centre "Nika", design §2.5): the shapes of /admin/calls, named exactly as the backend DTOs
 * (AdminCallDtos.kt). */

export const CALL_STATUSES = [
  'SCHEDULED',
  'DIALING',
  'IN_PROGRESS',
  'DONE',
  'NO_ANSWER',
  'BUSY',
  'VOICEMAIL',
  'FAILED',
  'CANCELLED',
  'SKIPPED',
] as const;

export const CALL_OUTCOMES = [
  'CONFIRMED',
  'WANTS_CHANGES',
  'READY_TO_BOOK',
  'TRANSFERRED',
  'CALL_BACK',
  'NOT_INTERESTED',
  'BOOKED_ELSEWHERE',
  'DO_NOT_CALL',
  'NO_CONSENT_TO_RECORD',
  'UNCLEAR',
] as const;

export const CALL_KINDS = ['CONFIRMATION', 'FOLLOW_UP', 'MANUAL', 'HUMAN_CALLBACK'] as const;

export type CallStatus = (typeof CALL_STATUSES)[number];
export type CallOutcome = (typeof CALL_OUTCOMES)[number];
export type CallKind = (typeof CALL_KINDS)[number];

export interface CallListItem {
  id: number;
  inquiryId: number;
  kind: CallKind | null;
  attempt: number;
  status: CallStatus | null;
  outcome: CallOutcome | null;
  skipReason: string | null;
  site: string | null;
  clientName: string;
  phone: string | null;
  language: string | null;
  scheduledAt: string | null;
  startedAt: string | null;
  durationSecs: number | null;
  summary: string | null;
  qualityFailed: boolean;
}

export interface CallInquiry {
  id: number;
  createdAt: string | null;
  site: string | null;
  locale: string | null;
  yachtLabel: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  email: string | null;
  phone: string | null;
  phoneE164: string | null;
  message: string | null;
  details: Record<string, unknown> | null;
  contactConsent: boolean;
  consentTextVersion: string | null;
  doNotCall: boolean;
  offerSentAt: string | null;
  offerNote: string | null;
  humanTakeoverAt: string | null;
}

export interface TranscriptTurn {
  role?: string | null;
  message?: string | null;
  time_in_call_secs?: number | null;
  tools?: unknown[] | null;
}

export interface QualityResult {
  result?: string | null;
  rationale?: string | null;
}

export interface CallDetail {
  call: CallListItem;
  data: Record<string, unknown> | null;
  transcript: TranscriptTurn[] | null;
  quality: Record<string, QualityResult> | null;
  terminationReason: string | null;
  costCredits: number | null;
  conversationId: string | null;
  callSid: string | null;
  hasAudio: boolean;
  inquiry: CallInquiry;
  calls: CallListItem[];
}

export interface CallInquiryListItem {
  inquiry: CallInquiry;
  lastCallStatus: CallStatus | null;
  lastOutcome: CallOutcome | null;
  nextScheduledAt: string | null;
}

/** Spring's PagedModel. */
export interface Paged<T> {
  content: T[];
  page: { size: number; number: number; totalElements: number; totalPages: number };
}

export interface CallFilter {
  status?: string;
  outcome?: string;
  site?: string;
  kind?: string;
  from?: string;
  to?: string;
  q?: string;
  page: number;
  size: number;
}

export type CallSettings = Record<string, string>;
