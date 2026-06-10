/* eslint-disable @typescript-eslint/no-use-before-define, no-nested-ternary, @typescript-eslint/no-shadow, no-duplicate-imports */
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SailingOutlinedIcon from '@mui/icons-material/SailingOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import {
  Alert,
  Box,
  Button,
  Collapse,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';

import Layout from '@/components/Layout';
import ModalRoot from '@/components/ModalRoot';
import { api } from '@/config/axios.config';
import CatalogueService from '@/services/catalogue.service';
import ReservationsService from '@/services/reservations.service';
import { bbColors, bbFont, bbShadow } from '@/styles/bb';
import colors from '@/styles/themes/colors';
import { showToast } from '@/valtio/global/global.actions';
import AgencyPicker, { Agency } from '@/views/Bookings/partials/CreateReservationModal/AgencyPicker';
import DateRangeField from '@/views/Bookings/partials/CreateReservationModal/DateRangeField';

import {
  BuildYearRangeField,
  Country,
  CountrySelect,
  DENSE_SELECT_MENU_PROPS,
  Manufacturer,
  ManufacturerPicker,
  Model,
  ModelPicker,
  OffersAmenityChips,
  Region,
  RegionMultiSelect,
  VesselTypeDropdown,
} from './filters';
import { CartExtra, CartYacht, buildClientOfferHtml, buildClientOfferWhatsApp, offerYachtKey } from './offerHtml';

/**
 * Internal broker workspace for building a multi-yacht client offer.
 *
 * Left: search filters (destination, dates, yacht type, charter company,
 * amenities, min cabins/persons). Middle: results with admin-only agency
 * name visible + prices + commission hints. Right: selected yachts cart
 * → "Create client offer" generates an HTML table (agency name hidden)
 * that the broker copy-pastes into their own email client.
 *
 * Cart is persisted in localStorage so an accidental refresh doesn't
 * wipe the draft — matches the workflow where the broker builds an
 * offer across 10–15 minutes of back-and-forth with the customer.
 */

const CUSTOMER_WEB_URL = import.meta.env.VITE_CUSTOMER_WEB_URL || 'http://localhost:3000';
const API_URL = import.meta.env.VITE_BOAT_API_URL || '';
// Bump version to v2 (1.5.2026) — v1 cart entries were serialised with the
// old `forceObligatory: true` flag for every offer.extras row, which made
// every yacht's "Selected services" list bloated with optional add-ons.
// Bumping the key auto-discards stale carts so brokers re-add yachts and
// pick up the partner-trusted obligatory flag.
const CART_STORAGE_KEY = 'b4y-admin-offers-cart-v2';
const CURRENCY_STORAGE_KEY = 'b4y-admin-offers-currency-v1';

// Maps the backend ExtrasUnitType enum to the human label shown in the offer.
// Module-scoped so both the add-to-cart extras builder and the live /calculate
// effect (skipper -> Damage Waiver) format units identically.
const UNIT_LABEL: Record<string, string> = {
  PER_WEEK: 'per week',
  PER_WEEK_PERSON: 'per week / person',
  PER_BOOKING: 'per booking',
  PER_BOOKING_PERSON: 'per booking / person',
  PER_NIGHT: 'per night',
  PER_NIGHT_PERSON: 'per person / night',
  PER_BOAT: 'per boat',
  PERCENTAGE: '%',
};

const getBoatImageUrl = (id: number | null | undefined, width = 200): string | null =>
  id == null ? null : `${API_URL}/public/image/${id}?width=${width}`;

// Broker-supported currencies. Backend CurrencyEnum has ~15 more but these
// are the ones the business actually invoices in today (per Mario). Add a
// new entry here + it's just visible in the dropdown — everything below
// looks the currency up from this table.
const CURRENCIES: { code: string; label: string; symbol: string }[] = [
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'USD', label: 'US dollar', symbol: '$' },
  { code: 'GBP', label: 'British pound', symbol: '£' },
  { code: 'AUD', label: 'Australian dollar', symbol: 'A$' },
  { code: 'CAD', label: 'Canadian dollar', symbol: 'C$' },
];

const getCurrencySymbol = (code: string): string => CURRENCIES.find(c => c.code === code)?.symbol || code;

interface SearchRow {
  yachtId: number;
  slug: string;
  name: string;
  modelName: string;
  // Prices are in whatever `currency` was sent with the search — backend
  // converts at request time. The name stays `clientPriceEur` for legacy
  // compatibility (the JPA field / DTO hasn't been renamed yet) but the
  // numeric value reflects the active currency, NOT always EUR.
  clientPriceEur: number;
  listPriceEur: number | null;
  // Broker commission PER DAY — backend divides the total commission by
  // number_of_days in the view, same treatment as client_price. Null when
  // the partner row had no commission value synced (custom yachts, bad
  // catalogue row, etc.) — card falls back to hiding the commission line.
  agencyCommissionEur: number | null;
  currency: string;
  agencyName: string;
  locationName: string;
  locationCountryCode: string | null;
  cabins: number | null;
  maxPersons: number | null;
  buildYear: number | null;
  lengthMeters: number | null;
  vesselType: string | null;
  // Backend catalogue image id. Thumbnail URL is built via
  // `${VITE_BOAT_API_URL}/public/image/{id}?width=200` — same pattern the
  // customer site uses so the admin card reuses the already-cached asset.
  mainImageId: number | null;
  // Pre-reservation state — true when the yacht's best matching offer is
  // OPTION / OPTION_WAITING. The broker CAN still add it to the offer,
  // but needs to know it may not survive until the customer commits.
  isOption: boolean;
  // ISO string (`2026-04-25T23:59:00`) when the option was captured with
  // a timestamp by the partner sync; null when unavailable. Rendered as
  // "Option expires: DD.MM.YYYY HH:mm" next to the "Add to offer" button.
  optionExpiresAt: string | null;
}

// --- typed minimal mirrors of backend YachtDetailsDto ----------------------
// We list only the fields the Offers workspace actually reads. If backend
// renames one, TypeScript catches it at compile time instead of swallowing
// it via `any` and producing a silent runtime miss.
interface YachtImageResponse {
  id?: number;
  url?: string | null;
  mainImage?: boolean;
  position?: number;
}
interface AmenityResponse {
  id?: number;
  name?: string;
  // Each amenity has a reference to the b4y canonical equipment row,
  // which carries `category: SALOON_AND_CABINS | NAVIGATION_AND_SAFETY |
  // ENTERTAINMENT` (mapped to "Comfort/Navigation/Entertainment" labels).
  equipment?: {
    id?: number;
    labelCode?: string;
    category?: string;
  };
  // Some legacy responses sent the category and label inline — keep optional
  // fallback fields so we don't crash on older payloads.
  category?: string;
  label?: string;
  labelCode?: string;
}
interface ExtraResponse {
  id?: number;
  externalId?: number;
  key?: string;
  name?: string;
  priceEur?: number | null;
  obligatory?: boolean;
  payableInBase?: boolean;
  unit?: string | null;
  description?: string | null;
  extras?: { labelCode?: string };
}
interface OfferResponse {
  id?: number;
  dateFrom: string;
  dateTo: string;
  clientPriceEur?: number;
  listPriceEur?: number | null;
  totalDiscountEur?: number | null;
  obligatoryExtrasKeys?: string[];
  extras?: ExtraResponse[];
  checkin?: string;
  checkout?: string;
}
interface YachtDetailsResponse {
  manufacturerName?: string | null;
  vesselType?: string | null;
  length?: number | null;
  berths?: number | null;
  cabins?: number | null;
  wc?: number | null;
  mainSailType?: string | null;
  defaultCheckin?: string | null;
  defaultCheckout?: string | null;
  securityDeposit?: number | null;
  location?: { country?: string | null; name?: string | null } | null;
  yachtImages?: YachtImageResponse[];
  amenities?: AmenityResponse[];
  services?: ExtraResponse[];
  offers?: OfferResponse[];
}

const Offers = () => {
  const { t } = useTranslation();

  // ---- filter state ------------------------------------------------------
  // Currency is persisted separately from the cart — broker usually keeps
  // one default currency across many offers. When the broker switches mid-
  // session we warn about the cart (see handleCurrencyChange) but don't
  // silently drop existing picks.
  const [currency, setCurrency] = useState<string>(() => {
    try {
      return localStorage.getItem(CURRENCY_STORAGE_KEY) || 'EUR';
    } catch {
      return 'EUR';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
    } catch {
      // storage unavailable — no-op, state still works in-memory
    }
  }, [currency]);

  const [country, setCountry] = useState<Country | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [startDate, setStartDate] = useState<Dayjs>(dayjs().add(30, 'day').startOf('week').add(6, 'day'));
  const [endDate, setEndDate] = useState<Dayjs>(dayjs().add(37, 'day').startOf('week').add(6, 'day'));
  const [vesselTypes, setVesselTypes] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<number[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [buildYearFrom, setBuildYearFrom] = useState<string>('');
  const [buildYearTo, setBuildYearTo] = useState<string>('');
  const [minCabins, setMinCabins] = useState<string>('');
  const [minPersons, setMinPersons] = useState<string>('');

  // Clear region + model selections when their parent changes, otherwise
  // stale ids will be sent to the search endpoint and silently filter to
  // zero results.
  useEffect(() => {
    setRegions([]);
  }, [country?.id]);
  useEffect(() => {
    // Manufacturer is now a canonical group holding multiple real ids
    // (e.g. "Lagoon" contains both id=1084 and id=318); keep a picked
    // model only if ANY of its canonical group's ids still match the
    // model's manufacturer.
    setModels(prev =>
      prev.filter(m => (m.manufacturerId == null ? true : manufacturers.some(mf => mf.ids.includes(m.manufacturerId!))))
    );
  }, [manufacturers]);

  const handleCurrencyChange = (next: string) => {
    if (next === currency) return;

    if (cart.length > 0) {
      const confirm = window.confirm(
        `Changing currency from ${currency} to ${next} will clear the current offer ` +
          `(${cart.length} yacht${cart.length === 1 ? '' : 's'}). Continue?`
      );

      if (!confirm) return;

      setCart([]);
    }

    setCurrency(next);
    // Drop stale results — their prices are in the old currency and would
    // confuse the admin; a re-search is always the right next step.
    setResults([]);
    setSearched(false);
  };

  // ---- search state ------------------------------------------------------
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchRow[]>([]);
  const [searched, setSearched] = useState(false);
  // Pagination. Backend caps page size at 100 so we walk through pages for
  // wide searches (300+ yachts). `page` is 0-based. `totalPages` / `totalCount`
  // come from the /public/yachts PagedModel response. Any filter change
  // resets page to 0 via a fresh search.
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // ---- cart state (persisted) --------------------------------------------
  const [cart, setCart] = useState<CartYacht[]>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);

      return raw ? (JSON.parse(raw) as CartYacht[]) : [];
    } catch {
      return [];
    }
  });
  const [addingSlug, setAddingSlug] = useState<string | null>(null);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  // Shown while we re-fetch yacht details for cart entries persisted
  // before a new field was added (e.g. `keyAmenities`). Keeps the
  // "Create client offer" button in a visibly-busy state so the broker
  // doesn't double-click while details load.
  const [openingModal, setOpeningModal] = useState(false);
  // Advanced "More filters" group starts collapsed (company / builder / year).
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // storage full / blocked — keep working without persistence
    }
  }, [cart]);

  // ---- search ------------------------------------------------------------
  // `pageOverride` is only passed by the pagination buttons — a brand new
  // search from the Search button always resets to page 0. Typed as
  // `number | undefined` only; DO NOT let a MouseEvent sneak in via
  // `onClick={handleSearch}` — that would coerce to "[object PointerEvent]"
  // and the backend would silently 400 → empty results.
  const handleSearch = async (pageOverride?: number) => {
    const targetPage = typeof pageOverride === 'number' ? pageOverride : 0;

    if (typeof pageOverride !== 'number') setPage(0);

    setSearching(true);
    setSearched(true);
    setResults([]);

    // Region ids take precedence when picked — otherwise fall back to the
    // country id so backend's location filter scopes the result set at
    // country granularity. `did` accepts both region ("r-6") and country
    // ("c-54") synthetic ids from the LocationView.
    // `flatMap(r => r.ids)` — a merged dual-source region (e.g. "Ionian Islands")
    // carries BOTH provider ids, so one pick searches both yacht pools.
    const did: string[] = regions.length > 0 ? regions.flatMap(r => r.ids) : country ? [country.id] : [];

    try {
      const res = await ReservationsService.searchYachtsForAdmin({
        did,
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        vesselType: vesselTypes.length > 0 ? vesselTypes : undefined,
        amenities: amenities.length > 0 ? amenities : undefined,
        agencyId: agencies.length > 0 ? agencies.map(a => a.id) : undefined,
        // Flatten canonical manufacturer groups back to their raw ids so
        // "Lagoon" (which holds 2 backend rows) filters against both.
        manufacturerId: manufacturers.length > 0 ? manufacturers.flatMap(m => m.ids) : undefined,
        modelId: models.length > 0 ? models.map(m => m.id) : undefined,
        minBuildYear: Number(buildYearFrom) || undefined,
        maxBuildYear: Number(buildYearTo) || undefined,
        minCabins: Number(minCabins) || undefined,
        minPersons: Number(minPersons) || undefined,
        currency,
        page: targetPage,
      });

      setTotalPages(res.page?.totalPages ?? 0);
      setTotalCount(res.page?.totalElements ?? 0);

      // The search endpoint returns a wider row than the admin-reservation
      // flow needs; pick out just what the offer card actually shows.
      const mapped: SearchRow[] = (res.content || []).map(y => ({
        yachtId: y.id ?? y.yachtId ?? 0,
        slug: y.slug || '',
        name: y.name,
        modelName: y.modelName,
        clientPriceEur: Number(y.clientPriceEur) || 0,
        listPriceEur: y.listPriceEur != null ? Number(y.listPriceEur) : null,
        agencyCommissionEur: y.agencyCommissionEur != null ? Number(y.agencyCommissionEur) : null,
        currency,
        agencyName: y.agencyName,
        locationName: y.location?.name || '',
        locationCountryCode: y.location?.countryCode ?? null,
        cabins: y.cabins ?? null,
        maxPersons: y.maxPersons ?? null,
        buildYear: y.buildYear ?? null,
        lengthMeters: y.length != null ? Number(y.length) : null,
        vesselType: y.vesselType ?? null,
        mainImageId: y.mainImageId ?? null,
        isOption: y.isOption === true,
        optionExpiresAt: y.optionExpiresAt ?? null,
      }));

      // Trust backend ordering. A client-side re-sort over the 100 rows of
      // this page would shuffle them against the GLOBAL ascending order —
      // you'd see the last item on page 1 priced higher than the first on
      // page 2, and vice-versa. Backend's `sortBy=asc` orders by total
      // price (clientPrice × days) across all 5K+ rows consistently.
      setResults(mapped);
    } finally {
      setSearching(false);
    }
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 0 || nextPage >= totalPages || nextPage === page) return;

    setPage(nextPage);
    handleSearch(nextPage);
    // Scroll the middle panel back to the top so the broker sees the new
    // page's first rows without having to hunt.
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // older browsers — no-op
    }
  };

  const handleResetFilters = () => {
    setCountry(null);
    setRegions([]);
    setVesselTypes([]);
    setAmenities([]);
    setAgencies([]);
    setManufacturers([]);
    setModels([]);
    setBuildYearFrom('');
    setBuildYearTo('');
    setMinCabins('');
    setMinPersons('');
  };

  // ---- cart add/remove ---------------------------------------------------
  // On "Add to offer" we fetch the rich yacht+offer detail so the generated
  // client HTML can include equipment categories, obligatory extras,
  // security deposit and the actual check-in/out times from the offer.
  // Search results alone lack those fields.
  const handleAddToOffer = async (row: SearchRow) => {
    if (cart.some(c => c.yachtId === row.yachtId && c.dateFrom === startDate.format('YYYY-MM-DD'))) {
      showToast({ status: 'info', text: 'Already in offer for the selected period' });

      return;
    }

    setAddingSlug(row.slug);
    try {
      const { data: yachtDetails } = await api.get<YachtDetailsResponse>(
        `/public/yachts/${encodeURIComponent(row.slug)}?dateFrom=${startDate.format('YYYY-MM-DD')}&dateTo=${endDate.format('YYYY-MM-DD')}&currency=${currency}`
      );
      const offers: OfferResponse[] = yachtDetails?.offers || [];
      const matchedOffer =
        offers.find(o => o.dateFrom === startDate.format('YYYY-MM-DD') && o.dateTo === endDate.format('YYYY-MM-DD')) ||
        offers[0];

      if (!matchedOffer) {
        showToast({ status: 'error', text: 'No offer available for this yacht in the selected period' });

        return;
      }

      const checkin = matchedOffer.checkin || yachtDetails.defaultCheckin || '';
      const checkout = matchedOffer.checkout || yachtDetails.defaultCheckout || '';

      // Backend exposes equipment as `amenities: YachtEquipmentDto[]` where
      // each entry has `name` (the per-yacht label, may be the localised
      // partner string) and an `equipment.{labelCode, category}` reference
      // to the canonical b4y catalogue. Group by canonical category so the
      // HTML output mirrors customer-site grouping ("Comfort / Navigation /
      // Entertainment") rather than dumping a flat list under a generic
      // "Equipment" bucket.
      const CATEGORY_LABELS: Record<string, string> = {
        SALOON_AND_CABINS: 'Comfort',
        NAVIGATION_AND_SAFETY: 'Navigation',
        ENTERTAINMENT: 'Entertainment',
      };
      // Same curated label_codes as the customer listing card
      // (BoatListingItemCard.AMENITY_ICON_MAP) so the email highlights
      // the same "headline" amenities a customer would see while
      // browsing. Order here doesn't matter — we preserve the backend's
      // filterOrder-sorted order from yachtDetails.amenities.
      const KEY_AMENITY_LABEL_CODES = new Set([
        'air-conditioning',
        'autopilot',
        'dinghy',
        'generator',
        'wifi',
        'bimini',
        'outside-GPS-plotter',
        'outside-shower',
        'cooker',
        'fridge',
        'water-toys',
        'snorkel-sets',
        'solar-panels',
        'bow-thruster',
        'radar',
        'heating',
      ]);
      const groupedAmenities: Record<string, string[]> = {};
      const keyAmenitiesAccum: { labelCode: string; label: string }[] = [];
      const seenKeyCodes = new Set<string>();

      (yachtDetails.amenities || []).forEach(a => {
        const rawCat = a.equipment?.category || a.category;
        const cat = (rawCat && CATEGORY_LABELS[rawCat]) || rawCat || 'Equipment';
        const labelCode = a.equipment?.labelCode || a.labelCode;
        const label = a.name || labelCode || a.label;

        if (!label) return;

        if (!groupedAmenities[cat]) groupedAmenities[cat] = [];

        groupedAmenities[cat].push(String(label));

        if (labelCode && KEY_AMENITY_LABEL_CODES.has(labelCode) && !seenKeyCodes.has(labelCode)) {
          seenKeyCodes.add(labelCode);
          keyAmenitiesAccum.push({ labelCode, label: String(label) });
        } else if (/water\s*-?\s*maker|desalinat/i.test(String(label)) && !seenKeyCodes.has('watermaker')) {
          // Watermaker is a premium feature buyers ask about, but the partner
          // data has NO reliable labelCode for it (seen live as `waste-tank`,
          // empty string, etc.) — so match by NAME. The regex catches
          // "Water maker" / "Watermaker" / "desalinator" but NOT "water pump",
          // "water hose" or "hot water" (none contain "maker"/"desalin").
          seenKeyCodes.add('watermaker');
          keyAmenitiesAccum.push({ labelCode: 'watermaker', label: 'Watermaker' });
        }
      });

      // Cap at 4 pills so the title row stays tight even on narrow
      // clients — listing card uses 3, email has slightly more width so
      // we allow one extra.
      const keyAmenities = keyAmenitiesAccum.slice(0, 4);

      // Main yacht image URL — `mainImage` flag wins, fall back to the
      // first image when the partner sync hasn't tagged one. Null when
      // the yacht has no images at all (custom yachts before upload, or
      // partner row that came without media).
      const images: YachtImageResponse[] = yachtDetails.yachtImages || [];
      // Image rows carry the catalogue `id`, not a ready `.url` (the sync leaves
      // url null), so the offer email showed the "Yacht photo" placeholder. Build
      // the public image URL from the id exactly like the cart thumbnail does
      // (`/public/image/{id}` is auth-free, so it loads inside the client's email
      // client too). Prefer an explicit `.url` if a row ever carries one.
      const mainImg = images.find(i => i?.mainImage) || images[0];
      const imageUrl: string | null =
        mainImg?.url || getBoatImageUrl(row.mainImageId, 800) || getBoatImageUrl(mainImg?.id, 800);

      // Build the cart extras list from BOTH sources:
      //   1. offer.extras   — obligatory/extras the partner attached to THIS
      //                       offer (APA, tourist tax, hostess on crewed)
      //   2. yacht.services — full yacht-level catalogue (SEABOB, FUN PACK,
      //                       scooters, etc.) synced from the partner yacht
      //                       details endpoint. Most of the 30+ optional
      //                       extras from partner pages live ONLY here.
      // Key by a stable identifier (label-code / external-id / name) so an
      // item present on both levels (e.g. APA) doesn't appear twice. Prefer
      // offer-level data where both exist — it carries period-specific price.
      const toCartExtra = (
        e: ExtraResponse,
        forceObligatory: boolean
      ): {
        key: string;
        value: {
          name: string;
          priceEur: number | null;
          included: boolean;
          obligatory: boolean;
          description?: string | null;
          unit?: string | null;
        };
      } => {
        const priceNum = e.priceEur != null ? Number(e.priceEur) : null;
        const name = e.name || e.extras?.labelCode || e.key || 'Extra';
        // Stable de-dup key: externalId first, then partner row id (`e.key`),
        // then catalogue labelCode, then name+price. The partner row id wins
        // over labelCode because the same partner row appears on BOTH
        // yacht.services (with labelCode mapped) and offer.extras (with
        // labelCode null) — keying on labelCode broke the merge and rendered
        // "Charter package" twice. obligatoryExtrasKeys uses `e.key` too.
        const key = String(
          e.externalId ?? e.key ?? e.extras?.labelCode ?? `${name.toLowerCase().trim()}-${priceNum ?? '-'}`
        );

        return {
          key,
          value: {
            name,
            priceEur: priceNum,
            included: priceNum != null && priceNum === 0,
            obligatory:
              forceObligatory ||
              e.obligatory === true ||
              (e.key != null && (matchedOffer.obligatoryExtrasKeys || []).includes(e.key)),
            description: e.description ?? null,
            unit: e.unit ? (UNIT_LABEL[e.unit] ?? null) : null,
          },
        };
      };

      const extrasMap = new Map<string, ReturnType<typeof toCartExtra>['value']>();

      (yachtDetails.services || []).forEach(s => {
        const { key, value } = toCartExtra(s, false);

        extrasMap.set(key, value);
      });
      // Offer-level data wins where the partner sent period-specific values,
      // but DO NOT force-flag every offer.extras row as obligatory — trust the
      // partner-side `obligatory` boolean instead. Forcing it caused yachts with
      // large optional services lists (Excess 11: Extra towels, Crew change,
      // Transfer, etc.) to dominate the offer card while yachts with leaner
      // partner data (Bali 4.3) looked clean — visually inconsistent across
      // the same offer. obligatoryExtrasKeys still pins items the partner
      // explicitly tagged.
      (matchedOffer.extras || []).forEach(e => {
        const { key, value } = toCartExtra(e, false);
        // Merge: keep richer description when offer-level lacks one.
        const existing = extrasMap.get(key);

        if (existing && !value.description && existing.description) {
          value.description = existing.description;
        }

        extrasMap.set(key, value);
      });

      const extras = Array.from(extrasMap.values());

      // Backend extrasKey of the Skipper / Hostess rows, if the partner synced
      // them. Sent to /calculate so NauSys re-quotes obligatory extras (Damage
      // Waiver) when the broker toggles crew on. Exact name match first, then a
      // loose contains — excluding the separate "Additional fee for Skipper..."
      // surcharge row, which is NOT the bareboat-skipper service.
      const findCrewKey = (kw: string): string | null => {
        const pool: ExtraResponse[] = [...(matchedOffer.extras || []), ...(yachtDetails.services || [])];
        const exact = pool.find(e => (e.name || '').trim().toLowerCase() === kw);
        const loose = pool.find(
          e => (e.name || '').toLowerCase().includes(kw) && !(e.name || '').toLowerCase().includes('additional fee')
        );

        return (exact || loose)?.key ?? null;
      };

      const entry: CartYacht = {
        yachtId: row.yachtId,
        offerId: matchedOffer.id,
        skipperKey: findCrewKey('skipper'),
        hostessKey: findCrewKey('hostess'),
        slug: row.slug,
        name: row.name,
        modelName: row.modelName,
        manufacturerName: yachtDetails.manufacturerName || null,
        vesselType: yachtDetails.vesselType || row.vesselType || null,
        agencyName: row.agencyName,
        locationName: row.locationName,
        country: yachtDetails.location?.country || null,
        base: yachtDetails.location?.name || row.locationName,
        buildYear: row.buildYear,
        lengthMeters: row.lengthMeters ?? (yachtDetails.length != null ? Number(yachtDetails.length) : null),
        berths: yachtDetails.berths ?? null,
        cabins: yachtDetails.cabins ?? row.cabins ?? null,
        wc: yachtDetails.wc ?? null,
        mainSailType: yachtDetails.mainSailType ?? null,
        dateFrom: startDate.format('YYYY-MM-DD'),
        dateTo: endDate.format('YYYY-MM-DD'),
        checkin,
        checkout,
        clientPriceEur: Number(matchedOffer.clientPriceEur) || row.clientPriceEur,
        listPriceEur: matchedOffer.listPriceEur != null ? Number(matchedOffer.listPriceEur) : row.listPriceEur,
        discountEur: matchedOffer.totalDiscountEur != null ? Number(matchedOffer.totalDiscountEur) : null,
        securityDepositEur: yachtDetails.securityDeposit != null ? Number(yachtDetails.securityDeposit) : null,
        // Snapshot the currency at add-time. Keeps the HTML output stable
        // even if the broker later flips the global currency selector.
        // handleCurrencyChange empties the cart on a global switch, so a
        // single offer always renders in one currency.
        currency,
        currencySymbol: getCurrencySymbol(currency),
        equipmentByCategory: groupedAmenities,
        extras,
        imageUrl,
        // Public boat detail URL — the customer can click straight from
        // the email back to the listing on boat4you. Same path the search
        // card's "View on customer site" button opens.
        detailUrl: `${CUSTOMER_WEB_URL}/boat/${row.slug}`,
        keyAmenities,
        isOption: row.isOption,
        optionExpiresAt: row.optionExpiresAt,
      };

      setCart(prev => [...prev, entry]);
      showToast({ status: 'success', text: `${row.modelName} | ${row.name} added to offer` });
    } catch {
      showToast({ status: 'error', text: 'Failed to fetch yacht details — try again' });
    } finally {
      setAddingSlug(null);
    }
  };

  const handleRemoveFromCart = (yachtId: number, dateFrom: string) => {
    setCart(prev => prev.filter(c => !(c.yachtId === yachtId && c.dateFrom === dateFrom)));
  };

  // Before opening the preview modal, top up any cart entries persisted
  // from older sessions that pre-date fields added later (currently just
  // `keyAmenities`, added 23.4.2026). We intentionally DO NOT reset prices
  // / extras / equipment — those were snapshotted at add-time in the
  // currency the broker had active, and the partner may have changed
  // prices or catalogue since. Only the missing new field is hydrated.
  const KEY_AMENITY_LABEL_CODES_GLOBAL = new Set([
    'air-conditioning',
    'autopilot',
    'dinghy',
    'generator',
    'wifi',
    'bimini',
    'outside-GPS-plotter',
    'outside-shower',
    'cooker',
    'fridge',
    'water-toys',
    'snorkel-sets',
    'solar-panels',
    'bow-thruster',
    'radar',
    'heating',
  ]);

  const handleOpenOfferModal = async () => {
    // Top up entries that pre-date a field added later — keyAmenities
    // (23.4.2026) or imageUrl (28.5.2026; older carts cached a null image
    // before the /public/image fallback landed, so the offer rendered the
    // "Yacht photo" placeholder). Only the missing field is re-fetched;
    // prices / extras stay snapshotted at add-time.
    const missing = cart.filter(c => !c.keyAmenities || c.keyAmenities.length === 0 || !c.imageUrl);

    if (missing.length === 0) {
      setOfferModalOpen(true);

      return;
    }

    setOpeningModal(true);
    try {
      const hydrated = await Promise.all(
        cart.map(async entry => {
          if (entry.keyAmenities && entry.keyAmenities.length > 0 && entry.imageUrl) return entry;

          try {
            const { data } = await api.get<YachtDetailsResponse>(
              `/public/yachts/${encodeURIComponent(entry.slug)}?dateFrom=${entry.dateFrom}&dateTo=${entry.dateTo}&currency=${entry.currency}`
            );
            const keyAccum: { labelCode: string; label: string }[] = [];
            const seen = new Set<string>();

            (data.amenities || []).forEach(a => {
              const labelCode = a.equipment?.labelCode || a.labelCode;
              const label = a.name || labelCode || a.label;

              if (!label) return;

              if (labelCode && KEY_AMENITY_LABEL_CODES_GLOBAL.has(labelCode) && !seen.has(labelCode)) {
                seen.add(labelCode);
                keyAccum.push({ labelCode, label: String(label) });
              } else if (/water\s*-?\s*maker|desalinat/i.test(String(label)) && !seen.has('watermaker')) {
                // Match watermaker by NAME — partner data has no reliable
                // labelCode for it (see handleAddToOffer for the same logic).
                seen.add('watermaker');
                keyAccum.push({ labelCode: 'watermaker', label: 'Watermaker' });
              }
            });

            // Backfill the hero image the same way handleAddToOffer does:
            // the sync leaves yachtImages[].url null, so build the auth-free
            // /public/image/{id} URL from the mainImage-flagged row (it
            // renders inside the client's email too). Keep an existing one.
            const imgs = data.yachtImages || [];
            const mainImg = imgs.find(i => i?.mainImage) || imgs[0];
            const imageUrl = entry.imageUrl || mainImg?.url || getBoatImageUrl(mainImg?.id, 800);

            return {
              ...entry,
              keyAmenities: entry.keyAmenities?.length ? entry.keyAmenities : keyAccum.slice(0, 4),
              imageUrl,
            };
          } catch {
            // Leave entry as-is with empty amenities — failing one yacht
            // shouldn't block the whole offer preview.
            return { ...entry, keyAmenities: entry.keyAmenities || [] };
          }
        })
      );

      setCart(hydrated);
    } finally {
      setOpeningModal(false);
      setOfferModalOpen(true);
    }
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;

    if (window.confirm(`Clear all ${cart.length} yacht${cart.length === 1 ? '' : 's'} from offer?`)) {
      setCart([]);
    }
  };

  // ---- generate + copy ---------------------------------------------------
  // Skipper / Hostess toggles — broker flips them on when the inquiry
  // asked for crewed sailing so the offer surfaces those costs (per-yacht
  // skipper/hostess prices already arrive from partner sync inside
  // CartYacht.extras; we just un-hide the rows here).
  const [includeSkipper, setIncludeSkipper] = useState<boolean>(false);
  const [includeHostess, setIncludeHostess] = useState<boolean>(false);

  const offerOptions = useMemo(() => ({ includeSkipper, includeHostess }), [includeSkipper, includeHostess]);

  // When the broker toggles Skipper / Hostess on, re-quote each cart yacht's
  // offer against the partner (the same /calculate endpoint the customer boat
  // page uses) and capture any newly-obligatory extras — chiefly the NauSys
  // Damage Waiver that becomes mandatory once a Skipper is added. The offer
  // builders then surface those exactly like the customer site. Best-effort: a
  // failed call or a non-NauSys yacht just keeps its statically-synced extras.
  const [autoObligatoryByYacht, setAutoObligatoryByYacht] = useState<Record<string, CartExtra[]>>({});

  useEffect(() => {
    if ((!includeSkipper && !includeHostess) || cart.length === 0) {
      setAutoObligatoryByYacht({});

      return undefined;
    }

    let cancelled = false;

    (async () => {
      const results = await Promise.all(
        cart.map(async y => {
          const selected = [includeSkipper ? y.skipperKey : null, includeHostess ? y.hostessKey : null].filter(
            (k): k is string => !!k
          );

          if (y.offerId == null || selected.length === 0) return null;

          const calc = await CatalogueService.calculateOfferPrice(y.slug, y.offerId, selected, y.currency);

          if (!calc) return null;

          const rows: CartExtra[] = [...(calc.selectedExtrasInPrice || []), ...(calc.selectedExtrasAtBase || [])]
            .filter(e => e.obligatory)
            .map(e => ({
              name: e.name,
              priceEur: e.priceEur != null ? Number(e.priceEur) : null,
              included: e.priceEur != null && Number(e.priceEur) === 0,
              obligatory: true,
              description: null,
              unit: e.unit ? (UNIT_LABEL[e.unit] ?? null) : null,
            }));

          return { key: offerYachtKey(y), rows };
        })
      );

      if (cancelled) return;

      const map: Record<string, CartExtra[]> = {};

      results.forEach(r => {
        if (r) map[r.key] = r.rows;
      });

      setAutoObligatoryByYacht(map);
    })();

    return () => {
      cancelled = true;
    };
  }, [includeSkipper, includeHostess, cart, currency]);

  const clientOfferHtml = useMemo(
    () => buildClientOfferHtml(cart, offerOptions, autoObligatoryByYacht),
    [cart, offerOptions, autoObligatoryByYacht]
  );
  const clientOfferWhatsApp = useMemo(
    () => buildClientOfferWhatsApp(cart, offerOptions, autoObligatoryByYacht),
    [cart, offerOptions, autoObligatoryByYacht]
  );

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(clientOfferHtml);
      showToast({ status: 'success', text: 'HTML copied — paste it into your email' });
    } catch {
      showToast({ status: 'error', text: 'Clipboard write blocked — select and copy manually' });
    }
  };

  const handleCopyRichText = async () => {
    // Rich-text clipboard: writes both the raw HTML (for Gmail's "paste as
    // rich text") and a plain-text fallback in one Clipboard item. Most
    // webmail composers interpret the text/html payload and keep the
    // formatting on paste.
    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
        const blob = new Blob([clientOfferHtml], { type: 'text/html' });
        const plain = new Blob([cart.map(c => `${c.modelName} | ${c.name}`).join('\n')], { type: 'text/plain' });

        await navigator.clipboard.write([new ClipboardItem({ 'text/html': blob, 'text/plain': plain })]);
        showToast({ status: 'success', text: 'Rich text copied — paste into Gmail/Outlook' });
      } else {
        await handleCopyHtml();
      }
    } catch {
      await handleCopyHtml();
    }
  };

  const handleCopyWhatsApp = async () => {
    try {
      await navigator.clipboard.writeText(clientOfferWhatsApp);
      showToast({ status: 'success', text: 'WhatsApp text copied — paste into chat' });
    } catch {
      showToast({ status: 'error', text: 'Clipboard write blocked — select and copy manually' });
    }
  };

  // ---- render ------------------------------------------------------------
  const nights = Math.max(1, endDate.diff(startDate, 'day'));

  return (
    <Layout>
      <Stack
        direction="row"
        sx={{ backgroundColor: bbColors.gray50, minHeight: 600, alignItems: 'stretch', pt: '54px', fontFamily: bbFont.stack }}
      >
        {/* === LEFT PANEL: filters ============================================ */}
        {/* Filters are grouped into labelled SECTIONs (uppercase small caps) so
            the broker can scan the panel vertically by category — matches the
            Claude.ai Offer Builder mockup. `Section` is a local helper (see
            below the main component) that stacks the label + control(s). */}
        <Box
          sx={{
            width: 320,
            flexShrink: 0,
            backgroundColor: colors.white,
            borderRight: `1px solid ${bbColors.gray200}`,
            p: 2,
            // Uniform control typography across the whole filter panel: MUI
            // inputs (Select/Autocomplete/TextField) default to 16px while
            // chips render 13px, so Destination read bigger than the region
            // chips next to it. One container rule beats per-field overrides.
            '& .MuiInputBase-input': { fontSize: 13 },
            '& .MuiChip-label': { fontSize: 13 },
          }}
        >
          <Typography variant="h3" fontWeight={700} sx={{ fontSize: 18, mb: 0.25, color: bbColors.navy900 }}>
            Search yachts
          </Typography>
          <Typography variant="body2" color={bbColors.gray500} sx={{ fontSize: 12, mb: 2 }}>
            Pick yachts → build offer → copy HTML into email.
          </Typography>

          <Stack spacing={1.25}>
            <Section label="Currency">
              <FormControl fullWidth size="small">
                <Select
                  value={currency}
                  MenuProps={DENSE_SELECT_MENU_PROPS}
                  onChange={e => handleCurrencyChange(String(e.target.value))}
                >
                  {CURRENCIES.map(c => (
                    <MenuItem key={c.code} value={c.code}>
                      {c.symbol}&nbsp;&nbsp;{c.code} — {c.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Section>

            <Section label="Dates">
              <DateRangeField
                startDate={startDate}
                endDate={endDate}
                hideLabel
                onChange={(s, e) => {
                  setStartDate(s);
                  setEndDate(e);
                }}
              />
              <Typography variant="body2" color={bbColors.gray500} sx={{ fontSize: 11, mt: 0.5 }}>
                {nights} {nights === 1 ? 'night' : 'nights'}
              </Typography>
            </Section>

            <Section label="Destination">
              <Stack spacing={1}>
                <CountrySelect value={country} onChange={setCountry} />
                <RegionMultiSelect countryCode={country?.countryCode || null} value={regions} onChange={setRegions} />
              </Stack>
            </Section>

            <Section label="Yacht type">
              <VesselTypeDropdown value={vesselTypes} onChange={setVesselTypes} />
            </Section>

            <Section label="Amenities">
              <OffersAmenityChips value={amenities} onChange={setAmenities} />
            </Section>

            <Section label="Capacity">
              <Stack direction="row" spacing={1}>
                <TextField
                  placeholder="Min cabins"
                  type="number"
                  value={minCabins}
                  onChange={e => setMinCabins(e.target.value)}
                  size="small"
                  inputProps={{ min: 0 }}
                  fullWidth
                />
                <TextField
                  placeholder="Min persons"
                  type="number"
                  value={minPersons}
                  onChange={e => setMinPersons(e.target.value)}
                  size="small"
                  inputProps={{ min: 0 }}
                  fullWidth
                />
              </Stack>
            </Section>

            {/* Advanced filters tucked behind a toggle — keeps the panel short
                and easy on the eye; brokers expand only when they need to scope
                by company / builder / build year. */}
            <CollapsibleSection
              label="More filters"
              hint="company · builder · year"
              open={moreFiltersOpen}
              onToggle={() => setMoreFiltersOpen(o => !o)}
            >
              <Stack spacing={1.75}>
                <Section label="Charter company">
                  <AgencyPicker value={agencies} onChange={setAgencies} hideLabel />
                </Section>

                <Section label="Builder & model">
                  <Stack spacing={1}>
                    <ManufacturerPicker value={manufacturers} onChange={setManufacturers} />
                    <ModelPicker
                      manufacturerIds={manufacturers.flatMap(m => m.ids)}
                      value={models}
                      onChange={setModels}
                    />
                  </Stack>
                </Section>

                <Section label="Build year">
                  <BuildYearRangeField
                    from={buildYearFrom}
                    to={buildYearTo}
                    onChange={(f, t) => {
                      setBuildYearFrom(f);
                      setBuildYearTo(t);
                    }}
                  />
                </Section>
              </Stack>
            </CollapsibleSection>

            <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
              <Button
                variant="contained"
                onClick={() => handleSearch()}
                disabled={searching}
                fullWidth
                sx={{
                  backgroundColor: bbColors.yellow500,
                  color: bbColors.yellowText,
                  boxShadow: bbShadow.yellowCta,
                  '&:hover': { backgroundColor: '#f7c83d', boxShadow: bbShadow.yellowCta },
                  '&:disabled': { backgroundColor: '#f6e8bd', color: '#a08a45', boxShadow: 'none' },
                  textTransform: 'none',
                  fontWeight: 800,
                }}
              >
                {searching ? 'Searching…' : 'Search'}
              </Button>
              <Button
                variant="outlined"
                onClick={handleResetFilters}
                sx={{ textTransform: 'none', color: bbColors.gray500, borderColor: bbColors.gray300 }}
              >
                Reset
              </Button>
            </Stack>
          </Stack>
        </Box>

        {/* === MIDDLE PANEL: results ========================================== */}
        <Box sx={{ flex: 1, minWidth: 0, p: 2 }}>
          {/* Header row — count + "matching your filters" subtitle on the
              left, pill-style date range / nights / currency chips on the
              right mirroring the mockup. Search-active filters aren't
              echoed here because the left panel already shows them —
              keeping this row sparse so the results take the focus. */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}
          >
            <Stack direction="row" alignItems="baseline" gap={1} sx={{ flexWrap: 'wrap' }}>
              <Typography variant="h4" fontWeight={700} sx={{ fontSize: 20 }}>
                {searched ? `${totalCount} yacht${totalCount === 1 ? '' : 's'} found` : 'No search yet'}
              </Typography>
              {searched && (
                <Typography variant="body2" color={bbColors.gray500} sx={{ fontSize: 13 }}>
                  matching your filters
                  {totalPages > 1 ? ` · page ${page + 1} of ${totalPages}` : ''}
                </Typography>
              )}
            </Stack>
            <Stack direction="row" alignItems="center" gap={0.75} sx={{ flexWrap: 'wrap' }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1.25,
                  py: 0.5,
                  borderRadius: '8px',
                  border: `1px solid ${bbColors.gray200}`,
                  backgroundColor: colors.white,
                  fontSize: 12,
                  fontWeight: 700,
                  color: bbColors.navy900,
                }}
              >
                <Box component="span" sx={{ fontSize: 13 }}>
                  📅
                </Box>
                {startDate.format('DD MMM')} → {endDate.format('DD MMM YYYY')}
              </Box>
              <Box
                sx={{
                  px: 1.25,
                  py: 0.5,
                  borderRadius: '8px',
                  border: `1px solid ${bbColors.gray200}`,
                  backgroundColor: colors.white,
                  fontSize: 12,
                  fontWeight: 700,
                  color: bbColors.navy900,
                }}
              >
                {nights} {nights === 1 ? 'day' : 'days'}
              </Box>
              <Box
                sx={{
                  px: 1.25,
                  py: 0.5,
                  borderRadius: '8px',
                  border: `1px solid ${bbColors.gray200}`,
                  backgroundColor: colors.white,
                  fontSize: 12,
                  fontWeight: 700,
                  color: bbColors.navy900,
                }}
              >
                {currency}
              </Box>
              {/* Sort dropdown — backend supports asc|desc|lowestPrepayment|
                  lengthAsc|lengthDesc|recommendedScore but the offers
                  workspace uses ONLY "asc" today (cheapest first across all
                  pages). The select is a visual placeholder matching the
                  mockup; wiring extra sort options is a follow-up. */}
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <Select
                  value="asc"
                  disabled
                  sx={{
                    fontSize: 12,
                    fontWeight: 600,
                    height: 30,
                    '.MuiSelect-select': { py: 0.5 },
                    backgroundColor: colors.white,
                  }}
                >
                  <MenuItem value="asc" sx={{ fontSize: 12 }}>
                    Sort: Price ↑
                  </MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Stack>

          {!searched && (
            <EmptyState
              icon={<SearchOutlinedIcon sx={{ fontSize: 22 }} />}
              title="Start with the filters"
              sub="Pick dates, destination and yacht type on the left, then hit Search."
            />
          )}

          {searched && !searching && results.length === 0 && (
            <EmptyState
              icon={<SailingOutlinedIcon sx={{ fontSize: 22 }} />}
              title="No yachts match"
              sub="Try loosening a filter or two — different dates or fewer amenities usually help."
            />
          )}

          <Stack spacing={1}>
            {results.map(row => {
              const periodTotal = row.clientPriceEur * nights;
              const listPeriodTotal = row.listPriceEur != null ? row.listPriceEur * nights : null;
              const hasDiscount = listPeriodTotal != null && listPeriodTotal > periodTotal;
              const inCart = cart.some(c => c.yachtId === row.yachtId && c.dateFrom === startDate.format('YYYY-MM-DD'));
              const rowSymbol = getCurrencySymbol(row.currency);
              const stats = [
                row.cabins != null ? `${row.cabins} cab` : null,
                row.maxPersons != null ? `${row.maxPersons} pax` : null,
                row.lengthMeters != null ? `${row.lengthMeters.toFixed(2)} m` : null,
                row.buildYear != null ? `${row.buildYear}` : null,
              ].filter(Boolean);

              // Format `2026-04-25T23:59:00` → `25.04.2026 23:59` for the
              // option-expires line. Defensive against backend strings with
              // missing time portion (falls back to date-only).
              const optionExpiresText = row.optionExpiresAt
                ? (() => {
                    const [datePart, timePart = ''] = row.optionExpiresAt.split('T');
                    const [y, m, d] = datePart.split('-');
                    const hm = timePart ? timePart.slice(0, 5) : '';

                    return hm ? `${d}.${m}.${y} ${hm}` : `${d}.${m}.${y}`;
                  })()
                : null;

              const thumbUrl = getBoatImageUrl(row.mainImageId, 200);
              const statsPills: Array<{ label: string; value: string }> = [];

              if (row.cabins != null) statsPills.push({ label: 'Cab', value: String(row.cabins) });

              if (row.maxPersons != null) statsPills.push({ label: 'Pax', value: String(row.maxPersons) });

              if (row.lengthMeters != null) statsPills.push({ label: 'L', value: `${row.lengthMeters.toFixed(2)} m` });

              if (row.buildYear != null) statsPills.push({ label: 'Year', value: String(row.buildYear) });

              return (
                <Box
                  key={`${row.yachtId}-${row.slug}`}
                  sx={{
                    border: `1px solid ${inCart ? '#a8e7c4' : row.isOption ? '#f4e7a8' : bbColors.cardBorder}`,
                    backgroundColor: inCart ? '#f6fdf9' : row.isOption ? '#fffdf2' : colors.white,
                    borderRadius: '12px',
                    p: 1.5,
                  }}
                >
                  <Stack direction="row" alignItems="stretch" gap={1.5}>
                    {/* Thumbnail — square-ish tile so a row of cards reads
                        like a consistent grid. Falls back to a grey tile
                        with model name when the yacht has no synced image. */}
                    <Box
                      sx={{
                        width: 96,
                        height: 96,
                        flexShrink: 0,
                        borderRadius: '8px',
                        backgroundColor: bbColors.gray100,
                        backgroundImage: thumbUrl ? `url(${thumbUrl})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: colors.black500,
                        fontSize: 11,
                        fontWeight: 600,
                        textAlign: 'center',
                        p: 0.5,
                      }}
                    >
                      {!thumbUrl && row.modelName}
                    </Box>

                    {/* Middle: identity + location + agency + specs pills */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" alignItems="center" gap={1} sx={{ flexWrap: 'wrap' }}>
                        <Typography sx={{ fontSize: 15, fontWeight: 700, color: bbColors.navy900 }}>
                          {row.modelName}
                          <Box component="span" sx={{ color: bbColors.gray500, fontWeight: 600, mx: 0.75 }}>
                            /
                          </Box>
                          <Box
                            component="span"
                            sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}
                          >
                            {row.name}
                          </Box>
                        </Typography>
                        {row.isOption && (
                          <Box
                            component="span"
                            sx={{
                              display: 'inline-block',
                              backgroundColor: '#fef7e0',
                              color: '#8a6d00',
                              border: '1px solid #f4e7a8',
                              fontSize: 10,
                              fontWeight: 700,
                              letterSpacing: 0.5,
                              textTransform: 'uppercase',
                              px: 0.75,
                              py: 0.25,
                              borderRadius: '999px',
                            }}
                          >
                            Under option
                          </Box>
                        )}
                      </Stack>
                      <Stack direction="row" alignItems="center" gap={0.75} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
                        <Box
                          component="span"
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: bbColors.yellow500,
                            display: 'inline-block',
                          }}
                        />
                        <Typography sx={{ fontSize: 13, color: '#2c3e56', fontWeight: 500 }}>
                          {row.locationName}
                          {row.locationCountryCode ? ` · ${row.locationCountryCode}` : ''}
                        </Typography>
                        <Typography component="span" sx={{ fontSize: 13, color: bbColors.gray500, mx: 0.25 }}>
                          🏕
                        </Typography>
                        <Typography sx={{ fontSize: 13, color: bbColors.navy700, fontWeight: 600 }}>
                          {row.agencyName}
                        </Typography>
                        <Typography component="span" sx={{ fontSize: 11, color: bbColors.gray600 }}>
                          (hidden when sent to client)
                        </Typography>
                      </Stack>
                      <Stack direction="row" gap={0.5} sx={{ mt: 1, flexWrap: 'wrap' }}>
                        {statsPills.map(p => (
                          <Box
                            key={p.label}
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.5,
                              px: 0.9,
                              py: 0.3,
                              borderRadius: 4,
                              backgroundColor: bbColors.gray100,
                              fontSize: 11,
                              color: '#2c3e56',
                              fontWeight: 500,
                            }}
                          >
                            <Box component="span" sx={{ color: bbColors.gray500 }}>
                              {p.label}
                            </Box>
                            <Box component="span" sx={{ fontWeight: 700 }}>
                              {p.value}
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                      <Button
                        size="small"
                        variant="text"
                        onClick={() =>
                          window.open(`${CUSTOMER_WEB_URL}/boat/${row.slug}`, '_blank', 'noopener,noreferrer')
                        }
                        sx={{ p: 0, minWidth: 0, fontSize: 11, textTransform: 'none', mt: 0.75, color: bbColors.navy700, fontWeight: 700 }}
                      >
                        View on customer site ↗
                      </Button>
                    </Box>

                    {/* Right: pricing + action */}
                    <Stack alignItems="flex-end" spacing={0.5} sx={{ minWidth: 180 }}>
                      {hasDiscount && (
                        <Typography sx={{ fontSize: 12, color: bbColors.gray500, textDecoration: 'line-through' }}>
                          List:{' '}
                          {listPeriodTotal!.toLocaleString('hr-HR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{' '}
                          {rowSymbol}
                        </Typography>
                      )}
                      <Typography
                        sx={{
                          fontSize: 18,
                          fontWeight: 800,
                          color: bbColors.green600,
                          lineHeight: 1.15,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {periodTotal.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                        {rowSymbol}
                      </Typography>
                      {(() => {
                        if (row.agencyCommissionEur == null || row.clientPriceEur <= 0) return null;

                        const commissionTotal = row.agencyCommissionEur * nights;
                        const pctBase = listPeriodTotal ?? periodTotal;
                        const pct = pctBase > 0 ? (commissionTotal / pctBase) * 100 : 0;
                        const isZero = commissionTotal === 0;

                        return (
                          <Box
                            sx={{
                              backgroundColor: isZero ? bbColors.gray100 : '#fef7e0',
                              color: isZero ? bbColors.gray500 : '#8a6d00',
                              border: `1px solid ${isZero ? bbColors.gray200 : '#f4e7a8'}`,
                              fontSize: 11,
                              fontWeight: 700,
                              px: 0.9,
                              py: 0.3,
                              borderRadius: '999px',
                            }}
                          >
                            {isZero
                              ? 'Commission: —'
                              : `Commission ${pct.toFixed(1)}% · ${commissionTotal.toLocaleString('hr-HR', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })} ${rowSymbol}`}
                          </Box>
                        );
                      })()}
                      {row.isOption && (
                        <Typography
                          sx={{
                            fontSize: 11,
                            color: '#8a6d00',
                            fontWeight: 600,
                            mt: 0.25,
                            textAlign: 'right',
                          }}
                        >
                          {optionExpiresText ? `Option expires: ${optionExpiresText}` : 'Under option — expiry unknown'}
                        </Typography>
                      )}
                      <Button
                        variant="contained"
                        size="small"
                        disabled={addingSlug === row.slug || inCart}
                        onClick={() => handleAddToOffer(row)}
                        sx={{
                          mt: 0.5,
                          textTransform: 'none',
                          backgroundColor: inCart ? bbColors.green600 : bbColors.navy900,
                          boxShadow: 'none',
                          fontWeight: 700,
                          borderRadius: '8px',
                          '&:hover': {
                            backgroundColor: inCart ? bbColors.green600 : '#13283d',
                            boxShadow: 'none',
                          },
                        }}
                      >
                        {inCart ? '✓ In offer' : addingSlug === row.slug ? 'Adding…' : '+ Add to offer'}
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              );
            })}
          </Stack>

          {/* Pagination footer — only visible when there's more than one page
              worth of results for the current filters. Page size is fixed
              at 100 on the backend (hard cap). */}
          {totalPages > 1 && (
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} sx={{ mt: 3, mb: 2 }}>
              <Button
                variant="outlined"
                size="small"
                disabled={page === 0 || searching}
                onClick={() => handlePageChange(page - 1)}
                sx={{ color: bbColors.navy900, borderColor: bbColors.gray300 }}
              >
                ← Prev
              </Button>
              <Typography variant="body2" color={bbColors.gray500}>
                Page <strong>{page + 1}</strong> of <strong>{totalPages}</strong>
              </Typography>
              <Button
                variant="outlined"
                size="small"
                disabled={page >= totalPages - 1 || searching}
                onClick={() => handlePageChange(page + 1)}
                sx={{ color: bbColors.navy900, borderColor: bbColors.gray300 }}
              >
                Next →
              </Button>
            </Stack>
          )}
        </Box>

        {/* === RIGHT PANEL: cart ============================================== */}
        <Box
          sx={{
            width: 320,
            flexShrink: 0,
            backgroundColor: colors.white,
            borderLeft: `1px solid ${bbColors.gray200}`,
            p: 2,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
            <Stack direction="row" alignItems="baseline" gap={1}>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: bbColors.navy900 }}>Client offer</Typography>
              {cart.length > 0 && (
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 22,
                    height: 22,
                    borderRadius: '50%',
                    backgroundColor: bbColors.yellow500,
                    color: bbColors.yellowText,
                    fontSize: 11,
                    fontWeight: 800,
                    px: 0.5,
                  }}
                >
                  {cart.length}
                </Box>
              )}
            </Stack>
            {cart.length > 0 && (
              <Button
                size="small"
                variant="text"
                onClick={handleClearCart}
                sx={{ color: bbColors.gray500, fontSize: 12, textTransform: 'none', minWidth: 0 }}
              >
                Clear
              </Button>
            )}
          </Stack>

          {cart.length === 0 && (
            <Typography variant="body2" color={bbColors.gray500} sx={{ py: 4, textAlign: 'center', fontSize: 12 }}>
              No yachts added yet. Pick from the results list.
            </Typography>
          )}

          <Stack spacing={0.75}>
            {cart.map(y => (
              <Stack
                key={`${y.yachtId}-${y.dateFrom}`}
                direction="row"
                alignItems="flex-start"
                gap={1}
                sx={{ py: 0.75, borderBottom: `1px solid ${bbColors.gray100}` }}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: bbColors.navy900 }} noWrap>
                    {y.modelName} | {y.name}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: bbColors.gray500 }}>{y.base}</Typography>
                  <Typography sx={{ fontSize: 11, color: bbColors.navy700, fontWeight: 600 }}>{y.agencyName}</Typography>
                </Box>
                <Stack alignItems="flex-end" gap={0.25} sx={{ flexShrink: 0 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: bbColors.green600, whiteSpace: 'nowrap' }}>
                    {y.clientPriceEur.toLocaleString('hr-HR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}{' '}
                    {y.currencySymbol || getCurrencySymbol(y.currency)}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveFromCart(y.yachtId, y.dateFrom)}
                    sx={{ color: bbColors.gray600, p: 0.25 }}
                  >
                    <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Stack>
              </Stack>
            ))}
          </Stack>

          {/* "Preview email" opens the HTML preview modal (same behaviour as
              the old "Create client offer" button). Send-to-client email
              flow isn't wired yet — added back here once the backend email
              endpoint is live. */}
          <Button
            variant="contained"
            fullWidth
            disabled={cart.length === 0 || openingModal}
            onClick={handleOpenOfferModal}
            sx={{
              mt: 2,
              textTransform: 'none',
              backgroundColor: bbColors.yellow500,
              color: bbColors.yellowText,
              fontWeight: 800,
              borderRadius: '8px',
              boxShadow: bbShadow.yellowCta,
              '&:hover': { backgroundColor: '#f7c83d', boxShadow: bbShadow.yellowCta },
              '&:disabled': { backgroundColor: '#f6e8bd', color: '#a08a45', boxShadow: 'none' },
            }}
          >
            {openingModal ? 'Loading details…' : 'Preview email'}
          </Button>
        </Box>
      </Stack>

      {/* === PREVIEW + COPY MODAL =========================================== */}
      <ModalRoot
        open={offerModalOpen}
        onClose={() => setOfferModalOpen(false)}
        title={`Client offer — ${cart.length} yacht${cart.length === 1 ? '' : 's'}`}
        width={960}
        onCancel={() => setOfferModalOpen(false)}
        cancelBtnText="Close"
        hideConfirmButton
        zIndex={1400}
      >
        <Stack spacing={1}>
          <Alert severity="info" sx={{ alignItems: 'flex-start' }}>
            Preview of the HTML that will be pasted into your email. <strong>Agency names are hidden.</strong> Use{' '}
            <strong>Copy as rich text</strong> for Gmail / Outlook composers (formatted paste). Use{' '}
            <strong>Copy HTML source</strong> when pasting into a CMS / editor that accepts raw HTML.
          </Alert>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              variant="contained"
              startIcon={<ContentCopyIcon />}
              onClick={handleCopyRichText}
              sx={{ backgroundColor: bbColors.navy900, '&:hover': { backgroundColor: '#13283d' } }}
            >
              Copy as rich text
            </Button>
            <Button
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              onClick={handleCopyHtml}
              sx={{ color: bbColors.navy900, borderColor: bbColors.gray300 }}
            >
              Copy HTML source
            </Button>
            <Button
              variant="contained"
              startIcon={<ContentCopyIcon />}
              onClick={handleCopyWhatsApp}
              sx={{
                backgroundColor: '#25D366',
                color: '#ffffff',
                '&:hover': { backgroundColor: '#1da851' },
              }}
            >
              Copy for WhatsApp
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              variant={includeSkipper ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setIncludeSkipper(v => !v)}
              sx={
                includeSkipper
                  ? {
                      backgroundColor: bbColors.navy900,
                      color: '#ffffff',
                      '&:hover': { backgroundColor: bbColors.navy900 },
                    }
                  : { borderColor: bbColors.gray300, color: bbColors.navy900 }
              }
            >
              {includeSkipper ? '✓ Skipper' : '+ Skipper'}
            </Button>
            <Button
              variant={includeHostess ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setIncludeHostess(v => !v)}
              sx={
                includeHostess
                  ? {
                      backgroundColor: bbColors.navy900,
                      color: '#ffffff',
                      '&:hover': { backgroundColor: bbColors.navy900 },
                    }
                  : { borderColor: bbColors.gray300, color: bbColors.navy900 }
              }
            >
              {includeHostess ? '✓ Hostess' : '+ Hostess'}
            </Button>
          </Stack>
          <Box
            sx={{
              border: `1px solid ${bbColors.gray200}`,
              borderRadius: '10px',
              p: 2,
              backgroundColor: colors.white,
              maxHeight: 500,
              overflowY: 'auto',
            }}
            dangerouslySetInnerHTML={{ __html: clientOfferHtml }}
          />
        </Stack>
      </ModalRoot>
    </Layout>
  );
};

/**
 * Centered placeholder for the results column (pre-search prompt and the
 * no-results case) — yellow-tinted icon chip + title + hint, replacing the
 * stock MUI Alerts that looked off-palette in the Broker Desk skin.
 */
const EmptyState = ({ icon, title, sub }: { icon: ReactNode; title: string; sub: string }) => (
  <Stack alignItems="center" justifyContent="center" sx={{ py: { xs: 6, md: 12 }, px: 3, textAlign: 'center' }}>
    <Box
      sx={{
        width: 44,
        height: 44,
        borderRadius: '12px',
        backgroundColor: '#fef7e0',
        color: '#8a6d00',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mb: 1.5,
      }}
    >
      {icon}
    </Box>
    <Typography sx={{ fontSize: 15, fontWeight: 700, color: bbColors.navy900 }}>{title}</Typography>
    <Typography sx={{ fontSize: 12.5, color: bbColors.gray500, mt: 0.5, maxWidth: 360 }}>{sub}</Typography>
  </Stack>
);

/**
 * Left-panel filter section wrapper — uppercase small-caps label stacked
 * on top of its control(s). Matches the mockup's filter groupings where a
 * section can hold one picker (e.g. "Currency") or multiple related ones
 * (e.g. "Destination" → Country + Region, "Build year" → From + To).
 */
const Section = ({ label, children }: { label: string; children: ReactNode }) => (
  <Box>
    <Typography
      component="div"
      sx={{
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: bbColors.gray500,
        mb: 0.5,
      }}
    >
      {label}
    </Typography>
    {children}
  </Box>
);

/**
 * Collapsible group header + animated body — used for the advanced "More
 * filters" block so the panel stays short by default. Click the whole header
 * row to toggle; a chevron rotates to signal state. Pure UI; parent owns `open`.
 */
const CollapsibleSection = ({
  label,
  hint,
  open,
  onToggle,
  children,
}: {
  label: string;
  hint?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) => (
  <Box sx={{ borderTop: `1px solid ${bbColors.gray200}`, pt: 1 }}>
    <Box
      component="button"
      type="button"
      onClick={onToggle}
      sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
        background: 'none',
        border: 0,
        p: 0,
        cursor: 'pointer',
        font: 'inherit',
        color: '#2c3e56',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, minWidth: 0 }}>
        <Typography component="span" sx={{ fontSize: 13, fontWeight: 700, color: bbColors.navy900 }}>
          {label}
        </Typography>
        {hint && (
          <Typography
            component="span"
            sx={{ fontSize: 11, color: bbColors.gray600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {hint}
          </Typography>
        )}
      </Box>
      <Box
        component="span"
        sx={{
          fontSize: 12,
          color: bbColors.gray500,
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform .15s ease',
        }}
      >
        ▾
      </Box>
    </Box>
    <Collapse in={open} timeout={180} unmountOnExit>
      <Box sx={{ pt: 1.5 }}>{children}</Box>
    </Collapse>
  </Box>
);

export default Offers;
