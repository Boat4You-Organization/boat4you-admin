/* PR module: labels and timing the screens show next to a pitch or a placement. Pure functions, no React.
 *
 * i18n key form: keys are relative to the 'pr' namespace, used as `const { t } = useTranslation('pr'); t(key)`, the
 * same way the Objave screens use useTranslation('social') with keys inside social.json. The locale file nests them,
 * e.g. { "decision": { "deNoColdEmail": "…" } }.
 *
 * Type-only imports on purpose: tests/pr.test.ts runs this file with plain `node --test` (type stripping). */
import type { PrLinkState } from '@/types/pr.type';

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
