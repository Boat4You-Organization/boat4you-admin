/* PR module: one call per /admin/pr endpoint (SYSTEM_ADMIN, backend AdminPrController). The backend checks every send
 * rule again (PrComplianceRules) and owns the mail footer; the admin never sends mail itself.
 *
 * Type-only imports on purpose (like social.api.ts): pr.service.ts binds it to the admin's axios instance and
 * tests/pr.test.ts runs it with plain `node --test`. Errors: the axios interceptor rejects with the response body
 * ({code, message}: 400 / 404 / 409), so callers show errorMessage(e, fallback) from yacht-media.api.ts. */
import type { AxiosInstance } from 'axios';

import type {
  PrAlertFeed,
  PrAlertFeedRequest,
  PrContact,
  PrContactFilter,
  PrContactRequest,
  PrFollowUpRequest,
  PrImportResult,
  PrMention,
  PrMentionFilter,
  PrMentionStatusRequest,
  PrOutlet,
  PrOutletRequest,
  PrOverview,
  PrPage,
  PrPitch,
  PrPitchDraftRequest,
  PrPitchFilter,
  PrPitchStatusRequest,
  PrPitchUpdateRequest,
  PrPlacement,
  PrPlacementFilter,
  PrPlacementRequest,
  PrStudy,
  PrStudyRequest,
} from '@/types/pr.type';

const BASE = '/admin/pr';

/** Drops empty filters so the query string carries only the ones in use (false and 0 stay). */
const params = (f: object) =>
  Object.fromEntries(Object.entries(f).filter(([, v]) => v !== undefined && v !== null && v !== ''));

export const createPrApi = (api: AxiosInstance) => ({
  /* ---- Pregled ---- */
  overview: () => api.get<PrOverview>(`${BASE}/overview`).then(r => r.data),

  /* ---- Outlets ---- */
  outlets: () => api.get<PrOutlet[]>(`${BASE}/outlets`).then(r => r.data),

  createOutlet: (body: PrOutletRequest) => api.post<PrOutlet>(`${BASE}/outlets`, body).then(r => r.data),

  updateOutlet: (id: number, body: PrOutletRequest) =>
    api.patch<PrOutlet>(`${BASE}/outlets/${id}`, body).then(r => r.data),

  /* ---- Contacts ---- */
  contacts: (filter: PrContactFilter) =>
    api.get<PrPage<PrContact>>(`${BASE}/contacts`, { params: params(filter) }).then(r => r.data),

  createContact: (body: PrContactRequest) => api.post<PrContact>(`${BASE}/contacts`, body).then(r => r.data),

  updateContact: (id: number, body: PrContactRequest) =>
    api.patch<PrContact>(`${BASE}/contacts/${id}`, body).then(r => r.data),

  /** The CSV file's text as the body (UTF-8, header row first); UK and English country names become ISO codes. */
  importContacts: (csv: string) =>
    api
      .post<PrImportResult>(`${BASE}/contacts/import`, csv, { headers: { 'Content-Type': 'text/csv' } })
      .then(r => r.data),

  /** Puts the address on the suppression list (MANUAL): every contact with that address stops receiving mail. */
  optOut: (id: number) => api.post<PrContact>(`${BASE}/contacts/${id}/opt-out`).then(r => r.data),

  /** Same as optOut, with reason BOUNCE. */
  bounce: (id: number) => api.post<PrContact>(`${BASE}/contacts/${id}/bounce`).then(r => r.data),

  /* ---- Studies ---- */
  studies: () => api.get<PrStudy[]>(`${BASE}/studies`).then(r => r.data),

  createStudy: (body: PrStudyRequest) => api.post<PrStudy>(`${BASE}/studies`, body).then(r => r.data),

  updateStudy: (id: number, body: PrStudyRequest) =>
    api.patch<PrStudy>(`${BASE}/studies/${id}`, body).then(r => r.data),

  /* ---- Pitches ---- */
  pitches: (filter: PrPitchFilter) =>
    api.get<PrPitch[]>(`${BASE}/pitches`, { params: params(filter) }).then(r => r.data),

  createPitch: (body: PrPitchDraftRequest) => api.post<PrPitch>(`${BASE}/pitches`, body).then(r => r.data),

  /** Subject / body of a DRAFT only (409 PITCH_NOT_DRAFT otherwise). */
  updatePitch: (id: number, body: PrPitchUpdateRequest) =>
    api.patch<PrPitch>(`${BASE}/pitches/${id}`, body).then(r => r.data),

  /** The follow-up draft of a sent main pitch (409 FOLLOWUP_NOT_ALLOWED / FOLLOWUP_EXISTS). */
  followUp: (id: number, body: PrFollowUpRequest) =>
    api.post<PrPitch>(`${BASE}/pitches/${id}/follow-up`, body).then(r => r.data),

  /** REPLIED / DECLINED / PUBLISHED / BOUNCED after sending; DRAFT only from FAILED (the retry). */
  setPitchStatus: (id: number, body: PrPitchStatusRequest) =>
    api.patch<PrPitch>(`${BASE}/pitches/${id}/status`, body).then(r => r.data),

  /** Sends the pitch from press@ now. Rejects (409) with MAIL_DISABLED, MAIL_NOT_CONFIGURED, a send-rule code or
   * ALREADY_SENDING_OR_SENT. An SMTP failure is NOT a rejection: it answers 200 with the pitch in status FAILED and
   * `error` set, so the caller must branch on the returned pitch's status (SENT vs FAILED). */
  send: (id: number) => api.post<PrPitch>(`${BASE}/pitches/${id}/send`).then(r => r.data),

  /* ---- Placements ---- */
  placements: (filter: PrPlacementFilter) =>
    api.get<PrPlacement[]>(`${BASE}/placements`, { params: params(filter) }).then(r => r.data),

  /** 409 PLACEMENT_EXISTS for an article already listed; the page is not fetched here (checkPlacement does that). */
  createPlacement: (body: PrPlacementRequest) => api.post<PrPlacement>(`${BASE}/placements`, body).then(r => r.data),

  updatePlacement: (id: number, body: PrPlacementRequest) =>
    api.patch<PrPlacement>(`${BASE}/placements/${id}`, body).then(r => r.data),

  /** "Provjeri sad": the backend fetches the article now (up to ~15 s) and stores the result. */
  checkPlacement: (id: number) => api.post<PrPlacement>(`${BASE}/placements/${id}/check`).then(r => r.data),

  clearPlacementAlert: (id: number) => api.post<PrPlacement>(`${BASE}/placements/${id}/clear-alert`).then(r => r.data),

  /* ---- Alert feeds and mentions ---- */
  feeds: () => api.get<PrAlertFeed[]>(`${BASE}/feeds`).then(r => r.data),

  createFeed: (body: PrAlertFeedRequest) => api.post<PrAlertFeed>(`${BASE}/feeds`, body).then(r => r.data),

  updateFeed: (id: number, body: PrAlertFeedRequest) =>
    api.patch<PrAlertFeed>(`${BASE}/feeds/${id}`, body).then(r => r.data),

  mentions: (filter: PrMentionFilter) =>
    api.get<PrPage<PrMention>>(`${BASE}/mentions`, { params: params(filter) }).then(r => r.data),

  setMentionStatus: (id: number, body: PrMentionStatusRequest) =>
    api.patch<PrMention>(`${BASE}/mentions/${id}`, body).then(r => r.data),
});

export type PrApi = ReturnType<typeof createPrApi>;
