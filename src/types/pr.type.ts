/* PR module (1:1 pitches from press@boat4you.com to journalists, 4.11.2026): the /admin/pr/** contract (SYSTEM_ADMIN),
 * field for field as Jackson serialises the backend DTOs (domains/pr/dto/PrDtos.kt, camelCase). Instants are ISO
 * date-time strings, LocalDates "YYYY-MM-DD", Long / Int / BigDecimal are numbers. Markets are ISO-3166 alpha-2 (GB,
 * not UK). Type-only file: tests import it through `node --test` type stripping. */

/** OPTED_OUT / DO_NOT_CONTACT never receive mail; CONSENT_REQUESTED / CONSENTED drive the DE and ZA rules. */
export type PrContactStatus = 'ACTIVE' | 'OPTED_OUT' | 'DO_NOT_CONTACT' | 'CONSENT_REQUESTED' | 'CONSENTED';

export type PrStudyStatus = 'DRAFT' | 'LIVE' | 'ARCHIVED';

export type PrPitchTemplate = 'DATA_PITCH' | 'FOLLOW_UP' | 'BLOG_ARTICLE' | 'NEWSJACK' | 'CONSENT_REQUEST';

/** DRAFT -> SENDING is atomic on the backend, so a double click sends once. */
export type PrPitchStatus = 'DRAFT' | 'SENDING' | 'SENT' | 'REPLIED' | 'DECLINED' | 'PUBLISHED' | 'BOUNCED' | 'FAILED';

/** BLOCKED_UNKNOWN = the page refused our bot (403/402/429): not proof the link is gone, so no alert. */
export type PrLinkState =
  | 'OK_FOLLOW'
  | 'OK_NOFOLLOW'
  | 'LINK_MISSING'
  | 'PAGE_GONE'
  | 'BLOCKED_UNKNOWN'
  | 'NOT_CHECKED';

export type PrMentionStatus = 'NEW' | 'ASK_FOR_LINK' | 'ASKED' | 'LINKED' | 'IGNORED';

/** Spring's PagedModel (GET contacts, GET mentions). */
export interface PrPage<T> {
  content: T[];
  page: { size: number; number: number; totalElements: number; totalPages: number };
}

/* ---- Outlets ---- */

export interface PrOutlet {
  id: number;
  name: string;
  market: string;
  tier: number;
  sectionUrl: string | null;
  deskContact: string | null;
  notes: string | null;
  createdAt: string;
}

/** POST needs name, market and tier; PATCH changes only the fields sent (a blank optional text clears it). */
export interface PrOutletRequest {
  name?: string | null;
  market?: string | null;
  tier?: number | null;
  sectionUrl?: string | null;
  deskContact?: string | null;
  notes?: string | null;
}

/* ---- Contacts ---- */

export interface PrContact {
  id: number;
  outletId: number | null;
  outletName: string | null;
  name: string | null;
  role: string | null;
  /** Stored normalised (trimmed, lowercase). */
  email: string;
  market: string | null;
  emailSourceUrl: string | null;
  /** "YYYY-MM-DD". */
  emailFoundOn: string | null;
  status: PrContactStatus;
  recentArticleUrl: string | null;
  notes: string | null;
  lastContactedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** POST needs email (market defaults to the outlet's); PATCH changes only the fields sent (a blank optional text clears
 * it). status may be ACTIVE, DO_NOT_CONTACT, CONSENT_REQUESTED or CONSENTED; OPTED_OUT comes only from opt-out / bounce. */
export interface PrContactRequest {
  outletId?: number | null;
  name?: string | null;
  role?: string | null;
  email?: string | null;
  market?: string | null;
  emailSourceUrl?: string | null;
  /** "YYYY-MM-DD". */
  emailFoundOn?: string | null;
  status?: PrContactStatus | null;
  recentArticleUrl?: string | null;
  notes?: string | null;
}

/** GET /admin/pr/contacts query; backend defaults page 0, size 100. */
export interface PrContactFilter {
  market?: string | null;
  status?: PrContactStatus | null;
  q?: string | null;
  page?: number;
  size?: number;
}

/** created / updated count contacts (an unchanged row counts as neither); skipped = "row N: CODE: detail", one per row. */
export interface PrImportResult {
  created: number;
  updated: number;
  skipped: string[];
}

/* ---- Studies ---- */

/** siteId is one of the 7 BrandRegistry site ids (boat4you, catamaran-croatia, ...). */
export interface PrStudy {
  id: number;
  number: number;
  siteId: string;
  title: string;
  pageUrl: string | null;
  status: PrStudyStatus;
  /** "YYYY-MM-DD". */
  publishedOn: string | null;
  notes: string | null;
  createdAt: string;
}

/** POST needs number, siteId and title (status defaults to DRAFT); PATCH changes only the fields sent. */
export interface PrStudyRequest {
  number?: number | null;
  siteId?: string | null;
  title?: string | null;
  pageUrl?: string | null;
  status?: PrStudyStatus | null;
  /** "YYYY-MM-DD". */
  publishedOn?: string | null;
  notes?: string | null;
}

/* ---- Pitches ---- */

/** One pitch with what the list shows next to it. decision is "ALLOWED" or a PrComplianceRules block code worked out
 * now (decisionLabelKey in utils/pr/format.ts); footer is the text the backend appends to every sent body (read-only). */
export interface PrPitch {
  id: number;
  studyId: number | null;
  contactId: number;
  contactEmail: string;
  contactName: string | null;
  outletName: string | null;
  /** Set on a follow-up: the main pitch it follows. */
  parentPitchId: number | null;
  template: PrPitchTemplate;
  subject: string;
  body: string;
  status: PrPitchStatus;
  decision: string;
  footer: string;
  messageId: string | null;
  sentAt: string | null;
  /** Why the last send failed (status FAILED). */
  error: string | null;
  replyNote: string | null;
  createdAt: string;
  updatedAt: string;
}

/** A new main pitch (FOLLOW_UP is refused here: follow-ups come from POST .../pitches/{id}/follow-up). */
export interface PrPitchDraftRequest {
  studyId?: number | null;
  contactId?: number | null;
  template?: PrPitchTemplate | null;
  subject?: string | null;
  body?: string | null;
}

/** PATCH of a DRAFT: only the fields sent change. */
export interface PrPitchUpdateRequest {
  subject?: string | null;
  body?: string | null;
}

export interface PrFollowUpRequest {
  body?: string | null;
}

/** status is REPLIED, DECLINED, PUBLISHED or BOUNCED after sending, DRAFT only from FAILED (retry); replyNote (typed in
 * by hand) replaces the stored one when given. optOut (with DECLINED or REPLIED only; default false) also opts the
 * contact's address out, as POST .../contacts/{id}/opt-out does. */
export interface PrPitchStatusRequest {
  status?: PrPitchStatus | null;
  replyNote?: string | null;
  optOut?: boolean;
}

export interface PrPitchFilter {
  studyId?: number | null;
  status?: PrPitchStatus | null;
}

/* ---- Placements ---- */

/** An article that used one of our studies, with its last link check. lastHttpStatus is the last hop's status, -1 when
 * nothing was fetched; alert stays true until clear-alert, alertReason e.g. "OK_FOLLOW→LINK_MISSING"; domainRank is
 * Open PageRank (0-10) or null. */
export interface PrPlacement {
  id: number;
  studyId: number | null;
  outletId: number | null;
  outletName: string | null;
  pitchId: number | null;
  articleUrl: string;
  /** "YYYY-MM-DD". */
  publishedOn: string | null;
  targetUrl: string | null;
  anchorText: string | null;
  linkState: PrLinkState;
  lastGoodState: PrLinkState | null;
  lastHttpStatus: number | null;
  lastCheckedAt: string | null;
  alert: boolean;
  alertReason: string | null;
  domainRank: number | null;
  createdAt: string;
}

/** POST needs articleUrl (http/https, unique: 409 PLACEMENT_EXISTS); PATCH changes only the fields sent (a new
 * articleUrl resets the check result). */
export interface PrPlacementRequest {
  studyId?: number | null;
  outletId?: number | null;
  pitchId?: number | null;
  articleUrl?: string | null;
  /** "YYYY-MM-DD". */
  publishedOn?: string | null;
  targetUrl?: string | null;
  anchorText?: string | null;
}

export interface PrPlacementFilter {
  studyId?: number | null;
}

/* ---- Alert feeds and mentions ---- */

/** A Google Alerts / Talkwalker / other RSS or Atom feed read every 6 h; lastError is null when the last run went fine. */
export interface PrAlertFeed {
  id: number;
  name: string;
  url: string;
  enabled: boolean;
  lastFetchedAt: string | null;
  lastError: string | null;
  createdAt: string;
}

/** POST needs name and url (409 FEED_EXISTS); enabled defaults to true. PATCH changes only the fields sent. */
export interface PrAlertFeedRequest {
  name?: string | null;
  url?: string | null;
  enabled?: boolean | null;
}

/** A page that names us, found in a feed. source is GOOGLE_ALERTS, TALKWALKER or RSS; linksToUs is null when the page
 * refused us or could not be fetched. */
export interface PrMention {
  id: number;
  url: string;
  title: string | null;
  source: string;
  feedId: number | null;
  feedName: string | null;
  linksToUs: boolean | null;
  status: PrMentionStatus;
  foundAt: string;
}

export interface PrMentionStatusRequest {
  status?: PrMentionStatus | null;
}

/** GET /admin/pr/mentions query (newest first); backend defaults page 0, size 50. */
export interface PrMentionFilter {
  status?: PrMentionStatus | null;
  linksToUs?: boolean | null;
  page?: number;
  size?: number;
}

/* ---- Pregled ---- */

/** One study's row, counting main pitches only: sent = has sentAt; replied = REPLIED, DECLINED or PUBLISHED. */
export interface PrStudyKpi {
  studyId: number;
  number: number;
  title: string;
  sent: number;
  replied: number;
  published: number;
  placements: number;
}

/** followUpsDue = main pitches still SENT, sent 5 or more days ago, with no follow-up yet. */
export interface PrOverview {
  perStudy: PrStudyKpi[];
  liveFollow: number;
  liveNofollow: number;
  alerts: number;
  mentionsNew: number;
  mentionsUnlinked: number;
  followUpsDue: number;
}
