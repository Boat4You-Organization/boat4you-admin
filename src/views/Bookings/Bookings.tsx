/* eslint-disable @typescript-eslint/no-use-before-define, no-nested-ternary */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { Box, Button, IconButton, Stack, TextField, Typography } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';

import Layout from '@/components/Layout';
import { PAGE_NUMBER, PAGE_SIZE } from '@/config/constants.config';
import {
  RESERVATION_SYS_TAB_VALUES,
  ReservationSysStatus,
  VIRTUAL_ENDED,
  VIRTUAL_IN_CHARTER,
  VirtualReservationStatus,
  getEffectiveReservationSysStatus,
} from '@/models/booking.model';
import { bbColors, bbFont, bbStatusPill } from '@/styles/bb';
import useQueryParams from '@/utils/hooks/useQueryParams';
import DateTime from '@/utils/static/DateTime';
import { formatPrice } from '@/utils/static/formatNumber';
import {
  clearSelectedBooking,
  getBookings,
  toggleCancelBookingModal,
  toggleConfirmBookingModal,
  toggleCreateReservationModal,
  toggleEditNotesModal,
  toggleMarkAsPaidBookingModal,
  toggleSyncBookingModal,
} from '@/valtio/bookings/bookings.actions';
import { useBookingsStore } from '@/valtio/bookings/bookings.store';

import CancelBookingModal from './partials/CancelBookingModal';
import ConfirmBookingModal from './partials/ConfirmBookingModal';
import CreateReservationModal from './partials/CreateReservationModal';
import EditNotesModal from './partials/EditNotesModal';
import MarkAsPaidBookingModal from './partials/MarkAsPaidBookingModal';
import SyncBookingModal from './partials/SyncBookingModal';

/**
 * Bookings list — Broker Desk redesign.
 *
 * Mirrors the handoff: PageHead + TabGroup + FilterBar + card-wrapped
 * table. Columns: ID · Client · Yacht/Base (2-line) · Dates+nights ·
 * Total (green) · Commission (amber) · Payment bar · Status pill ·
 * Check-in (relative). Sort and additional filter chips land as
 * follow-ups once backend query params stabilise.
 *
 * Payment % is currently derived from reservation status (100/50/10/0)
 * because backend `ReservationModelShortInfo` doesn't carry a paidAmount
 * field yet — visible placeholder matching the design until the real
 * number lands. Replace `paidPctForStatus()` when that endpoint ships.
 */

// Tab variant → StatusPill variant + label key. Accepts virtual statuses
// (IN_CHARTER / ENDED) as well so the same helper drives both the table
// pill and the tab labels.
const statusToPillVariant = (s: ReservationSysStatus | VirtualReservationStatus): string => {
  switch (s) {
    case ReservationSysStatus.RESERVATION:
      return 'confirmed';
    case ReservationSysStatus.OPTION:
      return 'option';
    case ReservationSysStatus.OPTION_WAITING:
      return 'pending';
    case ReservationSysStatus.CANCELLED:
      return 'cancelled';
    case VIRTUAL_IN_CHARTER:
      return 'in_charter';
    case VIRTUAL_ENDED:
      return 'ended';
    default:
      return 'draft';
  }
};


const formatCheckIn = (from?: string): string => {
  if (!from) return '—';

  const f = dayjs(from);

  if (!f.isValid()) return '—';

  const diff = f.startOf('day').diff(dayjs().startOf('day'), 'day');

  if (diff === 0) return 'today';

  if (diff === 1) return 'tomorrow';

  if (diff > 0 && diff < 60) return `in ${diff} days`;

  if (diff < 0 && diff > -60) return `${Math.abs(diff)}d ago`;

  
return f.format('DD MMM YYYY');
};

const formatNights = (from?: string, to?: string): number => {
  if (!from || !to) return 0;

  const f = dayjs(from);
  const t = dayjs(to);

  if (!f.isValid() || !t.isValid()) return 0;

  
return Math.max(0, t.startOf('day').diff(f.startOf('day'), 'day'));
};

const initialsOf = (s: string): string => {
  const parts = s.split(' ').filter(Boolean);

  
return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase() || '?';
};

type TabValue = (typeof RESERVATION_SYS_TAB_VALUES)[number];

const Bookings = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { params: queryParams, handlePageChange, setParam } = useQueryParams();
  const { page, sortBy, sortDirection, bookingStatus, customer, startDate, endDate } = queryParams;

  // Click-to-toggle sort — 1st click = asc, 2nd = desc, 3rd clears.
  // URL reflects sort so a shared link reopens the same view. Only
  // columns whose header carries a `sortKey` are clickable.
  const handleSortClick = (key: string) => {
    if (sortBy === key) {
      if (sortDirection === 'asc') setParam({ sortBy: key, sortDirection: 'desc', page: 1 });
      else setParam({ sortBy: '', sortDirection: 'asc', page: 1 });
    } else {
      setParam({ sortBy: key, sortDirection: 'asc', page: 1 });
    }
  };

  const [statusFilter, setStatusFilter] = useState<string>(bookingStatus || RESERVATION_SYS_TAB_VALUES[0]);
  const [searchInput, setSearchInput] = useState<string>(customer || '');
  // Debounced search term — only this drives the fetch. Typing into the
  // input updates `searchInput` immediately (so the field feels snappy)
  // and a 350ms debounce promotes it here, avoiding a request per
  // keystroke. URL params are NOT touched so Mario's browser history
  // isn't polluted with half-typed queries.
  const [debouncedSearch, setDebouncedSearch] = useState<string>(customer || '');
  const [dateRange] = useState<[Dayjs | null, Dayjs | null]>([
    startDate ? dayjs(startDate) : null,
    endDate ? dayjs(endDate) : null,
  ]);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);

    
return () => window.clearTimeout(id);
  }, [searchInput]);

  const {
    isLoading,
    bookings,
    totalCount,
    cancelBookingModalOpen,
    syncBookingModalOpen,
    confirmBookingModalOpen,
    markAsPaidBookingModalOpen,
    editNotesModalOpen,
    createReservationModalOpen,
    viewedBookingIds,
  } = useBookingsStore();
  // O(1) lookup for the row-level "is this booking still new to me?" check.
  // Recreated whenever viewedBookingIds changes — fine, the set is small
  // (typically a few hundred ids tops, bounded by however many bookings the
  // admin has actually opened across sessions).
  const viewedSet = new Set(viewedBookingIds);

  const { orderNo } = useParams();

  useEffect(() => {
    if (!orderNo) clearSelectedBooking();
  }, [orderNo]);

  // Virtual tabs (IN_CHARTER / ENDED) don't exist on the backend — collapse
  // them to RESERVATION for the API call, then filter client-side below.
  const isVirtualTab = statusFilter === VIRTUAL_IN_CHARTER || statusFilter === VIRTUAL_ENDED;

  useEffect(() => {
    const pageNumber = page - PAGE_NUMBER;
    const effectiveBackendStatus = isVirtualTab
      ? ReservationSysStatus.RESERVATION
      : ((statusFilter === 'all' ? '' : statusFilter) as ReservationSysStatus);
    // Single free-text search param — backend LIKEs it against the
    // reservation number, client name and email. No client-side
    // heuristics needed; "94/2026" matches "100194/2026" via %...%.
    const search = debouncedSearch || undefined;

    if (dateRange[0] && dateRange[1]) {
      getBookings(
        pageNumber,
        sortBy,
        sortDirection,
        effectiveBackendStatus,
        undefined,
        DateTime.formatFull(dateRange[0]),
        DateTime.formatFull(dateRange[1]),
        undefined,
        search
      );
      
return;
    }

    getBookings(pageNumber, sortBy, sortDirection, effectiveBackendStatus, undefined, undefined, undefined, undefined, search);
  }, [dateRange, page, sortBy, sortDirection, statusFilter, debouncedSearch, isVirtualTab]);

  // Client-side filter for virtual tabs. Backend paginates over every
  // RESERVATION row (it doesn't know about IN_CHARTER / ENDED), so the
  // visible count on these tabs can be smaller than `totalCount` until we
  // push the date check into the server query. Good enough for now.
  const visibleBookings = isVirtualTab
    ? bookings.filter(b => {
        const eff = getEffectiveReservationSysStatus(
          b.reservationSysStatus,
          b.reservationDateFrom,
          b.reservationDateTo
        );

        
return eff === statusFilter;
      })
    : bookings;

  const openBooking = (b: (typeof bookings)[number]) => {
    const key = b.reservationNumber?.replace('/', '-') ?? b.reservationId.toString();

    navigate(`/bookings/${key}?${searchParams.toString()}`);
  };

  const clearSearch = () => setSearchInput('');

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Tab label map tailored to the redesign — friendlier than the raw enum
  // labels and collapses OPTION_WAITING into "Option" since they share
  // the same UX semantics. IN_CHARTER and ENDED are virtual tabs driven
  // by dateFrom/dateTo (see getEffectiveReservationSysStatus).
  const TAB_LABELS: Record<TabValue, string> = {
    all: 'All',
    [ReservationSysStatus.RESERVATION]: 'Confirmed',
    [VIRTUAL_IN_CHARTER]: 'In charter',
    [VIRTUAL_ENDED]: 'Ended',
    [ReservationSysStatus.OPTION]: 'Option',
    [ReservationSysStatus.CANCELLED]: 'Cancelled',
  };

  return (
    <>
      <CancelBookingModal isOpen={cancelBookingModalOpen} onClose={toggleCancelBookingModal} />
      <SyncBookingModal isOpen={syncBookingModalOpen} onClose={toggleSyncBookingModal} />
      <ConfirmBookingModal isOpen={confirmBookingModalOpen} onClose={toggleConfirmBookingModal} />
      <MarkAsPaidBookingModal isOpen={markAsPaidBookingModalOpen} onClose={toggleMarkAsPaidBookingModal} />
      <EditNotesModal isOpen={editNotesModalOpen} onClose={toggleEditNotesModal} />
      <CreateReservationModal
        isOpen={createReservationModalOpen}
        onClose={() => toggleCreateReservationModal(false)}
      />
      <Layout>
        <Box
          sx={{
            backgroundColor: bbColors.gray50,
            minHeight: '100vh',
            fontFamily: bbFont.stack,
            color: bbColors.navy900,
            pt: '74px',
            pb: 4,
            px: { xs: 2, sm: 3 },
          }}
        >
          {/* Page head */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            alignItems={{ xs: 'flex-start', md: 'flex-end' }}
            justifyContent="space-between"
            gap={2}
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography component="h1" sx={{ fontSize: { xs: 20, sm: 22 }, fontWeight: 800, letterSpacing: '-0.01em' }}>
                {t('common.bookings')}
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: bbColors.gray500, mt: 0.5 }}>
                Confirmed charters, deposits & options
              </Typography>
            </Box>
            <Stack direction="row" gap={1} sx={{ flexShrink: 0 }}>
              <Button
                onClick={() => toggleCreateReservationModal(true)}
                sx={{
                  backgroundColor: bbColors.yellow500,
                  color: bbColors.yellowText,
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: '0.02em',
                  textTransform: 'none',
                  boxShadow: '0 4px 10px -4px rgba(255,210,74,0.5)',
                  '&:hover': { backgroundColor: '#ffca2e', boxShadow: '0 4px 10px -4px rgba(255,210,74,0.5)' },
                }}
              >
                + Create reservation
              </Button>
            </Stack>
          </Stack>

          {/* Tabs — pill group */}
          <Box
            sx={{
              display: 'flex',
              gap: 0.5,
              mb: 1.75,
              backgroundColor: bbColors.white,
              border: `1px solid ${bbColors.gray200}`,
              borderRadius: '10px',
              padding: '4px',
              width: 'fit-content',
              overflowX: 'auto',
              maxWidth: '100%',
            }}
          >
            {RESERVATION_SYS_TAB_VALUES.map(v => {
              const active = v === statusFilter;

              
return (
                <Box
                  key={v}
                  onClick={() => {
                    setStatusFilter(v);
                    setParam({ bookingStatus: v === 'all' ? '' : v, page: 1 });
                  }}
                  sx={{
                    padding: '7px 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    color: active ? bbColors.white : bbColors.gray500,
                    backgroundColor: active ? bbColors.navy900 : 'transparent',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                  }}
                >
                  {TAB_LABELS[v as TabValue]}
                </Box>
              );
            })}
          </Box>

          {/* Filter bar */}
          <Stack
            direction="row"
            gap={1}
            sx={{
              backgroundColor: bbColors.white,
              border: `1px solid ${bbColors.gray200}`,
              borderRadius: '10px',
              padding: '10px 12px',
              mb: 1.75,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <TextField
              placeholder="Search booking number, client name, email…"
              size="small"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              sx={{
                flex: 1,
                minWidth: 240,
                '& .MuiOutlinedInput-root': {
                  fontSize: 12,
                  borderRadius: '6px',
                  '& fieldset': { borderColor: bbColors.gray300 },
                },
              }}
              slotProps={{
                input: {
                  endAdornment: searchInput ? (
                    <IconButton
                      size="small"
                      onClick={clearSearch}
                      aria-label="Clear search"
                      sx={{ color: bbColors.gray500, p: 0.25 }}
                    >
                      <CloseRoundedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  ) : null,
                },
              }}
            />
          </Stack>

          {/* Table card */}
          <Box
            sx={{
              backgroundColor: bbColors.white,
              border: `1px solid ${bbColors.gray200}`,
              borderRadius: '10px',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ overflowX: 'auto' }}>
              <Box component="table" sx={{ width: '100%', minWidth: 1080, borderCollapse: 'collapse' }}>
                <Box component="thead">
                  <Box component="tr">
                    {(
                      [
                        { label: 'Booking', align: 'left', sortKey: 'reservationNumber' },
                        { label: 'Client ID', align: 'left' },
                        { label: 'Client', align: 'left' },
                        { label: 'Yacht / Base', align: 'left' },
                        { label: 'Agency', align: 'left' },
                        { label: 'Dates', align: 'left' },
                        { label: 'Client price', align: 'right' },
                        { label: 'Agency price', align: 'right' },
                        { label: 'Commission', align: 'right' },
                        { label: 'Status', align: 'left' },
                        { label: 'Check-in', align: 'left', sortKey: 'reservationDateFrom' },
                      ] as Array<{ label: string; align: 'left' | 'right'; sortKey?: string }>
                    ).map((h, i) => {
                      const isSortable = !!h.sortKey;
                      const isActive = isSortable && sortBy === h.sortKey;
                      const arrow = isActive ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : '';

                      
return (
                        <Box
                          component="th"
                          key={h.label || `col-${i}`}
                          onClick={isSortable ? () => handleSortClick(h.sortKey!) : undefined}
                          sx={{
                            fontSize: 10,
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                            color: isActive ? bbColors.navy900 : bbColors.gray500,
                            fontWeight: 700,
                            padding: '10px 14px',
                            textAlign: h.align,
                            backgroundColor: bbColors.gray75,
                            borderBottom: `1px solid ${bbColors.gray200}`,
                            whiteSpace: 'nowrap',
                            cursor: isSortable ? 'pointer' : 'default',
                            userSelect: 'none',
                            '&:hover': isSortable ? { color: bbColors.navy900 } : undefined,
                          }}
                        >
                          {h.label}
                          {arrow}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
                <Box component="tbody">
                  {isLoading && (
                    <Box component="tr">
                      <Box component="td" colSpan={11} sx={{ padding: '40px 20px', textAlign: 'center', color: bbColors.gray500, fontSize: 13 }}>
                        Loading…
                      </Box>
                    </Box>
                  )}
                  {!isLoading && visibleBookings.length === 0 && (
                    <Box component="tr">
                      <Box component="td" colSpan={11} sx={{ padding: '40px 20px', textAlign: 'center', color: bbColors.gray500, fontSize: 13 }}>
                        No bookings match the current filters.
                      </Box>
                    </Box>
                  )}
                  {!isLoading &&
                    visibleBookings.map(b => {
                      const effStatus = getEffectiveReservationSysStatus(
                        b.reservationSysStatus,
                        b.reservationDateFrom,
                        b.reservationDateTo
                      );
                      const pill = bbStatusPill(statusToPillVariant(effStatus));
                      const nights = formatNights(b.reservationDateFrom, b.reservationDateTo);
                      const cleanYacht = b.modelName?.replace(/\s*-\s*\d+\s*cab\.?$/i, '') ?? '—';
                      const isUnviewed = !viewedSet.has(b.reservationId);

                      
return (
                        <Box
                          component="tr"
                          key={`${b.reservationId}`}
                          onClick={() => openBooking(b)}
                          sx={{
                            cursor: 'pointer',
                            backgroundColor: isUnviewed ? bbColors.amber100 : undefined,
                            '&:hover': {
                              backgroundColor: isUnviewed ? '#fceec5' : bbColors.gray75,
                            },
                          }}
                        >
                          <Box
                            component="td"
                            sx={{
                              ...tdBase,
                              fontWeight: 700,
                              fontVariantNumeric: 'tabular-nums',
                              borderLeft: isUnviewed ? `3px solid ${bbColors.yellow500}` : undefined,
                            }}
                          >
                            <Stack direction="row" alignItems="center" gap={0.75}>
                              {isUnviewed && (
                                <Box
                                  component="span"
                                  sx={{
                                    fontSize: 9,
                                    fontWeight: 800,
                                    letterSpacing: '0.08em',
                                    backgroundColor: bbColors.yellow500,
                                    color: bbColors.yellowText,
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  New
                                </Box>
                              )}
                              <Box component="span">{b.reservationNumber ?? `#${b.reservationId}`}</Box>
                            </Stack>
                          </Box>
                          <Box
                            component="td"
                            sx={{
                              ...tdBase,
                              color: bbColors.gray500,
                              fontWeight: 600,
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {b.reservationUserId != null ? `#${b.reservationUserId}` : '—'}
                          </Box>
                          <Box component="td" sx={tdBase}>
                            <Stack direction="row" alignItems="center" gap={1.25}>
                              <Box
                                sx={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: '50%',
                                  background: `linear-gradient(135deg, ${bbColors.navy700}, ${bbColors.navy900})`,
                                  color: '#fff',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 10,
                                  fontWeight: 800,
                                  flexShrink: 0,
                                }}
                              >
                                {initialsOf(b.endUser || '?')}
                              </Box>
                              <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: bbColors.navy900 }}>
                                {b.endUser || '—'}
                              </Typography>
                            </Stack>
                          </Box>
                          <Box component="td" sx={tdBase}>
                            <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>
                              {cleanYacht}
                              {b.yachtName ? (
                                <Box component="span" sx={{ color: bbColors.gray500, fontWeight: 500 }}>
                                  {' · '}
                                  {b.yachtName}
                                </Box>
                              ) : null}
                            </Typography>
                            <Typography sx={{ fontSize: 11, color: bbColors.gray500 }}>
                              {b.locationFromName ?? '—'}
                            </Typography>
                          </Box>
                          <Box component="td" sx={{ ...tdBase, color: bbColors.navy700, fontWeight: 600 }}>
                            {b.agencyName ?? '—'}
                          </Box>
                          <Box component="td" sx={{ ...tdBase, fontVariantNumeric: 'tabular-nums' }}>
                            <Typography sx={{ fontSize: 12.5 }}>
                              {DateTime.formatShortWithoutDay(dayjs(b.reservationDateFrom))} →{' '}
                              {DateTime.formatShortWithoutDay(dayjs(b.reservationDateTo))}
                            </Typography>
                            <Typography sx={{ fontSize: 11, color: bbColors.gray500 }}>
                              {nights} night{nights === 1 ? '' : 's'}
                            </Typography>
                          </Box>
                          <Box
                            component="td"
                            sx={{
                              ...tdBase,
                              textAlign: 'right',
                              color: bbColors.green600,
                              fontWeight: 800,
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            €{formatPrice(b.reservationTotalPrice)}
                          </Box>
                          <Box
                            component="td"
                            sx={{
                              ...tdBase,
                              textAlign: 'right',
                              fontWeight: 700,
                              fontVariantNumeric: 'tabular-nums',
                              color: bbColors.navy900,
                            }}
                          >
                            {b.reservationAgencyPrice != null ? `€${formatPrice(b.reservationAgencyPrice)}` : '—'}
                          </Box>
                          <Box
                            component="td"
                            sx={{
                              ...tdBase,
                              textAlign: 'right',
                              color: bbColors.amber700,
                              fontWeight: 700,
                              fontVariantNumeric: 'tabular-nums',
                              fontSize: 11.5,
                            }}
                          >
                            {b.reservationCommission != null ? `€${formatPrice(b.reservationCommission)}` : '—'}
                          </Box>
                          <Box component="td" sx={tdBase}>
                            <Box component="span" sx={pill.style}>
                              {pill.label}
                            </Box>
                          </Box>
                          <Box component="td" sx={{ ...tdBase, color: bbColors.gray500 }}>
                            {formatCheckIn(b.reservationDateFrom)}
                          </Box>
                        </Box>
                      );
                    })}
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Pagination */}
          {totalCount > PAGE_SIZE && (
            <Stack direction="row" alignItems="center" justifyContent="center" gap={2} sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                size="small"
                disabled={page <= PAGE_NUMBER}
                onClick={() => handlePageChange(page - 1)}
                sx={{ textTransform: 'none', fontSize: 12, borderColor: bbColors.gray300, color: bbColors.navy900 }}
              >
                ← Prev
              </Button>
              <Typography sx={{ fontSize: 12, color: bbColors.gray500 }}>
                Page <strong>{page}</strong> of <strong>{totalPages}</strong>
              </Typography>
              <Button
                variant="outlined"
                size="small"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
                sx={{ textTransform: 'none', fontSize: 12, borderColor: bbColors.gray300, color: bbColors.navy900 }}
              >
                Next →
              </Button>
            </Stack>
          )}
        </Box>
      </Layout>
    </>
  );
};

const tdBase = {
  padding: '12px 14px',
  fontSize: 12.5,
  borderBottom: `1px solid ${bbColors.gray100}`,
  color: '#2c3e56',
  whiteSpace: 'nowrap' as const,
};

export default Bookings;
