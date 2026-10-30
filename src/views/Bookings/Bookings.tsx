/* eslint-disable @typescript-eslint/no-use-before-define, no-nested-ternary */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { Box, Button, IconButton, InputAdornment, Stack, TextField } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';

import {
  DeskPage,
  DeskTabs,
  EmptyState,
  FilterBar,
  InitialsAvatar,
  NewTag,
  PageHead,
  Pager,
  SkeletonRows,
  TableCard,
  TableMessageRow,
  Th,
  cellSubSx,
  rowSx,
  tdSx,
} from '@/components/Desk';
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
import { bbCardSx, bbColors, bbStatusPill } from '@/styles/bb';
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

import BookingsOverview from './partials/BookingsOverview';
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

    getBookings(
      pageNumber,
      sortBy,
      sortDirection,
      effectiveBackendStatus,
      undefined,
      undefined,
      undefined,
      undefined,
      search
    );
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
      <CreateReservationModal isOpen={createReservationModalOpen} onClose={() => toggleCreateReservationModal(false)} />
      <Layout>
        <DeskPage>
          <PageHead
            title={t('common.bookings')}
            subtitle="Confirmed charters, deposits & options"
            actions={<Button onClick={() => toggleCreateReservationModal(true)}>+ Create reservation</Button>}
          />

          <BookingsOverview />

          <DeskTabs
            ariaLabel="Status"
            items={RESERVATION_SYS_TAB_VALUES.map(v => ({ value: v, label: TAB_LABELS[v as TabValue] }))}
            value={statusFilter}
            onChange={v => {
              setStatusFilter(v);
              setParam({ bookingStatus: v === 'all' ? '' : v, page: 1 });
            }}
          />

          <FilterBar>
            <TextField
              placeholder="Search booking number, client name, email…"
              size="small"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              sx={{ flex: '1 1 360px', minWidth: 240 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon sx={{ fontSize: 18 }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchInput ? (
                    <IconButton
                      size="small"
                      onClick={clearSearch}
                      aria-label="Clear search"
                      sx={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: bbColors.gray100 }}
                    >
                      <CloseRoundedIcon sx={{ fontSize: 13 }} />
                    </IconButton>
                  ) : null,
                },
              }}
            />
          </FilterBar>

          {/* Phone: the table becomes a list of cards (same rows, same click target). */}
          <Stack gap={1} sx={{ display: { xs: 'flex', sm: 'none' } }}>
            {isLoading && <EmptyState title="Loading…" />}
            {!isLoading && visibleBookings.length === 0 && (
              <EmptyState title="No bookings match the current filters." illustration="binoculars" />
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
                    key={`m-${b.reservationId}`}
                    role="link"
                    tabIndex={0}
                    onClick={() => openBooking(b)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') openBooking(b);
                    }}
                    sx={{
                      ...bbCardSx,
                      p: '12px 14px',
                      cursor: 'pointer',
                      backgroundColor: isUnviewed ? bbColors.unreadRow : bbColors.white,
                      boxShadow: isUnviewed
                        ? `inset 3px 0 0 ${bbColors.yellow500}, ${bbCardSx.boxShadow}`
                        : bbCardSx.boxShadow,
                    }}
                  >
                    <Stack direction="row" alignItems="center" gap={1}>
                      <Box component="strong" sx={{ fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>
                        {b.reservationNumber ?? `#${b.reservationId}`}
                      </Box>
                      {isUnviewed && <NewTag>New</NewTag>}
                      <Box component="span" sx={{ ...pill.style, ml: 'auto' }}>
                        {pill.label}
                      </Box>
                    </Stack>
                    <Box sx={{ mt: 0.75, fontSize: 13.5, fontWeight: 600 }}>{b.endUser || '—'}</Box>
                    <Box sx={{ fontSize: 13, color: bbColors.gray600 }}>
                      {cleanYacht}
                      {b.yachtName ? ` · ${b.yachtName}` : ''}
                      {b.locationFromName ? ` · ${b.locationFromName}` : ''}
                    </Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mt: 1, fontSize: 12.5 }}>
                      <Box component="span" sx={{ color: bbColors.gray500 }}>
                        {DateTime.formatShortWithoutDay(dayjs(b.reservationDateFrom))} →{' '}
                        {DateTime.formatShortWithoutDay(dayjs(b.reservationDateTo))} · {nights} night
                        {nights === 1 ? '' : 's'}
                      </Box>
                      <Box component="strong" sx={{ color: bbColors.green700 }}>
                        €{formatPrice(b.reservationTotalPrice)}
                      </Box>
                    </Stack>
                  </Box>
                );
              })}
            {totalCount > PAGE_SIZE && (
              <Pager
                page={page}
                totalPages={totalPages}
                onChange={handlePageChange}
                sx={{ ...bbCardSx, borderTop: 0, justifyContent: 'center' }}
              />
            )}
          </Stack>

          <TableCard
            sx={{ display: { xs: 'none', sm: 'block' } }}
            minWidth={1180}
            footer={
              totalCount > PAGE_SIZE ? (
                <Pager
                  page={page}
                  totalPages={totalPages}
                  onChange={handlePageChange}
                  range={`${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, totalCount)} of ${totalCount}`}
                />
              ) : null
            }
          >
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
                ).map((h, i) => (
                  <Th
                    key={h.label || `col-${i}`}
                    align={h.align}
                    active={!!h.sortKey && sortBy === h.sortKey}
                    direction={sortDirection === 'asc' ? 'asc' : 'desc'}
                    onSort={h.sortKey ? () => handleSortClick(h.sortKey!) : undefined}
                  >
                    {h.label}
                  </Th>
                ))}
              </Box>
            </Box>
            <Box component="tbody">
              {isLoading && <SkeletonRows cols={11} />}
              {!isLoading && visibleBookings.length === 0 && (
                <TableMessageRow cols={11} title="No bookings match the current filters." illustration="binoculars" />
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
                      sx={rowSx({ unread: isUnviewed })}
                    >
                      <Box component="td" sx={{ ...tdSx, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                        <Stack direction="row" alignItems="center" gap={0.75}>
                          <Box component="span">{b.reservationNumber ?? `#${b.reservationId}`}</Box>
                          {isUnviewed && <NewTag>New</NewTag>}
                        </Stack>
                      </Box>
                      <Box component="td" sx={{ ...tdSx, color: bbColors.gray500, fontVariantNumeric: 'tabular-nums' }}>
                        {b.reservationUserId != null ? `#${b.reservationUserId}` : '—'}
                      </Box>
                      <Box component="td" sx={tdSx}>
                        <Stack direction="row" alignItems="center" gap={1}>
                          <InitialsAvatar text={initialsOf(b.endUser || '?')} />
                          <Box component="span">{b.endUser || '—'}</Box>
                        </Stack>
                      </Box>
                      <Box component="td" sx={tdSx}>
                        {cleanYacht}
                        {b.yachtName ? ` · ${b.yachtName}` : null}
                        <Box component="span" sx={cellSubSx}>
                          {b.locationFromName ?? '—'}
                        </Box>
                      </Box>
                      <Box component="td" sx={{ ...tdSx, color: bbColors.navy700 }}>
                        {b.agencyName ?? '—'}
                      </Box>
                      <Box component="td" sx={{ ...tdSx, fontVariantNumeric: 'tabular-nums' }}>
                        {DateTime.formatShortWithoutDay(dayjs(b.reservationDateFrom))} →{' '}
                        {DateTime.formatShortWithoutDay(dayjs(b.reservationDateTo))}
                        <Box component="span" sx={cellSubSx}>
                          {nights} night{nights === 1 ? '' : 's'}
                        </Box>
                      </Box>
                      <Box component="td" sx={{ ...tdSx, ...numSx, color: bbColors.green700, fontWeight: 700 }}>
                        €{formatPrice(b.reservationTotalPrice)}
                      </Box>
                      <Box component="td" sx={{ ...tdSx, ...numSx }}>
                        {b.reservationAgencyPrice != null ? `€${formatPrice(b.reservationAgencyPrice)}` : '—'}
                      </Box>
                      <Box component="td" sx={{ ...tdSx, ...numSx, color: bbColors.amber800, fontWeight: 600 }}>
                        {b.reservationCommission != null ? `€${formatPrice(b.reservationCommission)}` : '—'}
                      </Box>
                      <Box component="td" sx={tdSx}>
                        <Box component="span" sx={pill.style}>
                          {pill.label}
                        </Box>
                      </Box>
                      <Box component="td" sx={{ ...tdSx, color: bbColors.gray600 }}>
                        {formatCheckIn(b.reservationDateFrom)}
                      </Box>
                    </Box>
                  );
                })}
            </Box>
          </TableCard>
        </DeskPage>
      </Layout>
    </>
  );
};

const numSx = { textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' };

export default Bookings;
