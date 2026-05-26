import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';

import ModalRoot from '@/components/ModalRoot';
import Close from '@/components/SvgIcons/Close';
import { api } from '@/config/axios.config';
import ReservationsService from '@/services/reservations.service';
import UsersService from '@/services/users.service';
import colors from '@/styles/themes/colors';
import { getBookings, toggleCreateReservationModal } from '@/valtio/bookings/bookings.actions';
import { useBookingsStore } from '@/valtio/bookings/bookings.store';
import { showToast } from '@/valtio/global/global.actions';

import AgencyPicker, { Agency } from './AgencyPicker';
import AmenitiesPicker from './AmenitiesPicker';
import DateRangeField from './DateRangeField';
import LocationPicker, { LocationOption } from './LocationPicker';
import VesselTypePicker from './VesselTypePicker';

/**
 * Admin-wizard for creating a replacement reservation. 4 steps:
 *   0 — pick existing customer (by user id, with preview)
 *   1 — pick yacht (destination + date range → /public/yachts search)
 *   2 — total price + payment phases (editable, can mark paid)
 *   3 — review + submit
 *
 * Intentionally MVP: basic validation, no locale polish, no yacht filters
 * beyond dates + destination. Good enough to unblock the "cancel + new"
 * workflow. Polish follows once the shape is confirmed.
 */

interface CreateReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PickedYacht {
  yachtId: number;
  offerId: number; // resolved asynchronously on pick (0 until resolved)
  slug: string;
  name: string;
  modelName: string;
  clientPriceEur: number;   // per-day from backend; multiply by nights for total
  agencyName: string;
  locationName: string;
  cabins?: number;
  berths?: number;
  maxPersons?: number;
  buildYear?: number;
  // The exact offer window the search view matched for this yacht. Can
  // differ from the admin's requested dates by up to the backend's
  // ±3 day flex window, so we MUST use these values when fetching the
  // concrete offer — otherwise strict-match `/offers` returns [] even
  // though the card lists a price. Populated from YachtSearchResponseDto.
  offerDateFrom?: string;
  offerDateTo?: string;
}

// Customer-facing frontend origin — used for "View on customer site" links in
// the yacht search results. Falls back to dev default if env isn't wired.
const CUSTOMER_WEB_URL = import.meta.env.VITE_CUSTOMER_WEB_URL || 'http://localhost:3000';

interface PhaseRow {
  deadline: Dayjs;
  amount: string; // keep as string during editing to allow empty cells mid-type
  markPaid: boolean;
}

const blankPhase = (deadline: Dayjs, amount = '', markPaid = false): PhaseRow => ({
  deadline,
  amount,
  markPaid,
});

const CreateReservationModal = ({ isOpen, onClose }: CreateReservationModalProps) => {
  const { t } = useTranslation();
  const { createReservationModalOpen } = useBookingsStore();

  // ---- wizard state ------------------------------------------------------
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [submitting, setSubmitting] = useState(false);

  // step 0 — customer
  const [customerIdInput, setCustomerIdInput] = useState('');
  const [customerPreview, setCustomerPreview] = useState<{ id: number; name: string; email: string } | null>(null);
  const [customerError, setCustomerError] = useState('');

  // step 1 — yacht search (Nausys-inspired richer filter set)
  const [destinations, setDestinations] = useState<LocationOption[]>([]);
  const [startDate, setStartDate] = useState<Dayjs>(dayjs().add(30, 'day').startOf('week').add(6, 'day')); // next Saturday ~a month out
  const [endDate, setEndDate] = useState<Dayjs>(dayjs().add(37, 'day').startOf('week').add(6, 'day'));
  const [vesselTypes, setVesselTypes] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<number[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [minCabins, setMinCabins] = useState<string>('');
  const [minPersons, setMinPersons] = useState<string>('');
  // Replacement flow: when the agency swaps a broken yacht onto another one
  // that's already reserved (by the same customer) in the partner system,
  // our availability sync has marked the target yacht UNAVAILABLE. Tick this
  // to include unavailable rows in search so the admin can pick the yacht
  // the agency already assigned.
  const [includeUnavailable, setIncludeUnavailable] = useState(false);
  const [searchResults, setSearchResults] = useState<PickedYacht[]>([]);
  const [searching, setSearching] = useState(false);
  const [pickedYacht, setPickedYacht] = useState<PickedYacht | null>(null);

  // step 2 — price + phases
  const [totalPrice, setTotalPrice] = useState('');
  const [phases, setPhases] = useState<PhaseRow[]>([]);
  const [specialRequest, setSpecialRequest] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [sendOptionEmail, setSendOptionEmail] = useState(false);

  // Reset everything when modal re-opens — stale state from a previous draft
  // would bleed across and confuse the admin.
  useEffect(() => {
    if (!isOpen) return;
    setStep(0);
    setSubmitting(false);
    setCustomerIdInput('');
    setCustomerPreview(null);
    setCustomerError('');
    setDestinations([]);
    setStartDate(dayjs().add(30, 'day').startOf('week').add(6, 'day'));
    setEndDate(dayjs().add(37, 'day').startOf('week').add(6, 'day'));
    setVesselTypes([]);
    setAmenities([]);
    setAgencies([]);
    setMinCabins('');
    setMinPersons('');
    setIncludeUnavailable(false);
    setSearchResults([]);
    setSearching(false);
    setPickedYacht(null);
    setPickingOffer(false);
    setPickOfferError('');
    setTotalPrice('');
    setPhases([]);
    setSpecialRequest('');
    setAdminNotes('');
    setSendOptionEmail(false);
  }, [isOpen]);

  // When a yacht is picked, seed price + default phases (50% now paid, 50% two months before charter start).
  // `clientPriceEur` is PER DAY from the backend — multiply by the selected
  // period length to get the weekly / full-period catalogue total.
  useEffect(() => {
    if (!pickedYacht) return;
    const nights = Math.max(1, endDate.diff(startDate, 'day'));
    // Fictitious-flow yachts (no offer) have null price — leave blank so
    // admin types the total manually. Regular flow seeds the estimate
    // from the per-day catalogue price × nights.
    const perDay = typeof pickedYacht.clientPriceEur === 'number' ? pickedYacht.clientPriceEur : 0;
    const estimated = perDay > 0 ? Math.round(perDay * nights) : 0;
    setTotalPrice(estimated > 0 ? String(estimated) : '');
    const half = estimated > 0 ? (estimated / 2).toFixed(2) : '';
    setPhases([
      blankPhase(dayjs(), half, true), // first installment already paid on the cancelled reservation
      blankPhase(startDate.subtract(60, 'day'), half, false),
    ]);
  }, [pickedYacht]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- customer lookup ---------------------------------------------------
  const handleLookupCustomer = async () => {
    setCustomerError('');
    setCustomerPreview(null);
    const id = Number(customerIdInput.trim());
    if (!Number.isInteger(id) || id <= 0) {
      setCustomerError('Enter a numeric user ID (shown in /users or as #NN on a booking row)');
      return;
    }
    try {
      const user = await UsersService.getUser(id);
      if (!user) {
        setCustomerError(`No user with ID ${id}`);
        return;
      }
      setCustomerPreview({
        id: user.id!,
        name: `${user.name || ''} ${user.surname || ''}`.trim() || '(no name)',
        email: user.email || '(no email)',
      });
    } catch {
      setCustomerError(`Could not fetch user ${id}`);
    }
  };

  // ---- yacht search ------------------------------------------------------
  const handleSearchYachts = async () => {
    setSearching(true);
    setSearchResults([]);
    setPickedYacht(null);
    const res = await ReservationsService.searchYachtsForAdmin({
      did: destinations.map(d => d.id),
      startDate: startDate.format('YYYY-MM-DD'),
      endDate: endDate.format('YYYY-MM-DD'),
      vesselType: vesselTypes.length > 0 ? vesselTypes : undefined,
      amenities: amenities.length > 0 ? amenities : undefined,
      agencyId: agencies.length > 0 ? agencies.map(a => a.id) : undefined,
      minCabins: Number(minCabins) || undefined,
      minPersons: Number(minPersons) || undefined,
      includeUnavailable: includeUnavailable || undefined,
    });
    // Defensive client-side sort — cheapest first. Backend SHOULD honour
    // `sort=clientPrice,asc` but there have been cases where Spring silently
    // ignores the hint (e.g. field name mismatch, mixed offer rows), so we
    // enforce order here regardless of what the server returns.
    // The yacht search endpoint (`/public/yachts`) returns a flattened yacht
    // row with `id` + `slug`, but NO offerId — offers are a separate resource
    // and can contain multiple rows per yacht (different date windows / flex
    // variants). We resolve the concrete offerId when the admin picks a yacht
    // (handlePickYacht below) by calling `/public/yachts/{slug}/offers`.
    const mapped = (res.content || []).map(y => ({
      yachtId: (y as any).id ?? y.yachtId ?? 0,
      offerId: 0, // filled in by handlePickYacht on selection
      slug: y.slug || '',
      name: y.name,
      modelName: y.modelName,
      clientPriceEur: y.clientPriceEur,
      agencyName: y.agencyName,
      locationName: y.location?.name || '',
      cabins: y.cabins,
      berths: y.berths,
      maxPersons: y.maxPersons,
      buildYear: y.buildYear,
      offerDateFrom: (y as any).offerDateFrom ?? undefined,
      offerDateTo: (y as any).offerDateTo ?? undefined,
    }));
    mapped.sort((a, b) => (a.clientPriceEur ?? Number.MAX_VALUE) - (b.clientPriceEur ?? Number.MAX_VALUE));
    setSearchResults(mapped);
    setSearching(false);
  };

  // ---- yacht pick: resolve offerId --------------------------------------
  // Search results don't include offerId — fetch the matching offer for the
  // selected yacht + period here, so the admin's "Next" → create step has
  // a real offer id to POST.
  const [pickingOffer, setPickingOffer] = useState(false);
  const [pickOfferError, setPickOfferError] = useState<string>('');

  const handlePickYacht = async (y: PickedYacht) => {
    setPickingOffer(true);
    setPickOfferError('');
    setPickedYacht(y); // optimistic — card turns blue while offer resolves
    try {
      // Search view returns the offer's actual dates via `offerDateFrom`
      // / `offerDateTo` (can be ±3 days off the admin-selected window
      // thanks to the flex search). Use those when present — `/offers`
      // is strict-equality so a mismatch returns []. Fall back to the
      // form dates only if the search payload didn't carry them.
      const queryFrom = y.offerDateFrom || startDate.format('YYYY-MM-DD');
      const queryTo = y.offerDateTo || endDate.format('YYYY-MM-DD');
      const { data } = await api.get(
        `/public/yachts/${encodeURIComponent(y.slug)}/offers?dateFrom=${queryFrom}&dateTo=${queryTo}`
      );
      const offers = Array.isArray(data) ? data : [];
      const match = offers.find((o: any) => o.dateFrom === queryFrom && o.dateTo === queryTo) || offers[0];
      if (!match?.id) {
        // Replacement flow — this yacht has no offer for the selected week
        // (partner already sold the full period and sync didn't generate an
        // offer row). We go through a SEPARATE "fictitious reservation"
        // backend endpoint that doesn't require an offerId; the wizard only
        // needs the yacht + admin-typed dates + price + phases.
        if (includeUnavailable) {
          setPickedYacht({ ...y, offerId: 0 });
          // Hint, not an error — Next is enabled in replacement mode.
          setPickOfferError(
            'Replacement flow — using admin-entered dates + price. ' +
              'Reservation will be recorded directly (no partner sync).'
          );
        } else {
          setPickOfferError('No offer available for this yacht in the selected period — pick different dates');
          setPickedYacht({ ...y, offerId: 0 });
        }
      } else {
        // Bake the resolved offer window into the picked yacht so later
        // steps (price/phases) operate on the real booking dates, not
        // the loose filter dates the admin typed.
        setPickedYacht({
          ...y,
          offerId: match.id,
          offerDateFrom: match.dateFrom,
          offerDateTo: match.dateTo,
        });
        // Sync the wizard's dates with the actual offer window — so the
        // header banners, nights math, and the check-in field all line
        // up with what will be booked.
        if (match.dateFrom && match.dateFrom !== startDate.format('YYYY-MM-DD')) {
          setStartDate(dayjs(match.dateFrom));
        }
        if (match.dateTo && match.dateTo !== endDate.format('YYYY-MM-DD')) {
          setEndDate(dayjs(match.dateTo));
        }
      }
    } catch {
      setPickOfferError('Failed to fetch offer for this yacht — partner system may be down');
      setPickedYacht({ ...y, offerId: 0 });
    } finally {
      setPickingOffer(false);
    }
  };

  // ---- phase editor helpers ---------------------------------------------
  const addPhase = () => setPhases(prev => [...prev, blankPhase(startDate.subtract(30, 'day'), '', false)]);
  const removePhase = (idx: number) => setPhases(prev => prev.filter((_, i) => i !== idx));
  const updatePhase = (idx: number, patch: Partial<PhaseRow>) =>
    setPhases(prev => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));

  const phasesTotal = useMemo(
    () => phases.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
    [phases]
  );
  const totalPriceNum = Number(totalPrice) || 0;
  const phasesMatchTotal = Math.abs(phasesTotal - totalPriceNum) < 0.01;

  // ---- step gating -------------------------------------------------------
  const canProceed = (): boolean => {
    if (step === 0) return !!customerPreview;
    // Step 1: need a yacht. In regular mode an offer must resolve (offerId>0)
    // because backend's AdminCreateReservationDto requires one. In replacement
    // mode we bypass that — the wizard uses a separate fictitious-reservation
    // endpoint which doesn't need an offerId.
    if (step === 1) {
      if (!pickedYacht || pickingOffer) return false;
      if (includeUnavailable) return true;
      return pickedYacht.offerId > 0;
    }
    if (step === 2) return totalPriceNum > 0 && phases.length > 0 && phasesMatchTotal;
    return true;
  };

  const handleSubmit = async () => {
    if (!customerPreview || !pickedYacht) return;
    setSubmitting(true);
    const sharedPhases = phases.map(p => ({
      deadline: p.deadline.format('YYYY-MM-DD'),
      amount: Number(p.amount),
      markPaid: p.markPaid,
    }));
    // Replacement flow — fictitious reservation with no offer / no partner
    // API call. Lands as RESERVATION (confirmed) in our DB so the customer
    // sees the new yacht on /my-bookings immediately.
    const { payload, message } = includeUnavailable
      ? await ReservationsService.adminCreateFictitiousReservation({
          userId: customerPreview.id,
          yachtId: pickedYacht.yachtId,
          dateFrom: startDate.format('YYYY-MM-DD'),
          dateTo: endDate.format('YYYY-MM-DD'),
          totalPrice: totalPriceNum,
          paymentPhases: sharedPhases,
          adminNotes: adminNotes || undefined,
          specialRequest: specialRequest || undefined,
        })
      : await ReservationsService.adminCreateReservation({
          userId: customerPreview.id,
          yachtId: pickedYacht.yachtId,
          offerId: pickedYacht.offerId,
          totalPrice: totalPriceNum,
          paymentPhases: sharedPhases,
          adminNotes: adminNotes || undefined,
          specialRequest: specialRequest || undefined,
          sendOptionEmail,
        });
    setSubmitting(false);
    if (payload) {
      showToast({ status: 'success', text: `Reservation ${payload.reservationNumber ?? payload.reservationId} created` });
      toggleCreateReservationModal(false);
      onClose();
      // Refresh bookings list so the new row appears immediately
      const pageFromUrl = Number(new URLSearchParams(window.location.search).get('page')) || 1;
      getBookings(pageFromUrl);
    } else {
      showToast({ status: 'error', text: message || 'Failed to create reservation' });
    }
  };

  // ---- step bodies -------------------------------------------------------
  const renderStep0 = () => (
    <Stack spacing={2}>
      <Typography variant="body2" color={colors.black600}>
        Which existing customer is this reservation for? Type the user ID (shown as "#17" on a booking row in
        the list, or the numeric ID column in /users).
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <TextField
          label="User ID"
          value={customerIdInput}
          onChange={e => setCustomerIdInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleLookupCustomer();
          }}
          sx={{ width: 160 }}
          autoFocus
        />
        <Button
          onClick={handleLookupCustomer}
          sx={{
            backgroundColor: '#fff',
            color: '#0b1a2b',
            border: '1px solid #d7dde4',
            fontWeight: 700,
            textTransform: 'none',
            fontSize: 13,
            borderRadius: '6px',
            padding: '8px 16px',
            boxShadow: 'none',
            '&:hover': { backgroundColor: '#fafbfc', borderColor: '#1a4fa8' },
          }}
        >
          Look up
        </Button>
        <Box sx={{ flex: 1 }} />
        <Tooltip
          title="Replacement flow — kod mijenjanja plovila klijentu. Uključi kad agencija premjesti klijenta na yacht koji je u sustavu već označen kao zauzet (npr. oni su ga već dodijelili preko svog sustava). Search u idućem koraku će pokazati i zauzete brodove."
          placement="left"
          arrow
          enterDelay={300}
          slotProps={{
            tooltip: { sx: { fontSize: 12, lineHeight: 1.45, maxWidth: 340, padding: '10px 12px' } },
          }}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={includeUnavailable}
                onChange={e => setIncludeUnavailable(e.target.checked)}
                size="small"
              />
            }
            label={
              <Typography variant="body2" sx={{ fontSize: 12.5, fontWeight: 600, color: colors.black600 }}>
                Include unavailable yachts (replacement flow)
              </Typography>
            }
            sx={{ m: 0 }}
          />
        </Tooltip>
      </Stack>
      {customerError && <Alert severity="error">{customerError}</Alert>}
      {customerPreview && (
        <Alert severity="success" icon={false}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="body1" fontWeight={700}>
                #{customerPreview.id} — {customerPreview.name}
              </Typography>
              <Typography variant="body2">{customerPreview.email}</Typography>
            </Box>
            <Button size="small" onClick={() => setCustomerPreview(null)}>
              Change
            </Button>
          </Stack>
        </Alert>
      )}
    </Stack>
  );

  const renderStep1 = () => (
    <Stack spacing={2}>
      <Typography variant="body2" color={colors.black600}>
        Find a yacht by destination, date range and optional filters. Pick from the results list.
      </Typography>

      {/* Row 1: destination autocomplete + date range picker */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems="center">
        <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
          <LocationPicker value={destinations} onChange={setDestinations} />
        </Box>
        <Box sx={{ flexShrink: 0 }}>
          <DateRangeField
            startDate={startDate}
            endDate={endDate}
            hideLabel
            onChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
          />
        </Box>
      </Stack>

      {/* Row 2: vessel type chips (takes full row on its own for readability) */}
      <VesselTypePicker value={vesselTypes} onChange={setVesselTypes} />

      {/* Row 3: charter company + amenities */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems="flex-start">
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <AgencyPicker value={agencies} onChange={setAgencies} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <AmenitiesPicker value={amenities} onChange={setAmenities} />
        </Box>
      </Stack>

      {/* Row 4: min cabins / persons */}
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <TextField
          label="Min cabins"
          type="number"
          value={minCabins}
          onChange={e => setMinCabins(e.target.value)}
          inputProps={{ min: 0 }}
          sx={{ width: 140 }}
        />
        <TextField
          label="Min persons"
          type="number"
          value={minPersons}
          onChange={e => setMinPersons(e.target.value)}
          inputProps={{ min: 0 }}
          sx={{ width: 140 }}
        />
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <Button
          onClick={handleSearchYachts}
          disabled={searching}
          sx={{
            backgroundColor: '#0b1a2b',
            color: '#fff',
            fontWeight: 700,
            textTransform: 'none',
            fontSize: 13,
            borderRadius: '6px',
            padding: '8px 16px',
            boxShadow: 'none',
            '&:hover': { backgroundColor: '#132333', boxShadow: 'none' },
            '&.Mui-disabled': { backgroundColor: '#e2e8f0', color: '#7b8ca3' },
          }}
        >
          {searching ? 'Searching…' : 'Search yachts'}
        </Button>
        {searchResults.length > 0 && (
          <Typography variant="body2" color={colors.black500} sx={{ fontSize: 12 }}>
            {searchResults.length} yacht{searchResults.length === 1 ? '' : 's'} found
          </Typography>
        )}
        {includeUnavailable && (
          <Typography
            variant="body2"
            sx={{ fontSize: 11.5, fontWeight: 700, color: '#a85a00', ml: 'auto' }}
          >
            Replacement flow — showing unavailable yachts
          </Typography>
        )}
      </Stack>

      {searchResults.length === 0 && !searching && (
        <Typography variant="body2" color={colors.black500} sx={{ fontSize: 12 }}>
          No results yet — set filters and click <strong>Search yachts</strong>.
        </Typography>
      )}

      {pickingOffer && (
        <Alert severity="info">Resolving offer for the selected yacht…</Alert>
      )}
      {pickOfferError && <Alert severity="error">{pickOfferError}</Alert>}

      <Stack spacing={1} sx={{ maxHeight: 480, overflowY: 'auto', pr: 1 }}>
        {searchResults.map(y => {
          // Match by yachtId/slug rather than offerId — search rows
          // carry offerId=0 while the picked entry has the resolved
          // offer id, so offer-based comparison never matches and the
          // card never paints as selected. Yacht identity is stable
          // across the pick flow, which is what we really want.
          const isPicked = pickedYacht?.yachtId === y.yachtId && pickedYacht?.slug === y.slug;
          // Period total (weekly for a 7-day window). `clientPriceEur` is
          // per-day from backend; multiply by the selected period length.
          // Replacement-flow yachts without an offer have null price —
          // admin will set total in Step 2.
          const nights = Math.max(1, endDate.diff(startDate, 'day'));
          const hasPrice = typeof y.clientPriceEur === 'number' && Number.isFinite(y.clientPriceEur);
          const periodTotal = hasPrice ? y.clientPriceEur * nights : 0;
          // Meta row: cabins / berths / persons / build year — mirror the
          // Nausys card's stat row so admin quickly scans the key specs.
          const stats = [
            y.cabins != null ? `${y.cabins} cab` : null,
            y.berths != null ? `${y.berths} berths` : null,
            y.maxPersons != null ? `${y.maxPersons} pax` : null,
            y.buildYear != null ? `${y.buildYear}` : null,
          ].filter(Boolean);
          return (
            <Box
              key={`${y.yachtId}-${y.slug}`}
              onClick={() => handlePickYacht(y)}
              sx={{
                cursor: 'pointer',
                border: `1px solid ${isPicked ? colors.blue500 : colors.black200}`,
                backgroundColor: isPicked ? colors.blue50 : 'transparent',
                borderRadius: 1,
                p: 1.5,
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
                {/* Left column — yacht identity + meta */}
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body1" fontWeight={700} noWrap>
                    {y.modelName} | {y.name}
                  </Typography>
                  <Typography variant="body2" color={colors.black600} sx={{ mt: 0.25 }}>
                    📍 {y.locationName} · {y.agencyName}
                  </Typography>
                  {stats.length > 0 && (
                    <Typography variant="caption" color={colors.black500} sx={{ display: 'block', mt: 0.5 }}>
                      {stats.join(' · ')}
                    </Typography>
                  )}
                  <Typography variant="caption" color={colors.black400} sx={{ display: 'block', mt: 0.25 }}>
                    yacht #{y.yachtId} · offer #{y.offerId}
                  </Typography>
                </Box>

                {/* Right column — pricing + preview */}
                <Stack alignItems="flex-end" spacing={0.5} sx={{ minWidth: 180 }}>
                  <Typography variant="caption" color={colors.black500}>
                    Period price ({nights} days)
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color={colors.blue500}>
                    {hasPrice
                      ? `${periodTotal.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
                      : '— € (set manually)'}
                  </Typography>
                  <Typography variant="caption" color={colors.black500}>
                    {hasPrice ? `${y.clientPriceEur.toFixed(2)} € / day` : 'No offer — enter price in next step'}
                  </Typography>
                  {y.slug && (
                    <Button
                      size="small"
                      variant="text"
                      onClick={e => {
                        // Don't bubble to the card (which would select the yacht) —
                        // admin is just previewing.
                        e.stopPropagation();
                        window.open(`${CUSTOMER_WEB_URL}/boat/${y.slug}`, '_blank', 'noopener,noreferrer');
                      }}
                      sx={{ p: 0, minWidth: 0, fontSize: 12, textTransform: 'none', mt: 0.5 }}
                    >
                      View on customer site ↗
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Stack>
  );

  const renderStep2 = () => (
    <Stack spacing={2}>
      <Alert severity="info" sx={{ alignItems: 'flex-start' }}>
        Admin override: total + phases are NOT derived from the yacht's catalogue price. Customer sees
        exactly what you type below on their /my-bookings page. Tick <strong>Paid</strong> on phase 1 if
        the customer already paid that amount on the cancelled reservation — we'll record it as paid
        without a Stripe charge.
      </Alert>

      <TextField
        label="Total price (€)"
        type="number"
        value={totalPrice}
        onChange={e => setTotalPrice(e.target.value)}
        sx={{ maxWidth: 240 }}
        inputProps={{ min: 0, step: 0.01 }}
      />

      <Divider />

      <Typography variant="body1" fontWeight={700}>
        Payment phases
      </Typography>

      {phases.map((p, idx) => (
        <Stack key={idx} direction="row" spacing={1} alignItems="center">
          <TextField
            label="Due date"
            type="date"
            value={p.deadline.format('YYYY-MM-DD')}
            onChange={e => updatePhase(idx, { deadline: dayjs(e.target.value) })}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 180 }}
          />
          <TextField
            label="Amount (€)"
            type="number"
            value={p.amount}
            onChange={e => updatePhase(idx, { amount: e.target.value })}
            sx={{ width: 160 }}
            inputProps={{ min: 0, step: 0.01 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={p.markPaid}
                onChange={e => updatePhase(idx, { markPaid: e.target.checked })}
              />
            }
            label="Already paid"
          />
          <IconButton onClick={() => removePhase(idx)} disabled={phases.length === 1}>
            <Close size={16} />
          </IconButton>
        </Stack>
      ))}

      <Button variant="outlined" size="small" onClick={addPhase} sx={{ alignSelf: 'flex-start' }}>
        + Add phase
      </Button>

      <Alert severity={phasesMatchTotal ? 'success' : 'warning'}>
        Phases total: <strong>{phasesTotal.toFixed(2)} €</strong> / Total price:{' '}
        <strong>{totalPriceNum.toFixed(2)} €</strong>
        {!phasesMatchTotal && ' — must match before you can create.'}
      </Alert>

      <Divider />

      <TextField
        label="Special request (visible to customer)"
        value={specialRequest}
        onChange={e => setSpecialRequest(e.target.value)}
        multiline
        minRows={2}
      />
      <TextField
        label="Admin notes (internal, not shown to customer)"
        value={adminNotes}
        onChange={e => setAdminNotes(e.target.value)}
        multiline
        minRows={2}
      />
      <FormControlLabel
        control={<Checkbox checked={sendOptionEmail} onChange={e => setSendOptionEmail(e.target.checked)} />}
        label="Send option-created email to customer now (otherwise you notify them manually)"
      />
    </Stack>
  );

  const renderStep3 = () => (
    <Stack spacing={2}>
      <Typography variant="body1" fontWeight={700}>
        Review
      </Typography>
      <Typography variant="body2">
        <strong>Customer:</strong> #{customerPreview?.id} — {customerPreview?.name} ({customerPreview?.email})
      </Typography>
      <Typography variant="body2">
        <strong>Yacht:</strong> {pickedYacht?.modelName} | {pickedYacht?.name} ({pickedYacht?.locationName})
      </Typography>
      <Typography variant="body2">
        <strong>Dates:</strong> {startDate.format('DD MMM YYYY')} → {endDate.format('DD MMM YYYY')}
      </Typography>
      <Typography variant="body2">
        <strong>Total:</strong> {totalPriceNum.toFixed(2)} €
      </Typography>
      <Typography variant="body2" fontWeight={700}>
        Payment phases:
      </Typography>
      {phases.map((p, i) => (
        <Typography key={i} variant="body2" sx={{ pl: 2 }}>
          {i + 1}. {p.deadline.format('DD MMM YYYY')} — {Number(p.amount).toFixed(2)} €{' '}
          {p.markPaid && <span style={{ color: colors.green500 }}>· already paid</span>}
        </Typography>
      ))}
      {specialRequest && (
        <Typography variant="body2">
          <strong>Special request:</strong> {specialRequest}
        </Typography>
      )}
      {adminNotes && (
        <Typography variant="body2">
          <strong>Admin notes:</strong> {adminNotes}
        </Typography>
      )}
      <Alert severity={sendOptionEmail ? 'info' : 'warning'}>
        {sendOptionEmail
          ? 'Option-created email WILL be sent to the customer.'
          : 'No email will be sent — notify the customer manually.'}
      </Alert>
    </Stack>
  );

  const stepTitles = ['Customer', 'Yacht + dates', 'Price + phases', 'Review'];

  return (
    <ModalRoot
      open={isOpen && createReservationModalOpen}
      onClose={onClose}
      title={`Create reservation — step ${step + 1} of 4: ${stepTitles[step]}`}
      width={1100}
      onCancel={onClose}
      cancelBtnText={t('actions.cancel')}
      onConfirm={
        step === 3
          ? handleSubmit
          : () => {
              if (canProceed()) setStep(prev => (prev + 1) as 0 | 1 | 2 | 3);
            }
      }
      confirmBtnText={step === 3 ? (submitting ? 'Creating…' : 'Create reservation') : 'Next'}
      ConfirmBtnProps={{ disabled: !canProceed() || submitting }}
      zIndex={1400}
    >
      {step === 0 && renderStep0()}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step > 0 && (
        <Box mt={3}>
          <Button
            onClick={() => setStep(prev => (prev - 1) as 0 | 1 | 2 | 3)}
            disabled={submitting}
            sx={{
              textTransform: 'none',
              color: '#1a4fa8',
              fontWeight: 700,
              fontSize: 13,
              padding: '4px 8px',
              minWidth: 0,
              backgroundColor: 'transparent',
              '&:hover': { backgroundColor: '#eef3f9' },
            }}
          >
            ← Back
          </Button>
        </Box>
      )}
    </ModalRoot>
  );
};

export default CreateReservationModal;
