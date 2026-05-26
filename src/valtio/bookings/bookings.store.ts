import { proxy, useSnapshot } from 'valtio';

import { ReservationModel, ReservationModelShortInfo } from '@/models/booking.model';

// localStorage key for the per-device "this admin has opened these bookings"
// set. We persist as a plain array so JSON.stringify works; it's converted to
// a Set lazily on read inside helpers that need O(1) lookup.
export const VIEWED_BOOKINGS_STORAGE_KEY = 'viewedBookingIds';
// Separate flag — once we've seeded the viewed-set with everything that
// existed at first install, future bookings genuinely show up as "new".
// Without this seed every legacy booking would render with the highlight
// + NEW pill until manually opened, which defeats the point.
export const VIEWED_BOOKINGS_SEEDED_KEY = 'viewedBookingsSeeded';

const loadViewedIds = (): number[] => {
  try {
    const raw = localStorage.getItem(VIEWED_BOOKINGS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n: unknown) => typeof n === 'number') : [];
  } catch {
    return [];
  }
};

interface BookingsStore {
  bookings: ReservationModelShortInfo[];
  selectedBooking?: ReservationModel;
  totalCount: number;
  isLoading: boolean;
  cancelBookingModalOpen: boolean;
  syncBookingModalOpen: boolean;
  confirmBookingModalOpen: boolean;
  markAsPaidBookingModalOpen: boolean;
  editNotesModalOpen: boolean;
  createReservationModalOpen: boolean;
  rejectCancellationModalOpen: boolean;
  // Tracking "new since you last opened it" — purely client-side. Header
  // polls the recent listing every 60s, computes how many of those
  // reservation IDs aren't yet in `viewedBookingIds`, and surfaces that as
  // a red badge on the Bookings nav link. Opening a booking pushes its id
  // into the array (persisted to localStorage) and recomputes the count
  // synchronously so the badge clears immediately, without waiting for
  // the next poll.
  viewedBookingIds: number[];
  recentBookings: ReservationModelShortInfo[];
  unviewedCount: number;
}

export const bookingsStore = proxy<BookingsStore>({
  bookings: [],
  selectedBooking: undefined,
  totalCount: 0,
  isLoading: false,
  cancelBookingModalOpen: false,
  syncBookingModalOpen: false,
  confirmBookingModalOpen: false,
  markAsPaidBookingModalOpen: false,
  editNotesModalOpen: false,
  createReservationModalOpen: false,
  rejectCancellationModalOpen: false,
  viewedBookingIds: loadViewedIds(),
  recentBookings: [],
  unviewedCount: 0,
});

export const useBookingsStore = (): BookingsStore => useSnapshot(bookingsStore);
