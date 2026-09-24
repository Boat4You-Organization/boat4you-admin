/**
 * Builds the HTML snippet the broker copy-pastes into their email client
 * (mostly Apple Mail) and sends to the client.
 *
 * Layout: "fluid hybrid" with ZERO <style> — Apple Mail strips the <style>
 * block on paste, so media queries never reach the client. Each card band
 * holds two inline-block columns (width:100% + max-width): side by side when
 * the band is wide enough, stacked on phones, inline styles only.
 *   hero band:   photo 266 (248 + 18 gutter) | text 322          = 588
 *   bottom band: services 360 (344 + 16 gutter) | price box 230  = 590
 * Both fit the 606px band of a 640px card (640 − 2 border − 2×16 padding);
 * any card narrower than 624px (every phone) stacks.
 *
 * Bytes matter: Gmail clips messages over 102 KB and offers carry 8–15
 * yachts, so markup stays flat (no chip tables) and styles stay short.
 * Agency identity is intentionally OMITTED — the customer should stay on
 * boat4you, not learn which partner runs the fleet.
 */
import { itineraryAreaUrl } from '@/utils/static/itineraryArea';

export interface CartExtra {
  name: string;
  priceEur: number | null;
  included: boolean;
  obligatory: boolean;
  // Free-form partner description shown as small print under the item name
  // (e.g. "Xiaomi Electric Scooter 4 Lite (2nd Gen)", "deposit €1000").
  // Populated from YachtExtrasDto.description (MMK description / Nausys
  // service description). Null on partner rows that sent none.
  description?: string | null;
  // Unit suffix ("per week", "per booking") — surfaces the partner billing
  // period so the customer understands what the price covers.
  unit?: string | null;
}

export interface CartYacht {
  yachtId: number;
  slug: string;
  name: string;
  modelName: string;
  manufacturerName: string | null;
  vesselType: string | null;
  agencyName: string; // admin-only, never rendered in output
  sourceSystem: string | null; // admin-only ("MMK" / "NauSys"), never rendered in output
  locationName: string;
  country: string | null;
  base: string;
  buildYear: number | null;
  lengthMeters: number | null;
  berths: number | null;
  cabins: number | null;
  wc: number | null;
  mainSailType: string | null;
  dateFrom: string; // YYYY-MM-DD
  dateTo: string;
  checkin: string; // "17:00" etc
  checkout: string;
  // Prices are in `currency` (ISO-4217). Field name kept as `*Eur` for
  // legacy compat with older storage payloads — the number is in whatever
  // currency the broker had active when adding the yacht.
  clientPriceEur: number;
  listPriceEur: number | null;
  discountEur: number | null;
  securityDepositEur: number | null;
  currency: string; // ISO-4217 — "EUR", "USD", "GBP", "AUD", "CAD"
  currencySymbol: string; // pre-resolved for the HTML renderer
  equipmentByCategory: Record<string, string[]>;
  extras: CartExtra[];
  // Offer id of the matched offer for this period. Lets the Offers workspace
  // re-quote the partner via /calculate so partner-recomputed obligatory extras
  // (e.g. NauSys Damage Waiver, mandatory once a Skipper is added) surface here.
  offerId?: number;
  // Backend extrasKey of the Skipper / Hostess rows (when the partner synced
  // them) — sent as the selectedExtras param to /calculate.
  skipperKey?: string | null;
  hostessKey?: string | null;
  // Main yacht image URL (mainImage flag in yachtImages, falls back to
  // first image). Null when the yacht has no images synced — render
  // skips the image cell entirely so the layout doesn't break.
  imageUrl: string | null;
  // Public boat detail page URL on boat4you customer site — appended as
  // a "View on boat4you" link at the bottom of each yacht block so the
  // customer can re-open the listing from the email.
  detailUrl: string | null;
  // Curated top amenities rendered as small icon+text pills next to the
  // specs chips, mirroring the listing card. Ordered by backend
  // filterOrder and capped to 4 items upstream so the card stays tight.
  keyAmenities: { labelCode: string; label: string }[];
  // When the best matching offer for this yacht+period was in OPTION /
  // OPTION_WAITING at search-time, the broker still added it to the cart
  // so the client knows it's a time-sensitive option. The email renders
  // "Under option until DD.MM.YYYY HH:mm" (mandalay badge) so the client
  // sees the deadline instead of mistaking the yacht for available.
  isOption: boolean;
  // ISO string from backend (`2026-04-25T23:59:00`). Null when the yacht
  // is optioned but the partner didn't send an expiry timestamp — badge
  // falls back to "Under option" without a date.
  optionExpiresAt: string | null;
}

/**
 * Toggles for the broker's "Client offer" view — flip these on when the
 * inquiry asked for a skipper / hostess and the broker wants the cost
 * surfaced inside the offer (HTML + WhatsApp variants both honour them).
 *
 * Per-yacht extras already carry Skipper / Hostess rows when the partner
 * (Nausys / MMK) syncs them — we simply un-hide those rows. When a yacht
 * has no synced row we fall back to a "— on request" placeholder so the
 * broker can replace it manually before sending.
 */
export interface OfferRenderOptions {
  includeSkipper?: boolean;
  includeHostess?: boolean;
}

// Stable per-cart-entry key (yacht + period) used to look up the live /calculate
// result map (autoObligatoryByYacht). MUST match the key the Offers workspace
// builds when it stores the fetched rows.
export const offerYachtKey = (y: Pick<CartYacht, 'yachtId' | 'dateFrom'>): string => `${y.yachtId}-${y.dateFrom}`;

// Hours the free, non-binding HOLD option lasts — quoted in the closing
// "Next step" box of every HTML offer. Owner-adjustable.
export const HOLD_OPTION_HOURS = 72;

/**
 * Append this offer's charter week + currency to the public boat URL so the
 * link opens the detail page pre-priced for THESE dates — not the page's
 * dateless default, which shows a different (usually higher) number and made
 * clients think the WhatsApp/email price was wrong.
 *
 * The customer BoatCalendar reads `startDate` / `endDate` (YYYY-MM-DD, the
 * cart's `dateFrom` / `dateTo`) to pre-select the week, and the detail page
 * forwards them + `currency` to the pricing API.
 *
 * Idempotent: overwrites any startDate/endDate/currency already on the URL, so
 * carts persisted in localStorage before this fix (whose stored `detailUrl`
 * was dateless) and any re-render both yield one clean, correct link.
 */
const withOfferDates = (y: CartYacht): string | null => {
  if (!y.detailUrl) return null;

  const [base, existingQuery = ''] = y.detailUrl.split('?');
  const params = new URLSearchParams(existingQuery);

  params.set('startDate', y.dateFrom);
  params.set('endDate', y.dateTo);

  if (y.currency) params.set('currency', y.currency);

  const qs = params.toString();

  return qs ? `${base}?${qs}` : base;
};

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatDateShort = (isoDate: string): string => {
  // "2026-06-20" → "20 Jun 2026"
  if (!isoDate) return '';

  const parts = isoDate.split('-');

  if (parts.length !== 3) return isoDate;

  const [y, m, d] = parts;
  const mi = Math.max(0, Math.min(11, Number(m) - 1));

  return `${Number(d)} ${MONTHS_SHORT[mi]} ${y}`;
};

const daysBetween = (fromIso: string, toIso: string): number => {
  const f = new Date(`${fromIso}T00:00:00Z`).getTime();
  const t = new Date(`${toIso}T00:00:00Z`).getTime();

  if (!Number.isFinite(f) || !Number.isFinite(t)) return 0;

  return Math.max(1, Math.round((t - f) / 86_400_000));
};

/**
 * Find a "Skipper" / "Hostess" entry inside a yacht's extras list, regardless
 * of partner casing or local label suffix ("Skipper (per day)", "Hostess - 7d").
 * Returns null when the partner didn't sync one — caller renders an "on request"
 * placeholder.
 */
const findExtraByKeyword = (extras: CartExtra[], keyword: string): CartExtra | null => {
  const k = keyword.toLowerCase();

  // Prefer an EXACT name match ("Skipper") over a loose contains, and skip
  // surcharge rows that merely CONTAIN the keyword — "Additional fee for Skipper
  // in forepeak…" and, for Adriatic Sailing, "Fun Pack skipper surcharge" (an
  // optional add-on, only due if the client also takes the Fun Pack). Either
  // would otherwise be picked as the skipper row and the real Skipper service —
  // and its price — would never show. (Hostess has no such surcharge twin, which
  // is why only skipper mis-matched.)
  const exact = extras.find(e => (e.name || '').trim().toLowerCase() === k);

  if (exact) return exact;

  return (
    extras.find(e => {
      const n = (e.name || '').toLowerCase();

      return n.includes(k) && !n.includes('additional fee') && !n.includes('surcharge');
    }) || null
  );
};

// "2027-07-10", "17:00" → "Sat 10 Jul 17:00" ("Sat 10 Jul 2027 17:00" withYear).
const formatPeriodDate = (isoDate: string, time: string, withYear: boolean): string => {
  const [y, m, d] = (isoDate || '').split('-').map(Number);

  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return isoDate;

  const weekday = WEEKDAYS_SHORT[new Date(Date.UTC(y, m - 1, d)).getUTCDay()] || '';
  const mi = Math.max(0, Math.min(11, m - 1));

  return [weekday, String(d), MONTHS_SHORT[mi], withYear ? String(y) : '', time].filter(Boolean).join(' ');
};

const formatPrice = (v: number | null | undefined): string => {
  if (v == null) return '';

  return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const priceWithCurrency = (v: number | null | undefined, symbol: string): string => {
  if (v == null) return '';

  return `${formatPrice(v)} ${symbol}`;
};

const humanizeVesselType = (t: string | null | undefined): string => {
  if (!t) return '';

  const map: Record<string, string> = {
    CATAMARAN: 'Catamaran',
    SAILING_YACHT: 'Sailing yacht',
    MOTOR_YACHT: 'Motor yacht',
    MOTOR_SAILER: 'Motor sailer',
    GULET: 'Gulet',
    POWER_BOAT: 'Power boat',
    TRAWLER: 'Trawler',
    CROSSOVER: 'Crossover',
    MONO_HULL: 'Monohull',
  };

  return map[t] || t;
};

// Mainsail enum → client wording. Unknown codes (incl. UNKNOWN / null) return
// null so the raw enum never leaks into the offer ("Mainsail ROLLING_SAIL").
const humanizeMainsail = (code: string | null | undefined): string | null => {
  const map: Record<string, string> = {
    ROLLING_SAIL: 'rolling mainsail',
    CLASSIC_SAIL: 'classic mainsail',
    FULL_BATTEN: 'full-batten mainsail',
    LAZY_JACK: 'lazy jack mainsail',
    LAZY_BAG: 'lazy jack mainsail',
    IN_MAST: 'in-mast furling mainsail',
  };

  return (code && map[code]) || null;
};

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// boat4you brand palette — kept inline (no `<style>` block) because Outlook
// and most webmail clients strip <head>/<style>. Single source of truth so a
// future palette tweak only edits this object.
const BRAND = {
  primary: '#2856ff', // blue500 — links, CTAs
  primarySoft: '#eef3ff', // blue50 — chip / panel bg
  primaryBorder: '#bcd0ff', // blue200 — chip borders
  success: '#309a49', // green500 — final price, savings text
  successSoft: '#eef3ff', // blue50 — price card bg (subtle brand match;
  //                                 green text reads strongly on top)
  successBorder: '#d9e4ff', // blue100 — price card border
  warn: '#ab7801', // mandalay700 — period-header date accent
  warnSoft: '#fcffc1', // mandalay100 — (unused now; was save badge bg)
  saveBg: '#dc2626', // red600 — save/discount badge bg (solid red pop)
  saveText: '#ffffff', // white on red — maximum contrast for "SAVE X%"
  text: '#292929', // black950 — main text
  textMuted: '#656565', // black600 — secondary text
  textFaint: '#989898', // black400 — tertiary / strikethrough
  border: '#dcdcdc', // black200 — card border
  divider: '#efefef', // black100 — internal hairlines
  cardBg: '#ffffff',
} as const;

const FONT_STACK = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

// Curated amenity → unicode icon map — same 16 label_codes as
// BoatListingItemCard's AMENITY_ICON_MAP on the public listing, but
// mapped to plain unicode characters because email clients can't render
// MUI / React icons. Icons are text-style codepoints (not colourful
// emoji) where possible so they render consistently across Apple Mail,
// Gmail, and Outlook. When a labelCode isn't in this map, the pill
// renders the label alone — no broken glyph.
const AMENITY_ICON_MAP: Record<string, string> = {
  'air-conditioning': '❄',
  wifi: '📶',
  generator: '⚡',
  'solar-panels': '☀',
  heating: '🔥',
  autopilot: '🧭',
  dinghy: '🛥',
  bimini: '⛱',
  'outside-shower': '🚿',
  radar: '📡',
  'bow-thruster': '↔',
  'outside-GPS-plotter': '📍',
  cooker: '🍳',
  fridge: '🧊',
  'water-toys': '🏄',
  'snorkel-sets': '🤿',
  watermaker: '💧',
};

// Short labels tuned to fit a 54px-wide square box at 9-10px font so
// the "Selected services" row doesn't bloat email width. Backend `label`
// is used as fallback when a labelCode isn't in the map.
const AMENITY_SHORT_LABEL: Record<string, string> = {
  'air-conditioning': 'AC',
  wifi: 'Wi-Fi',
  generator: 'Generator',
  'solar-panels': 'Solar',
  heating: 'Heating',
  autopilot: 'Autopilot',
  dinghy: 'Dinghy',
  bimini: 'Bimini',
  'outside-shower': 'Shower',
  radar: 'Radar',
  'bow-thruster': 'Thruster',
  'outside-GPS-plotter': 'GPS',
  cooker: 'Cooker',
  fridge: 'Fridge',
  'water-toys': 'Toys',
  'snorkel-sets': 'Snorkel',
  watermaker: 'Watermaker',
};

// Amenities as one compact inline line ("☀ Solar · 🛥 Dinghy · ❄ AC · …").
const renderAmenitiesInline = (items: { labelCode: string; label: string }[]): string =>
  items
    .slice(0, 4)
    .map(a => `${AMENITY_ICON_MAP[a.labelCode] || '•'} ${escapeHtml(AMENITY_SHORT_LABEL[a.labelCode] || a.label)}`)
    .join(' · ');

/**
 * Builds the "Selected services" stack for one yacht: partner obligatory rows
 * + broker-toggled Skipper / Hostess (an "on request" placeholder when the
 * partner never synced the row) + partner-recomputed /calculate extras,
 * deduped by name. Shared by the HTML card and the WhatsApp variant so both
 * always describe the same stack.
 */
const buildObligatoryStack = (y: CartYacht, options: OfferRenderOptions, autoObligatory: CartExtra[]): CartExtra[] => {
  const obligatory = y.extras.filter(e => e.obligatory);

  const placeholderExtra = (label: string): CartExtra => ({
    name: label,
    priceEur: null,
    included: false,
    obligatory: true,
    description: 'On request — confirm with charter',
    unit: null,
  });
  const ensureCrewExtra = (keyword: string, label: string) => {
    const alreadyShown = obligatory.some(e => (e.name || '').toLowerCase().includes(keyword.toLowerCase()));

    if (alreadyShown) return;

    const found = findExtraByKeyword(y.extras, keyword);

    obligatory.push(found ? { ...found, obligatory: true } : placeholderExtra(label));
  };

  if (options.includeSkipper) ensureCrewExtra('skipper', 'Skipper');

  if (options.includeHostess) ensureCrewExtra('hostess', 'Hostess');

  autoObligatory.forEach(extra => {
    const name = (extra.name || '').trim().toLowerCase();

    if (!name) return;

    const alreadyShown = obligatory.some(e => (e.name || '').trim().toLowerCase() === name);

    if (!alreadyShown) obligatory.push({ ...extra, obligatory: true });
  });

  return obligatory;
};

/**
 * Sums the payable part of a services stack, unit-aware ("per week" bills a
 * started week whole, "per night"/"per day" multiply by nights). Rows that
 * cannot be priced honestly — on-request placeholders, per-person units
 * (pax unknown at offer time), percentage units — flip `partial` instead of
 * guessing: callers render "from X €" and skip the arrival total. Clients
 * kept asking "is Selected services included in the total?" (it is NOT —
 * Mario 29.7.2026); this sum lets the card spell the relationship out.
 */
const computeServicesTotal = (
  rows: CartExtra[],
  dateFrom: string,
  dateTo: string
): { amount: number; partial: boolean; payableCount: number } => {
  const days = Math.max(1, daysBetween(dateFrom, dateTo));
  const weeks = Math.max(1, Math.ceil(days / 7));
  let amount = 0;
  let partial = false;
  let payableCount = 0;

  rows.forEach(e => {
    if (e.included || e.priceEur === 0) return; // free rows add nothing

    payableCount += 1;

    if (e.priceEur == null) {
      partial = true; // "on request" placeholder (e.g. unsynced Skipper)

      return;
    }

    const unit = (e.unit || '').toLowerCase();

    if (unit.includes('person') || unit.includes('%')) {
      partial = true; // pax count unknown / percentage of charter price

      return;
    }

    if (unit.includes('week')) {
      amount += e.priceEur * weeks;

      return;
    }

    if (unit.includes('night') || unit.includes('day')) {
      amount += e.priceEur * days;

      return;
    }

    amount += e.priceEur; // per booking / per boat / no unit → charged once
  });

  return { amount, partial, payableCount };
};

// Every layout table: cellpadding/cellspacing 0 (HTML defaults are 1 / 2 px)
// and role=presentation so screen readers skip the grid.
const TABLE = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"';

// Hero photo source width. Stays 800 on purpose: the customer web already
// requests every yacht photo at ?width=800, so the resize is cached on the
// API (0 × 503 in 14 days, checked 22.9.2026). A new width would trigger a
// fresh OpenCV resize per photo when the client opens the mail and the
// resize gate returns 503 under load = broken photos in the offer.
const HERO_IMG_WIDTH = 800;

const heroImageSrc = (url: string): string => url.replace(/([?&])width=\d+/, `$1width=${HERO_IMG_WIDTH}`);

// Partner descriptions can be long / multi-line: one line, max `max` chars.
// Runs BEFORE escapeHtml so an entity is never cut in half.
const truncateLine = (s: string, max = 90): string => {
  const chars = Array.from(s.replace(/\s+/g, ' ').trim());

  if (chars.length <= max) return chars.join('');

  const head = chars.slice(0, max - 1).join('');

  return `${head.trimEnd()}…`;
};

/**
 * Fluid-hybrid column (Nicole Merlin's pattern): inline-block, full width up
 * to `maxWidth`, so two columns sit side by side when the band is wide enough
 * and stack otherwise. Padding lives on the inner <td> (box-sizing is not
 * reliable in email); the <td> style also resets the band's font-size:0.
 */
const column = (maxWidth: number, tdStyle: string, inner: string, tableStyle = ''): string =>
  `<div style="display:inline-block;vertical-align:top;width:100%;max-width:${maxWidth}px">${TABLE}${
    tableStyle ? ` style="${tableStyle}"` : ''
  }><tr><td style="${tdStyle}">${inner}</td></tr></table></div>`;

// font-size:0 kills the whitespace gap between the inline-block columns;
// callers still concatenate the two columns with NO whitespace between them.
const band = (padding: string, columns: string): string =>
  `<tr><td style="font-size:0;text-align:left;padding:${padding}">${columns}</td></tr>`;

const mutedSpan = (html: string): string => `<span style="color:${BRAND.textMuted}">${html}</span>`;

const renderYachtBlock = (
  y: CartYacht,
  position: number,
  options: OfferRenderOptions = {},
  autoObligatory: CartExtra[] = []
): string => {
  // Escaped once here — every HTML price string below goes through priceWithCurrency(…, sym).
  const sym = escapeHtml(y.currencySymbol || '€');
  // Date-aware public link so the client lands on this week's price (see withOfferDates).
  const detailUrl = withOfferDates(y);
  const href = detailUrl ? escapeHtml(detailUrl) : '';
  const nights = daysBetween(y.dateFrom, y.dateTo);
  const nightsLabel = `${nights} ${nights === 1 ? 'night' : 'nights'}`;
  const sameYear = (y.dateFrom || '').slice(0, 4) === (y.dateTo || '').slice(0, 4);
  const periodLine = `${formatPeriodDate(y.dateFrom, y.checkin, !sameYear)} → ${formatPeriodDate(
    y.dateTo,
    y.checkout,
    true
  )} · ${nightsLabel}`;

  // One specs line — only values we actually have, so it never shows "—".
  const specs = [
    humanizeVesselType(y.vesselType),
    y.buildYear != null ? String(y.buildYear) : '',
    y.lengthMeters != null ? `${y.lengthMeters.toFixed(2)} m` : '',
    y.cabins != null ? `${y.cabins} ${y.cabins === 1 ? 'cabin' : 'cabins'}` : '',
    y.berths != null ? `${y.berths} ${y.berths === 1 ? 'berth' : 'berths'}` : '',
    y.wc != null ? `${y.wc} WC` : '',
    humanizeMainsail(y.mainSailType),
  ]
    .filter(Boolean)
    .join(' · ');
  const amenities = renderAmenitiesInline(y.keyAmenities || []);
  const locationLine = [y.country, y.base].filter(Boolean).join(' · ');

  // Pricing — line-through old, big new, savings badge if discount > 0.
  const hasDiscount = y.listPriceEur != null && y.listPriceEur > y.clientPriceEur;
  const discountPct =
    hasDiscount && y.listPriceEur != null && y.listPriceEur > 0
      ? ((y.listPriceEur - y.clientPriceEur) / y.listPriceEur) * 100
      : 0;
  const discountAmount = hasDiscount && y.listPriceEur != null ? y.listPriceEur - y.clientPriceEur : 0;

  // Hero photo — 248x192 near-landscape crop (shows more of the mostly-square
  // partner photos than a letterbox); labelled placeholder when no image.
  const photo = y.imageUrl
    ? `<img src="${escapeHtml(heroImageSrc(y.imageUrl))}" alt="${escapeHtml(`${y.modelName} ${y.name}`)}" width="248" height="192" style="display:block;width:100%;max-width:248px;height:192px;object-fit:cover;border-radius:10px;border:0">`
    : `${TABLE} style="max-width:248px"><tr><td align="center" height="192" style="height:192px;background:${BRAND.primarySoft};border:1px solid ${BRAND.primaryBorder};border-radius:10px;color:${BRAND.textMuted};font-size:11px;line-height:1.3;font-weight:700;letter-spacing:.6px;text-transform:uppercase">Yacht photo</td></tr></table>`;
  const photoCell = y.imageUrl && href ? `<a href="${href}" target="_blank">${photo}</a>` : photo;

  // Option badge — time-sensitive offers render "Under option until …" under
  // the period line so the client sees the deadline.
  let optionBadge = '';

  if (y.isOption) {
    let formatted: string | null = null;

    if (y.optionExpiresAt) {
      const [datePart, timePart = ''] = y.optionExpiresAt.split('T');
      const [yy, mm, dd] = datePart.split('-');
      const hm = timePart ? timePart.slice(0, 5) : '';

      formatted = hm ? `${dd}.${mm}.${yy} ${hm}` : `${dd}.${mm}.${yy}`;
    }

    const badgeText = formatted ? `Under option until ${formatted}` : 'Under option';

    optionBadge = `<div style="margin-top:6px"><span style="display:inline-block;background:${BRAND.warnSoft};color:${BRAND.warn};font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px;letter-spacing:.3px">${escapeHtml(badgeText)}</span></div>`;
  }

  const title = escapeHtml(`${position}. ${y.modelName} · ${y.name}`);
  const titleHtml = href
    ? `<a href="${href}" target="_blank" style="color:${BRAND.text};text-decoration:none">${title}</a>`
    : title;

  const textColumn = [
    `<div style="font-size:12px;font-weight:700;letter-spacing:.3px;text-transform:uppercase;color:${BRAND.warn}">${escapeHtml(periodLine)}</div>`,
    optionBadge,
    `<div style="font-size:20px;font-weight:700;line-height:1.25;margin:6px 0 2px">${titleHtml}</div>`,
    locationLine ? `<div style="color:${BRAND.textMuted}">${escapeHtml(locationLine)}</div>` : '',
    specs ? `<div style="margin-top:8px">${escapeHtml(specs)}</div>` : '',
    amenities ? `<div style="color:${BRAND.textMuted}">${amenities}</div>` : '',
  ].join('');

  // Only obligatory extras surface in the client offer (optional add-ons were
  // dropped 23.4.2026 — noisy, "is this included?"). ALL obligatory rows stay
  // visible (Mario 1.5.2026), free ones with a green "included".
  const obligatory = buildObligatoryStack(y, options, autoObligatory);
  const servicesTotal = computeServicesTotal(obligatory, y.dateFrom, y.dateTo);
  const hasSecurityDeposit = y.securityDepositEur != null && y.securityDepositEur > 0;

  // "included" is reserved for TRULY free rows (priceEur 0 → mapper sets
  // included); priceEur null = missing data → a dash, never "included".
  const rowPrice = (e: CartExtra): string => {
    if (e.included) return `<span style="color:${BRAND.success};font-weight:600">included</span>`;

    if (e.priceEur == null) return `<span style="color:${BRAND.textFaint}">—</span>`;

    return `<b>${priceWithCurrency(e.priceEur, sym)}</b>`;
  };
  const row = (left: string, right: string, extraStyle = ''): string =>
    `<tr><td style="padding:3px 10px 3px 0${extraStyle}">${left}</td><td align="right" valign="top" style="padding:3px 0;white-space:nowrap${extraStyle}">${right}</td></tr>`;

  const serviceRows = obligatory.map(e => {
    const description = e.description ? truncateLine(e.description) : '';

    return row(
      `${escapeHtml(e.name)}${description ? `<div style="font-size:11px;color:${BRAND.textMuted}">${escapeHtml(description)}</div>` : ''}`,
      `${rowPrice(e)}${e.unit ? ` ${mutedSpan(escapeHtml(e.unit))}` : ''}`
    );
  });

  // Sum row — before the deposit row, which is refundable and deliberately
  // NOT part of the sum. "from X" when a row couldn't be priced.
  if (servicesTotal.payableCount > 0) {
    const totalText =
      servicesTotal.partial && servicesTotal.amount === 0
        ? 'on request'
        : `${servicesTotal.partial ? 'from ' : ''}${priceWithCurrency(servicesTotal.amount, sym)}`;

    serviceRows.push(
      row(
        '<b>Selected services total</b>',
        `<b>${totalText}</b>`,
        `;padding-top:6px;border-top:1px solid ${BRAND.border}`
      )
    );
  }

  // Security deposit — last, muted row (mirrors the web ExtrasTab):
  // refundable, paid at the marina, always mandatory.
  if (hasSecurityDeposit) {
    serviceRows.push(
      row(
        'Refundable Security Deposit<div style="font-size:11px">Refundable, settled at the marina</div>',
        `<b>${priceWithCurrency(y.securityDepositEur, sym)}</b> per booking`,
        `;color:${BRAND.textMuted}`
      )
    );
  }

  const servicesColumn =
    serviceRows.length > 0
      ? column(
          360,
          'padding:0 16px 12px 0;font-size:13px',
          `<div style="font-size:12px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:${BRAND.textMuted};padding-bottom:4px">Selected services <span style="font-weight:400;letter-spacing:0;text-transform:none">(payable separately, not included in the charter price)</span></div>${TABLE} style="font-size:13px;line-height:1.35">${serviceRows.join('')}</table>`
        )
      : '';

  // Price box lines under the charter price: services (never part of the
  // charter price), the arrival total when every row could be priced, and
  // the refundable deposit.
  const arrivalLines: string[] = [];

  if (servicesTotal.payableCount > 0) {
    arrivalLines.push(
      servicesTotal.partial && servicesTotal.amount === 0
        ? `+ selected services ${mutedSpan('· on request · payable separately')}`
        : `+ <b>${servicesTotal.partial ? 'from ' : ''}${priceWithCurrency(servicesTotal.amount, sym)}</b> ${mutedSpan('selected services · payable separately')}`
    );

    if (!servicesTotal.partial) {
      arrivalLines.push(
        `= <b>${priceWithCurrency(y.clientPriceEur + servicesTotal.amount, sym)}</b> ${mutedSpan(
          `total on arrival${hasSecurityDeposit ? ' (excl. refundable deposit)' : ''}`
        )}`
      );
    }
  }

  if (hasSecurityDeposit) {
    arrivalLines.push(
      mutedSpan(
        `+ ${priceWithCurrency(y.securityDepositEur, sym)} refundable security deposit, returned after the charter`
      )
    );
  }

  const priceBox = [
    hasDiscount
      ? `<span style="display:inline-block;background:${BRAND.saveBg};color:${BRAND.saveText};font-size:11px;font-weight:700;padding:3px 8px;border-radius:10px;letter-spacing:.3px">SAVE ${discountPct.toFixed(0)}% · -${priceWithCurrency(discountAmount, sym)}</span><div style="font-size:13px;color:${BRAND.textFaint};text-decoration:line-through;margin-top:6px">${priceWithCurrency(y.listPriceEur, sym)}</div>`
      : '',
    `<div style="font-size:24px;font-weight:800;color:${BRAND.success};line-height:1.15">${priceWithCurrency(y.clientPriceEur, sym)}</div>`,
    `<div style="color:${BRAND.textMuted}">charter, ${nightsLabel}</div>`,
    arrivalLines.length > 0
      ? `<div style="margin-top:8px;padding-top:6px;border-top:1px solid ${BRAND.successBorder}">${arrivalLines
          .map(line => `<div style="margin-top:2px">${line}</div>`)
          .join('')}</div>`
      : '',
    href
      ? `<a href="${href}" target="_blank" style="display:block;margin-top:12px;padding:10px 8px;border-radius:8px;background:${BRAND.primary};color:#ffffff;font-size:13px;font-weight:600;text-align:center;text-decoration:none">View ${escapeHtml(y.name)} &amp; book online →</a>`
      : '',
  ].join('');
  const priceColumn = column(
    230,
    'padding:12px 14px 14px;font-size:12px;line-height:1.4',
    priceBox,
    `background:${BRAND.successSoft};border:1px solid ${BRAND.successBorder};border-radius:10px`
  );

  // Card — one bordered table, two fluid-hybrid bands. The gutters live in
  // the LEFT column's right/bottom padding, so stacked columns stay flush left
  // with a 12px gap. font-family/color set here inherit into nested tables
  // (unlike font-size, which quirks mode resets per table).
  return `${TABLE} style="margin:0 0 16px;border:1px solid ${BRAND.border};border-radius:12px;background:${BRAND.cardBg};font-family:${FONT_STACK};color:${BRAND.text}">${band(
    '14px 16px 0',
    column(266, 'padding:0 18px 12px 0;line-height:0', photoCell) +
      column(322, 'padding:0 0 12px;font-size:13px;line-height:1.45', textColumn)
  )}${band('0 16px 16px', servicesColumn + priceColumn)}</table>`;
};

/**
 * Plain-text "WhatsApp" variant of the client offer. WhatsApp parses
 * `*bold*`, `_italic_`, `~strike~` and auto-renders the FIRST URL into a
 * preview card (boat4you yacht detail page comes with proper OG meta so
 * the preview shows the hero image + title). Subsequent URLs render as
 * plain clickable links.
 *
 * Format per yacht:
 *   ⛵ *Lagoon 39 | Sole*
 *   📍 ACI Marina Split, Croatia
 *   📅 20 Jun 2026 – 27 Jun 2026 (7 nights)
 *   ✓ Catamaran · Year 2023 · 4 cabins · 13.99 m
 *   ✓ Skipper +200 € (per day)
 *   💰 *Total: 8,400 €*
 *   🔗 https://www.boat4you.com/hr/boat/...
 *
 * Yachts separated by a thin divider so brokers can copy-paste the whole
 * thing into one WhatsApp message; long offers (5+ yachts) may exceed
 * WhatsApp's 4096-char limit and split into 2 messages on send.
 */
export const buildClientOfferWhatsApp = (
  cart: CartYacht[],
  options: OfferRenderOptions = {},
  autoObligatoryByYacht: Record<string, CartExtra[]> = {}
): string => {
  if (cart.length === 0) return 'No yachts added to offer yet.';

  const sections = cart.map(y => {
    const sym = y.currencySymbol || '€';
    const days = daysBetween(y.dateFrom, y.dateTo);
    const period = `${formatDateShort(y.dateFrom)} – ${formatDateShort(y.dateTo)} (${days} ${days === 1 ? 'night' : 'nights'})`;

    const lines: string[] = [];

    lines.push(`⛵ *${y.modelName} | ${y.name}*`);

    const locParts = [y.base, y.country].filter(Boolean);

    if (locParts.length > 0) {
      lines.push(`📍 ${locParts.join(', ')}`);
    }

    const waItineraryUrl = itineraryAreaUrl([y.base, y.locationName], y.country);

    if (waItineraryUrl) {
      lines.push(`🗺️ Suggested itineraries: ${waItineraryUrl}`);
    }

    lines.push(`📅 ${period}`);

    // Compact specs
    const specs: string[] = [];

    if (y.vesselType) specs.push(humanizeVesselType(y.vesselType));

    if (y.buildYear != null) specs.push(`Year ${y.buildYear}`);

    if (y.cabins != null) specs.push(`${y.cabins} cabins`);

    if (y.berths != null) specs.push(`${y.berths} berths`);

    if (y.lengthMeters != null) specs.push(`${y.lengthMeters.toFixed(2)} m`);

    if (specs.length > 0) lines.push(`✓ ${specs.join(' · ')}`);

    // Skipper / Hostess (only when toggle ON)
    const renderCrewLine = (label: string, keyword: string) => {
      const found = findExtraByKeyword(y.extras, keyword);

      if (found && found.priceEur != null) {
        const unitSuffix = found.unit ? ` (${found.unit})` : '';

        lines.push(`✓ ${label} +${formatPrice(found.priceEur)} ${sym}${unitSuffix}`);
      } else {
        lines.push(`✓ ${label} — on request`);
      }
    };

    if (options.includeSkipper) renderCrewLine('Skipper', 'skipper');

    if (options.includeHostess) renderCrewLine('Hostess', 'hostess');

    // Partner-recomputed obligatory extras (NauSys Damage Waiver when a Skipper
    // is added) — same source as the HTML block, deduped against the crew lines.
    (autoObligatoryByYacht[offerYachtKey(y)] ?? []).forEach(extra => {
      const nm = (extra.name || '').trim();

      if (!nm || /skipper|hostess/i.test(nm)) return;

      const priceTxt =
        extra.priceEur == null
          ? '— on request'
          : `+${formatPrice(extra.priceEur)} ${sym}${extra.unit ? ` (${extra.unit})` : ''}`;

      lines.push(`✓ ${nm} ${priceTxt}`);
    });

    // Price
    lines.push('');
    lines.push(`💰 *Total: ${formatPrice(y.clientPriceEur)} ${sym}*`);

    // Same stack + sum as the HTML card, so WhatsApp answers the "are the
    // services included?" question too. One line — WA messages stay tight.
    const waServicesTotal = computeServicesTotal(
      buildObligatoryStack(y, options, autoObligatoryByYacht[offerYachtKey(y)] ?? []),
      y.dateFrom,
      y.dateTo
    );

    if (waServicesTotal.payableCount > 0) {
      const amountTxt =
        waServicesTotal.partial && waServicesTotal.amount === 0
          ? 'on request'
          : `${waServicesTotal.partial ? 'from ' : ''}${formatPrice(waServicesTotal.amount)} ${sym}`;

      lines.push(`➕ Obligatory services: ${amountTxt} (payable separately, not included)`);
    }

    if (y.listPriceEur != null && y.listPriceEur > y.clientPriceEur) {
      const save = y.listPriceEur - y.clientPriceEur;

      lines.push(`~${formatPrice(y.listPriceEur)} ${sym}~ · save ${formatPrice(save)} ${sym}`);
    }

    // Option deadline (if any)
    if (y.isOption && y.optionExpiresAt) {
      const [datePart, timePart = ''] = y.optionExpiresAt.split('T');
      const [yy, mm, dd] = datePart.split('-');
      const hm = timePart ? timePart.slice(0, 5) : '';
      const formatted = hm ? `${dd}.${mm}.${yy} ${hm}` : `${dd}.${mm}.${yy}`;

      lines.push(`⏳ Under option until ${formatted}`);
    }

    // Public yacht detail link — WhatsApp auto-previews the first URL. Carries
    // the offer's dates + currency so the client opens this week's exact price.
    const detailUrl = withOfferDates(y);

    if (detailUrl) {
      lines.push('');
      lines.push(`🔗 ${detailUrl}`);
    }

    return lines.join('\n');
  });

  return sections.join('\n\n────────\n\n');
};

export const buildClientOfferHtml = (
  cart: CartYacht[],
  options: OfferRenderOptions = {},
  autoObligatoryByYacht: Record<string, CartExtra[]> = {}
): string => {
  if (cart.length === 0) {
    return '<p><em>No yachts added to offer yet.</em></p>';
  }

  const blocks = cart
    .map((y, i) => renderYachtBlock(y, i + 1, options, autoObligatoryByYacht[offerYachtKey(y)] ?? []))
    .join('\n');

  // One "route ideas" line for the whole offer (was one per card): distinct
  // boat4you sailing areas, max 3, labelled by the first yacht's marina there.
  const areas = new Map<string, string>();

  cart.forEach(y => {
    const url = itineraryAreaUrl([y.base, y.locationName], y.country);

    if (url && !areas.has(url)) areas.set(url, y.base || y.locationName);
  });

  const routeLinks = Array.from(areas)
    .slice(0, 3)
    .map(
      ([url, label]) =>
        `<a href="${escapeHtml(url)}" target="_blank" style="color:${BRAND.primary};font-weight:600">${escapeHtml(label)}</a>`
    )
    .join(' · ');
  const itineraryLine = routeLinks
    ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.5">Route ideas for your week: ${routeLinks}</p>`
    : '';

  // Closing — English, no greeting and no signature (the broker's mail
  // client adds those).
  const closing = `${TABLE} style="margin:0 0 10px"><tr><td style="background:${BRAND.primarySoft};border:1px solid ${BRAND.primaryBorder};border-radius:10px;padding:14px 16px;font-size:15px;line-height:1.5"><b>Next step:</b> reply with <b>HOLD</b> and the yacht name, for example <i>“HOLD ${escapeHtml(cart[0].name)}”</i>, and I will place a <b>free, non-binding option</b> on it for <b>${HOLD_OPTION_HOURS} hours</b> while you decide. No payment is needed for the option.</td></tr></table>
<p style="margin:0 0 14px;font-size:13px;line-height:1.5;color:${BRAND.textMuted}">✓ Free cancellation within 72 hours of booking &nbsp;·&nbsp; ✓ Lowest rate guaranteed &nbsp;·&nbsp; ✓ Secure online booking on boat4you.com, our booking platform</p>`;

  // Outer wrapper — fluid (width 100% + max-width 640), centred via the align
  // attribute (margin:auto fails on tables in Outlook).
  return `${TABLE}><tr><td align="center">${TABLE} align="center" style="max-width:640px;font-family:${FONT_STACK};color:${BRAND.text};text-align:left"><tr><td>
${blocks}
${itineraryLine}${closing}
</td></tr></table></td></tr></table>`;
};
