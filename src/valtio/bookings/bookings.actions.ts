import { SortDirection } from '@/config/constants.config';
import { ReservationSysStatus } from '@/models/booking.model';
import ReservationsService from '@/services/reservations.service';

import { bookingsStore, VIEWED_BOOKINGS_SEEDED_KEY, VIEWED_BOOKINGS_STORAGE_KEY } from './bookings.store';

// Recompute `unviewedCount` from the current `recentBookings` listing minus
// the persisted `viewedBookingIds`. Called whenever either side of that
// equation changes (after a poll, after the admin opens a booking).
function recomputeUnviewedCount() {
  const viewed = new Set(bookingsStore.viewedBookingIds);
  bookingsStore.unviewedCount = bookingsStore.recentBookings.filter(
    b => !viewed.has(b.reservationId)
  ).length;
}

function persistViewedIds() {
  try {
    localStorage.setItem(
      VIEWED_BOOKINGS_STORAGE_KEY,
      JSON.stringify(bookingsStore.viewedBookingIds)
    );
  } catch {
    // localStorage write can fail in private mode / quota — the in-memory
    // set is still updated so the current session sees the change.
  }
}

/**
 * Polled by the admin shell every 60s. Fetches the most recent reservations
 * (newest first) so the Header can show a "you have N unread bookings"
 * badge.
 *
 * On the very first run we *seed* `viewedBookingIds` with everything that
 * comes back so legacy bookings don't all render as "NEW" pills. Only
 * bookings that arrive after this first poll are treated as new.
 */
export async function refreshUnviewedBookingsCount(): Promise<void> {
  // ReservationView (the JPA projection used by the admin listing) exposes
  // the creation timestamp as `reservationCreatedAt`, not `createdAt`. The
  // wrong attribute name throws UnknownPathException which floods the
  // backend log every 60s.
  const { content } = await ReservationsService.getReservations(0, 'reservationCreatedAt', 'desc');
  bookingsStore.recentBookings = content;

  const seeded = (() => {
    try {
      return localStorage.getItem(VIEWED_BOOKINGS_SEEDED_KEY) === 'true';
    } catch {
      return false;
    }
  })();
  if (!seeded && content.length > 0) {
    const seedSet = new Set(bookingsStore.viewedBookingIds);
    content.forEach(b => seedSet.add(b.reservationId));
    bookingsStore.viewedBookingIds = Array.from(seedSet);
    persistViewedIds();
    try {
      localStorage.setItem(VIEWED_BOOKINGS_SEEDED_KEY, 'true');
    } catch {
      // ignore — best-effort write
    }
  }

  recomputeUnviewedCount();
}

/**
 * Mark a booking as viewed. Idempotent — calling multiple times for the
 * same id is a no-op. Persists to localStorage so the "new" highlight
 * doesn't reappear on the next page reload, and immediately drops the
 * Header badge count without waiting for the next poll.
 */
export function markBookingAsViewed(id: number): void {
  if (bookingsStore.viewedBookingIds.includes(id)) return;
  bookingsStore.viewedBookingIds = [...bookingsStore.viewedBookingIds, id];
  persistViewedIds();
  recomputeUnviewedCount();
}

export async function getBookings(
  page?: number,
  sortBy?: string,
  sortDirection?: SortDirection,
  status?: ReservationSysStatus,
  userId?: string,
  dateFrom?: string,
  dateTo?: string,
  reservationId?: string,
  search?: string
): Promise<void> {
  bookingsStore.isLoading = true;

  const { content, page: contentPage } = await ReservationsService.getReservations(
    page,
    sortBy,
    sortDirection,
    status,
    userId,
    dateFrom,
    dateTo,
    reservationId,
    search
  );

  bookingsStore.isLoading = false;
  bookingsStore.bookings = content;
  bookingsStore.totalCount = contentPage?.totalElements || 0;
}

export async function getSelectedBooking(id: number): Promise<void> {
  const response = await ReservationsService.getReservation(id);

  bookingsStore.selectedBooking = response!;
}

/** Re-pull the currently-selected booking from the API by its id. Used after
 *  in-place mutations (cancellation reject, mark-paid, …) so banners and
 *  status pills flip without a full page refresh. No-op when nothing is
 *  selected. */
export async function reloadSelectedBooking(): Promise<void> {
  const id = bookingsStore.selectedBooking?.reservationId;
  if (!id) return;
  await getSelectedBooking(id);
}

export async function getSelectedBookingByOrderNo(orderNo: string): Promise<void> {
  // URL carries `{sequence}-{year}` (Order No. #{sequence}/{year} with the
  // slash swapped for `-` so it's one router segment). Backend expects two
  // path parts — split on the last `-` in case a future sequence contains one.
  const dashIndex = orderNo.lastIndexOf('-');
  if (dashIndex < 0) {
    bookingsStore.selectedBooking = undefined;
    return;
  }
  const sequence = orderNo.slice(0, dashIndex);
  const year = orderNo.slice(dashIndex + 1);
  const response = await ReservationsService.getReservationByNumber(sequence, year);

  bookingsStore.selectedBooking = response!;
}

export async function findBooking(index: string) {
  const { reservationId } = bookingsStore.bookings[+index];

  getSelectedBooking(reservationId);
}

export function isBookingEditable(index: number): boolean {
  const selectedBooking = bookingsStore.bookings[+index];

  const status = selectedBooking.reservationSysStatus;

  return status === ReservationSysStatus.UNKNOWN || status === ReservationSysStatus.OPTION;
}

/**
 * Admin-side cancel is broader than edit. Even a confirmed RESERVATION may
 * need to be cancelled — overbooking, charter pulled the yacht, payment
 * failure post-confirmation, etc. The admin takes responsibility for
 * refund coordination outside the app. Only already-cancelled bookings
 * are excluded (re-cancelling is a no-op).
 */
export function isBookingCancellable(index: number): boolean {
  const selectedBooking = bookingsStore.bookings[+index];

  const status = selectedBooking.reservationSysStatus;

  return status !== ReservationSysStatus.CANCELLED;
}

export function clearSelectedBooking(): void {
  bookingsStore.selectedBooking = undefined;
}

export function toggleCancelBookingModal(isOpen?: boolean | React.MouseEvent): void {
  bookingsStore.cancelBookingModalOpen = typeof isOpen === 'boolean' ? isOpen : !bookingsStore.cancelBookingModalOpen;
}

export function toggleSyncBookingModal(isOpen?: boolean | React.MouseEvent): void {
  bookingsStore.syncBookingModalOpen = typeof isOpen === 'boolean' ? isOpen : !bookingsStore.syncBookingModalOpen;
}

export function toggleConfirmBookingModal(isOpen?: boolean | React.MouseEvent): void {
  bookingsStore.confirmBookingModalOpen = typeof isOpen === 'boolean' ? isOpen : !bookingsStore.confirmBookingModalOpen;
}

export function toggleMarkAsPaidBookingModal(isOpen?: boolean | React.MouseEvent): void {
  bookingsStore.markAsPaidBookingModalOpen =
    typeof isOpen === 'boolean' ? isOpen : !bookingsStore.markAsPaidBookingModalOpen;
}

export function toggleEditNotesModal(isOpen?: boolean | React.MouseEvent): void {
  bookingsStore.editNotesModalOpen = typeof isOpen === 'boolean' ? isOpen : !bookingsStore.editNotesModalOpen;
}

export function toggleRejectCancellationModal(isOpen?: boolean | React.MouseEvent): void {
  bookingsStore.rejectCancellationModalOpen =
    typeof isOpen === 'boolean' ? isOpen : !bookingsStore.rejectCancellationModalOpen;
}

export function toggleCreateReservationModal(isOpen?: boolean | React.MouseEvent): void {
  bookingsStore.createReservationModalOpen =
    typeof isOpen === 'boolean' ? isOpen : !bookingsStore.createReservationModalOpen;
}
