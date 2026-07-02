import { api } from '@/config/axios.config';
import { SortDirection } from '@/config/constants.config';
import { ReservationModel, ReservationModelShortInfo, ReservationSysStatus } from '@/models/booking.model';
import { ErrorModel } from '@/models/error.model';
import { PaginatedResponse, PayloadResponse } from '@/types/response.type';
import { createQueryParamsWithPage } from '@/utils/static/queryParams';
import { showToast } from '@/valtio/global/global.actions';

export interface YachtSwapInfoAdminDto {
  detectedAt: string;
  previousYachtId: number;
  previousYachtName: string | null;
  newYachtId: number | null;
  newYachtName: string | null;
  action: 'LOGGED_ONLY' | 'AUTO_UPDATED' | 'MANUAL_REVIEW';
  acknowledged: boolean;
  notes: string | null;
}

/** Admin-only document attachment metadata (no BYTEA on the wire — fetched
 *  per-row via the download endpoint). Returned by the documents listing
 *  endpoint and rendered under the booking detail "Charter agreement" block. */
export interface ReservationDocumentDto {
  id: number;
  reservationId: number;
  filename: string;
  contentType: string;
  sizeBytes: number;
  uploadedBy: number | null;
  /** ISO-8601 timestamp from the backend `Instant`. */
  uploadedAt: string;
  /** True = admin-only (hidden from customer my-bookings sidebar). */
  isInternal: boolean;
  /** BOARDING_PASS | CREW_LIST | CONTRACT | OTHER — drives the customer-facing label. */
  documentType: ReservationDocumentType;
}

export type ReservationDocumentType = 'BOARDING_PASS' | 'CREW_LIST' | 'CONTRACT' | 'OTHER';

export interface DashboardMetricsDto {
  bookingsThisWeek: number;
  bookingsThisMonth: number;
  confirmedReservations: number;
  /** Year-to-date commission, formatted server-side as a numeric string. */
  revenueYearToDate: number | string;
  /** 7 days, oldest first; index 6 = today. */
  weeklyChart: { day: string; count: number }[];
}

export default class ReservationsService {
  public static async getDashboardMetrics(): Promise<DashboardMetricsDto | null> {
    try {
      const { data } = await api.get('/admin/reservations/dashboard-metrics');

      
return data;
    } catch {
      return null;
    }
  }

  public static async getReservations(
    pageNumber?: number,
    sortBy?: string,
    sortDirection?: SortDirection,
    status?: ReservationSysStatus,
    userId?: string,
    dateFrom?: string,
    dateTo?: string,
    reservationId?: string,
    search?: string
  ): Promise<PaginatedResponse<ReservationModelShortInfo>> {
    try {
      const queryParams = createQueryParamsWithPage({
        pageNumber,
        sortBy,
        sortDirection,
        reservationStatus: status,
        userId,
        dateFrom,
        dateTo,
        reservationId,
        search,
      });

      const { data } = await api.get(`/admin/reservations${queryParams}`);

      return data;
    } catch {
      return {
        content: [],
        page: {
          size: 0,
          number: 0,
          totalElements: 0,
          totalPages: 0,
        },
      };
    }
  }

  public static async getReservation(id: number): Promise<ReservationModel | null> {
    try {
      const { data } = await api.get(`/admin/reservations/${id}`);

      return data || null;
    } catch {
      return null;
    }
  }

  public static async getReservationByNumber(sequence: string, year: string): Promise<ReservationModel | null> {
    try {
      const { data } = await api.get(`/admin/reservations/byNumber/${sequence}/${year}`);

      return data || null;
    } catch {
      return null;
    }
  }

  public static async refreshReservation(id: number): Promise<PayloadResponse<boolean>> {
    try {
      await api.post(`admin/reservations/${id}/refresh`, { id });

      return { payload: true };
    } catch (error) {
      const { message } = error as ErrorModel;

      return { payload: false, message };
    }
  }

  public static async updateAdminNotes(id: number, notes: string): Promise<PayloadResponse<boolean>> {
    try {
      await api.patch(`/admin/reservations/${id}/adminNotes`, { notes });

      return { payload: true };
    } catch (error) {
      const { message } = error as ErrorModel;

      return { payload: false, message };
    }
  }

  // Crew-list link admin sets manually for fictitious bookings or partner
  // bookings where partner didn't auto-fill (e.g. confirmation done outside
  // our system). Customer renders it as "Open link" CTA in /my-bookings/{id}.
  public static async updateCrewListUrl(id: number, crewListUrl: string | null): Promise<PayloadResponse<boolean>> {
    try {
      await api.patch(`/admin/reservations/${id}/crewListUrl`, { crewListUrl });

      return { payload: true };
    } catch (error) {
      const { message } = error as ErrorModel;

      return { payload: false, message };
    }
  }

  public static async deleteReservation(id: number, reason?: string): Promise<PayloadResponse<boolean>> {
    try {
      // Axios needs `data` on DELETE to send a body (unlike POST/PATCH
      // where the body is a direct second arg). Backend endpoint accepts
      // `{ reason: string }` — surfaced to customer on /my-bookings.
      await api.delete(`admin/reservations/${id}`, {
        data: reason?.trim() ? { reason: reason.trim() } : undefined,
      });

      return { payload: true };
    } catch (error) {
      const { message } = error as ErrorModel;

      return { payload: false, message };
    }
  }

  /**
   * HARD-DELETE (purge) a cancelled reservation from the DB. For spam / fake
   * bookings only. Backend guards: refuses unless the reservation is CANCELLED,
   * and snapshots rows into _purged_*_backup before deleting. Does NOT touch the
   * partner — cancel the option first via the normal Cancel action.
   */
  public static async purgeReservation(id: number): Promise<PayloadResponse<boolean>> {
    try {
      await api.delete(`admin/reservations/${id}/purge`);

      return { payload: true };
    } catch (error) {
      const { message } = error as ErrorModel;

      return { payload: false, message };
    }
  }

  public static async getYachtSwapInfo(id: number): Promise<YachtSwapInfoAdminDto | null> {
    try {
      const { data, status } = await api.get(`/admin/reservations/${id}/yacht-swap`, {
        validateStatus: (code) => code < 300 || code === 204,
      });

      if (status === 204) return null;

      
return data || null;
    } catch {
      return null;
    }
  }

  /** Fetches the charter agreement PDF for the reservation and triggers
   *  a download. Backend generates the PDF on the fly (Page 1 = booking
   *  data, Page 2+ = T&C) — same artefact that ships as an attachment on
   *  the confirmation email. We hit it with `responseType: 'blob'` so
   *  axios doesn't try to JSON-parse the binary stream.
   *
   *  Why download instead of `window.open`: Chrome (and most browsers)
   *  treat `window.open` after an `await` as a programmatic pop-up — the
   *  user-gesture token has already expired by the time the response
   *  arrives, so the new tab is silently blocked. A hidden `<a download>`
   *  click does NOT need the gesture token and reliably saves the PDF.
   *  The user can still open it from the downloads tray for inline view. */
  public static async openCharterAgreement(id: number, filenameRef?: string): Promise<boolean> {
    try {
      const { data } = await api.get<Blob>(`/admin/reservations/${id}/charter-agreement.pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const safeRef = (filenameRef ?? String(id)).replace(/\//g, '-');
      const a = document.createElement('a');

      a.href = url;
      a.download = `charter-agreement-${safeRef}.pdf`;
      // Some browsers also need `target=_blank` to trigger the download
      // without leaving the SPA. The hidden anchor is removed right after.
      a.target = '_blank';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
      
return true;
    } catch (err) {
      // Surface the failure so admin sees something instead of silence.
      // Common causes: 401 (token expired — refresh interceptor failed),
      // 500 (renderer threw — check backend log), or network error.
      // eslint-disable-next-line no-console
      console.error('[charter-agreement] download failed', err);

      const message = (err as ErrorModel)?.message
        ?? (err as { message?: string })?.message
        ?? 'Charter agreement download failed. Check the backend log.';

      showToast({ status: 'error', text: message });
      
return false;
    }
  }

  /** List admin-only documents attached to the reservation. Returns metadata
   *  only (no BYTEA), keyed for the Booking detail screen. */
  public static async listReservationDocuments(id: number): Promise<ReservationDocumentDto[]> {
    try {
      const { data } = await api.get<ReservationDocumentDto[]>(`/admin/reservations/${id}/documents`);

      
return data ?? [];
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[documents] list failed', err);
      
return [];
    }
  }

  /** Upload a PDF/DOC/DOCX (≤20MB) to the reservation. Pass `internal=true`
   *  to mark the doc admin-only (hidden from customer my-bookings sidebar).
   *  Returns the new document's metadata or null on failure. */
  public static async uploadReservationDocument(
    id: number,
    file: File,
    internal: boolean = false,
    type: ReservationDocumentType = 'OTHER',
  ): Promise<ReservationDocumentDto | null> {
    try {
      const form = new FormData();

      form.append('file', file);

      const { data } = await api.post<ReservationDocumentDto>(
        `/admin/reservations/${id}/documents?internal=${internal}&type=${type}`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );

      
return data;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[documents] upload failed', err);

      const message = (err as ErrorModel)?.message
        ?? (err as { message?: string })?.message
        ?? 'Document upload failed. Only PDF/DOC/DOCX up to 20MB are allowed.';

      showToast({ status: 'error', text: message });
      
return null;
    }
  }

  /** Fetch the document blob and trigger a download via a hidden anchor.
   *  Same `<a download>` trick as the charter agreement to dodge pop-up
   *  blockers on async fetches. */
  public static async openReservationDocument(
    reservationId: number,
    documentId: number,
    filename: string,
    contentType: string,
  ): Promise<boolean> {
    try {
      const { data } = await api.get<Blob>(
        `/admin/reservations/${reservationId}/documents/${documentId}`,
        { responseType: 'blob' },
      );
      const blob = new Blob([data], { type: contentType || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');

      a.href = url;
      a.download = filename;
      a.target = '_blank';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
      
return true;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[documents] open failed', err);
      showToast({ status: 'error', text: 'Could not download the document.' });
      
return false;
    }
  }

  /** Permanently remove a document from the reservation. Idempotent on the
   *  backend — re-clicks after the row is gone are silent. */
  public static async deleteReservationDocument(reservationId: number, documentId: number): Promise<boolean> {
    try {
      await api.delete(`/admin/reservations/${reservationId}/documents/${documentId}`);
      
return true;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[documents] delete failed', err);
      showToast({ status: 'error', text: 'Could not delete the document.' });
      
return false;
    }
  }

  /** Reject a customer's pending cancellation request. Used when the
   *  charter agency refuses the cancellation (their policy doesn't allow
   *  it, or the partner reservation status doesn't support it). Stamps
   *  `cancelationRejectedAt` + `cancelationRejectedReason` on the flow,
   *  leaves the reservation in BOOKING/CONFIRMED, and triggers the
   *  customer-facing "cancellation not approved" email server-side. */
  public static async rejectCancellationRequest(id: number, reason: string): Promise<PayloadResponse<boolean>> {
    try {
      await api.post(`/admin/reservations/${id}/cancellation/reject`, { reason });
      
return { payload: true };
    } catch (error) {
      const { message } = error as ErrorModel;

      
return { payload: false, message };
    }
  }

  public static async confirmReservation(id: number, paymentPhaseIds: number[]): Promise<PayloadResponse<boolean>> {
    try {
      const paymentPhaseIdsParam = paymentPhaseIds.join(',');

      await api.put(`/admin/reservations/${id}/${paymentPhaseIdsParam}`);

      return { payload: true };
    } catch (error) {
      const { message } = error as ErrorModel;

      return { payload: false, message };
    }
  }

  public static async markAsPaidReservation(id: number, paymentPhaseIds: number[]): Promise<PayloadResponse<boolean>> {
    try {
      const paymentPhaseIdsParam = paymentPhaseIds.join(',');

      await api.post(`/admin/reservations/${id}/markPaymentPhasePaid/${paymentPhaseIdsParam}`);

      return { payload: true };
    } catch (error) {
      const { message } = error as ErrorModel;

      return { payload: false, message };
    }
  }

  /**
   * Admin creates a brand-new reservation for an existing customer. Used as
   * the replacement flow after the original yacht was cancelled (e.g.
   * broken/overbooked). Gets a fresh booking number — never reuses the
   * cancelled one (matches MMK / NauSYS convention).
   *
   * `markPaid` on a phase carries over a pre-existing payment from the
   * cancelled reservation.
   */
  public static async adminCreateReservation(body: {
    userId: number;
    yachtId: number;
    offerId: number;
    totalPrice: number;
    paymentPhases: { deadline: string; amount: number; markPaid: boolean }[];
    adminNotes?: string;
    specialRequest?: string;
    sendOptionEmail?: boolean;
  }): Promise<PayloadResponse<ReservationModel>> {
    try {
      const { data } = await api.post<ReservationModel>('/admin/reservations', body);

      
return { payload: data };
    } catch (error) {
      const { message } = error as ErrorModel;

      
return { payload: null as unknown as ReservationModel, message };
    }
  }

  /**
   * Admin-only "fictitious" replacement reservation. Agency already moved
   * the customer onto a different yacht in Nausys/MMK directly (broken-boat
   * swap handled out-of-band). We just record the new yacht in OUR DB so
   * the customer's /my-bookings page surfaces the swap. No partner API
   * call, no offerId needed. Sync jobs cannot pull updates for this row
   * (external_id stays null).
   */
  public static async adminCreateFictitiousReservation(body: {
    userId: number;
    yachtId: number;
    dateFrom: string;
    dateTo: string;
    totalPrice: number;
    paymentPhases: { deadline: string; amount: number; markPaid: boolean }[];
    adminNotes?: string;
    specialRequest?: string;
  }): Promise<PayloadResponse<ReservationModel>> {
    try {
      const { data } = await api.post<ReservationModel>('/admin/reservations/fictitious', body);

      
return { payload: data };
    } catch (error) {
      const { message } = error as ErrorModel;

      
return { payload: null as unknown as ReservationModel, message };
    }
  }

  /**
   * Yacht search for the admin "create reservation" wizard. Hits the same
   * /public/yachts endpoint the customer homepage uses (no auth), surfacing
   * the full filter set the backend already understands (destinations,
   * vessel type, cabins, persons, amenities). Mirrors Nausys search UX so
   * admin can narrow down to the right yacht quickly.
   */
  public static async searchYachtsForAdmin(params: {
    did?: string[];                    // synthetic location ids from LocationPicker / CountrySelect
    startDate: string;
    endDate: string;
    vesselType?: string[];             // e.g. ["CATAMARAN","SAILING_YACHT"]
    amenities?: number[];              // equipment ids from AmenitiesPicker
    agencyId?: number[];               // charter company ids from AgencyPicker
    manufacturerId?: number[];         // "yacht builder" ids from ManufacturerPicker
    modelId?: number[];                // yacht model ids, cascades on manufacturer
    minCabins?: number;
    minPersons?: number;
    minBuildYear?: number;
    maxBuildYear?: number;
    currency?: string;                 // ISO-4217 — EUR / USD / GBP / AUD / CAD
    size?: number;                     // page size (backend hard-caps at 100)
    page?: number;                     // 0-based page index for broker pagination (100 per page)
    // Replacement flow: surface yachts that the partner-availability sync has
    // marked UNAVAILABLE for this period (usually because the agency already
    // assigned this yacht to the same customer over phone). Default omitted =
    // backend filters to available rows only.
    includeUnavailable?: boolean;
  }): Promise<PaginatedResponse<{
    // The backend returns YachtSearchResponseDto. We type the fields the
    // Offers workspace actually consumes so TypeScript catches a server-side
    // rename before it lands as a silent runtime miss. Anything not listed
    // here we simply don't read.
    id: number;                        // primary yacht id (slug ends with -{id})
    yachtId?: number;                  // legacy alias kept for older payloads
    offerId?: number;
    slug?: string;                     // used for "View on customer site" link
    name: string;
    modelName: string;
    clientPriceEur: number;            // ALWAYS EUR (the name is literal) — convert via clientPriceInfo
    listPriceEur?: number | null;      // pre-discount, drives the strikethrough price (also EUR)
    // Currency-converted amounts when the search was made with ?currency= — the
    // backend leaves clientPriceEur/listPriceEur in EUR and returns the converted
    // value here (amount in the active currency + the EUR→currency `rate`). The
    // Offers workspace reads `.amount` for display so the figure matches the
    // currency symbol (was showing the EUR number with the AUD/USD symbol).
    clientPriceInfo?: { amount: number; currency: string; rate?: number } | null;
    listPriceInfo?: { amount: number; currency: string; rate?: number } | null;
    agencyName: string;
    // Admin-only commission per offer (admin gate enforced server-side via
    // YachtMapper.toSearchDto isAdminUser()). Customer auth gets null here.
    agencyCommissionEur?: number | null;
    location: { id?: string; name: string; countryCode?: string };
    mainImageId?: number;
    cabins?: number;
    berths?: number;
    maxPersons?: number;
    buildYear?: number;
    length?: number;                   // backend field name is `length`, NOT `lengthMeters`
    vesselType?: string;               // CATAMARAN / SAILING_YACHT / MOTOR_YACHT / ...
    isOption?: boolean;                // true when best matching offer is OPTION / OPTION_WAITING
    // ISO-8601 LocalDateTime ("2026-04-25T23:59:00") — precise deadline
    // after which the option lapses back to FREE. Admin broker surfaces
    // this next to "Add to offer" so they know how long they can wait on
    // a client decision. Null for non-optioned yachts and for partner
    // rows that didn't carry an expiry.
    optionExpiresAt?: string | null;
  }>> {
    try {
      const qs = new URLSearchParams();

      (params.did || []).forEach(d => qs.append('did', d));
      (params.vesselType || []).forEach(b => qs.append('vesselType', b));
      (params.amenities || []).forEach(a => qs.append('amenities', String(a)));
      (params.agencyId || []).forEach(a => qs.append('agencyId', String(a)));
      // Backend /public/yachts uses the cryptic `mfid` (manufacturer) +
      // `mid` (model) param names — mirror the same keys on the way out
      // even though the public call sites use friendlier "manufacturerId"
      // / "modelId" for readability.
      (params.manufacturerId || []).forEach(a => qs.append('mfid', String(a)));
      (params.modelId || []).forEach(a => qs.append('mid', String(a)));
      qs.set('startDate', params.startDate);
      qs.set('endDate', params.endDate);

      if (params.minCabins) qs.set('minCabins', String(params.minCabins));

      if (params.minPersons) qs.set('minPersons', String(params.minPersons));

      if (params.minBuildYear) qs.set('minBuildYear', String(params.minBuildYear));

      if (params.maxBuildYear) qs.set('maxBuildYear', String(params.maxBuildYear));

      if (params.currency) qs.set('currency', params.currency);

      if (params.includeUnavailable) qs.set('includeUnavailable', 'true');

      // Backend `YachtQueryingService.MAX_PAGE_SIZE = 100` — requesting
      // more silently caps. The offers workspace paginates 100-at-a-time
      // with Prev/Next buttons; admin can flip pages through the 300+
      // yacht bucket when their search is wide.
      qs.set('size', String(params.size ?? 100));
      qs.set('page', String(params.page ?? 0));
      // `sortBy` is a bespoke custom param — NOT the Spring Pageable
      // `sort=field,dir` convention. Valid values: asc|desc (total
      // price = clientPrice × numberOfDays), lowestPrepayment, lengthAsc,
      // lengthDesc, recommendedScore. Anything else silently defaults to
      // recommendedScore DESC, which breaks our "cheapest first across
      // all pages" promise — so always pin this to "asc" for the offers
      // workspace.
      qs.set('sortBy', 'asc');

      const { data } = await api.get(`/public/yachts?${qs.toString()}`);

      
return data;
    } catch {
      return { content: [], page: { size: 0, totalElements: 0, totalPages: 0, number: 0 } };
    }
  }
}
