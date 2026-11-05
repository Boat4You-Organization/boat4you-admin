/* PR module: labels and timing the screens show next to a pitch or a placement. Pure functions, no React.
 *
 * i18n key form: keys are relative to the 'pr' namespace, used as `const { t } = useTranslation('pr'); t(key)`, the
 * same way the Objave screens use useTranslation('social') with keys inside social.json. The locale file nests them,
 * e.g. { "decision": { "deNoColdEmail": "…" } }.
 *
 * Type-only imports on purpose: tests/pr.test.ts runs this file with plain `node --test` (type stripping). */
import type { PrContactRequest, PrLinkState, PrPitch, PrPitchStatus } from '@/types/pr.type';

/** PrPitchDto.decision values: "ALLOWED" or a PrComplianceRules block code (backend rule order), with their pr keys. */
export const PR_DECISION_LABEL_KEYS = {
  ALLOWED: 'decision.allowed',
  TRIPADVISOR_FORBIDDEN: 'decision.tripadvisorForbidden',
  SUPPRESSED: 'decision.suppressed',
  OPTED_OUT: 'decision.optedOut',
  DO_NOT_CONTACT: 'decision.doNotContact',
  NO_EMAIL_SOURCE: 'decision.noEmailSource',
  MARKET_UNKNOWN: 'decision.marketUnknown',
  MARKET_DE_NO_COLD_EMAIL: 'decision.deNoColdEmail',
  ZA_CONSENT_REQUIRED: 'decision.zaConsentRequired',
  MARKET_NOT_CLEARED: 'decision.marketNotCleared',
  FOLLOWUP_TOO_EARLY: 'decision.followUpTooEarly',
} as const;

export type PrDecisionCode = keyof typeof PR_DECISION_LABEL_KEYS;

/** Every decision code the backend can answer, for building the locale file. */
export const PR_DECISION_CODES = Object.keys(PR_DECISION_LABEL_KEYS) as PrDecisionCode[];

/** For a code this admin does not know yet (a newer backend rule). */
export const PR_DECISION_UNKNOWN_KEY = 'decision.unknown';

export type PrDecisionLabelKey = (typeof PR_DECISION_LABEL_KEYS)[PrDecisionCode] | typeof PR_DECISION_UNKNOWN_KEY;

/** 'pr' namespace key for a pitch's decision (or a 409 send-rule code), e.g. MARKET_DE_NO_COLD_EMAIL → decision.deNoColdEmail. */
export const decisionLabelKey = (code: string): PrDecisionLabelKey =>
  Object.hasOwn(PR_DECISION_LABEL_KEYS, code)
    ? PR_DECISION_LABEL_KEYS[code as PrDecisionCode]
    : PR_DECISION_UNKNOWN_KEY;

export type PrTone = 'success' | 'warning' | 'error' | 'default';

/** MUI Chip colour of a placement's link state. BLOCKED_UNKNOWN is only a warning: the site refused our bot, the link
 * may well be there. */
export const linkStateTone = (state: PrLinkState): PrTone => {
  switch (state) {
    case 'OK_FOLLOW':
      return 'success';
    case 'BLOCKED_UNKNOWN':
      return 'warning';
    case 'LINK_MISSING':
    case 'PAGE_GONE':
      return 'error';
    default:
      return 'default';
  }
};

/** Backend PrComplianceRules.FOLLOW_UP_DELAY. */
const FOLLOW_UP_DELAY_MS = 5 * 24 * 60 * 60 * 1000;

/** UTC calendar day ("YYYY-MM-DD") on which the follow-up may go: sentAt + 5 days; '' for an unreadable date. */
export const followUpDueOn = (sentAtIso: string): string => {
  const sent = Date.parse(sentAtIso);

  return Number.isNaN(sent) ? '' : new Date(sent + FOLLOW_UP_DELAY_MS).toISOString().slice(0, 10);
};

/** now − sentAt ≥ 5 days (exactly 5 days is due), the backend's FOLLOWUP_TOO_EARLY rule; false for an unreadable date. */
export const isFollowUpDue = (sentAtIso: string, nowIso: string): boolean => {
  const sent = Date.parse(sentAtIso);
  const now = Date.parse(nowIso);

  return !Number.isNaN(sent) && !Number.isNaN(now) && now - sent >= FOLLOW_UP_DELAY_MS;
};

/* ---- Pitch actions (which buttons a pitch screen offers; the backend checks every rule again) ---- */

/** The body as the backend sends it (PrFooter.appendTo): trailing whitespace dropped, one empty line, the footer. */
export const sendPreviewText = (pitch: Pick<PrPitch, 'body' | 'footer'>): string =>
  `${pitch.body.trimEnd()}\n\n${pitch.footer}`;

/** Statuses typed in by hand after sending (backend MANUAL_SOURCES → MANUAL_TARGETS without DRAFT). */
const AFTER_SEND_SOURCES: PrPitchStatus[] = ['SENT', 'REPLIED', 'DECLINED', 'PUBLISHED'];

export const AFTER_SEND_TARGETS: PrPitchStatus[] = ['REPLIED', 'DECLINED', 'PUBLISHED', 'BOUNCED'];

export interface PitchActions {
  /** "Pošalji": DRAFT and the decision is ALLOWED, nothing else. */
  canSend: boolean;
  /** The decision code to show as the reason the send is off (a DRAFT that may not go), else null. */
  blockedBy: string | null;
  /** Subject / body can be edited (DRAFT only). */
  canEdit: boolean;
  /** "Follow-up": hidden unless a SENT main pitch without its follow-up; 'wait' before 5 days, 'ready' after. */
  followUp: 'hidden' | 'wait' | 'ready';
  /** "YYYY-MM-DD" from which the follow-up may go ('' when there is none to offer). */
  followUpOn: string;
  /** "Vrati u nacrt": FAILED only, after the warning that the mail may already have arrived. */
  canRetry: boolean;
  /** SENDING: being sent or stuck after a crash; the API never resets it, so no actions at all. */
  stuck: boolean;
  /** Statuses that may be set by hand now (REPLIED, DECLINED, PUBLISHED, BOUNCED), the current one left out. */
  statusTargets: PrPitchStatus[];
}

/** Which actions a pitch offers at `nowIso`; hasFollowUp = some pitch in the list has parentPitchId === pitch.id. */
export const pitchActions = (pitch: PrPitch, hasFollowUp: boolean, nowIso: string): PitchActions => {
  const draft = pitch.status === 'DRAFT';
  const offerFollowUp =
    pitch.status === 'SENT' && pitch.parentPitchId === null && !hasFollowUp && pitch.sentAt !== null;
  let followUp: PitchActions['followUp'] = 'hidden';

  if (offerFollowUp) followUp = isFollowUpDue(pitch.sentAt as string, nowIso) ? 'ready' : 'wait';

  return {
    canSend: draft && pitch.decision === 'ALLOWED',
    blockedBy: draft && pitch.decision !== 'ALLOWED' ? pitch.decision : null,
    canEdit: draft,
    followUp,
    followUpOn: offerFollowUp ? followUpDueOn(pitch.sentAt as string) : '',
    canRetry: pitch.status === 'FAILED',
    stuck: pitch.status === 'SENDING',
    statusTargets: AFTER_SEND_SOURCES.includes(pitch.status) ? AFTER_SEND_TARGETS.filter(s => s !== pitch.status) : [],
  };
};

/** Ids of the main pitches that already have their (one) follow-up. */
export const pitchesWithFollowUp = (pitches: PrPitch[]): Set<number> =>
  new Set(pitches.flatMap(p => (p.parentPitchId === null ? [] : [p.parentPitchId])));

/** Overview "follow-up danas": SENT main pitches, 5+ days old, with no follow-up yet; oldest first. */
export const followUpsDue = (pitches: PrPitch[], nowIso: string): PrPitch[] => {
  const done = pitchesWithFollowUp(pitches);

  return pitches
    .filter(p => pitchActions(p, done.has(p.id), nowIso).followUp === 'ready')
    .sort((a, b) => Date.parse(a.sentAt as string) - Date.parse(b.sentAt as string));
};

/** A rejection whose code is a send rule (shown with decisionLabelKey); null for any other error (shown with
 * errorMessage). ALLOWED is not a block. */
export const blockCodeOf = (error: unknown): PrDecisionCode | null => {
  const code = (error as { code?: unknown } | null | undefined)?.code;

  return typeof code === 'string' && code !== 'ALLOWED' && (PR_DECISION_CODES as string[]).includes(code)
    ? (code as PrDecisionCode)
    : null;
};

export type ContactFormField = 'email' | 'emailSourceUrl' | 'emailFoundOn' | 'market';

/** Fields the manual contact form refuses to save without: the address, where it was found and when (a contact
 * without them can never be mailed), and a market when no outlet gives one. */
export const contactFormMissing = (form: PrContactRequest): ContactFormField[] => {
  const blank = (v: string | null | undefined) => !v || !v.trim();
  const missing: ContactFormField[] = [];

  if (blank(form.email)) missing.push('email');

  if (blank(form.emailSourceUrl)) missing.push('emailSourceUrl');

  if (blank(form.emailFoundOn)) missing.push('emailFoundOn');

  if (form.outletId == null && blank(form.market)) missing.push('market');

  return missing;
};
