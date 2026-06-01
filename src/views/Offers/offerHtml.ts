/**
 * Builds the HTML snippet the broker copy-pastes into their own email
 * client. Layout: a horizontal hero band (half-width photo left · date /
 * title / location / amenities right), then spec chips, then obligatory
 * services + price — kept low so several yachts stack readably in one
 * offer. Agency identity is intentionally OMITTED from the output — the
 * broker wants the customer to stay on boat4you, not learn which partner
 * runs the fleet.
 */

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

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

  
// Prefer an EXACT name match ("Skipper") over a loose contains, and skip the
  // separate "Additional fee for Skipper in forepeak..." surcharge. Otherwise
  // that surcharge (it contains "skipper") gets picked as the skipper row and
  // the real Skipper service — and its price — never shows. Mirrors the backend
  // `not:additional fee` skipper match rule.
  const exact = extras.find(e => (e.name || '').trim().toLowerCase() === k);

  if (exact) return exact;

  return (
    extras.find(e => {
      const n = (e.name || '').toLowerCase();

      return n.includes(k) && !n.includes('additional fee');
    }) || null
  );
};

const formatDateLong = (isoDate: string, time?: string): string => {
  // "2026-05-23" → "May 23, 2026 17:00"
  if (!isoDate) return '';

  const parts = isoDate.split('-');

  if (parts.length !== 3) return isoDate;

  const [y, m, d] = parts;
  const mi = Math.max(0, Math.min(11, Number(m) - 1));
  const base = `${MONTHS[mi]} ${Number(d)}, ${y}`;

  
return time ? `${base} ${time}` : base;
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

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

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

const FONT_STACK = '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif';

// Modern display face for the yacht title (model + name). Pulled via @import
// in the responsive <style> block — renders in clients that honour web fonts
// (Apple Mail, most webmail); Gmail/Outlook fall back to the system stack.
const POPPINS_STACK = '\'Poppins\', -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif';

/**
 * One specs chip (e.g. "Length 15.35 m"). Pill-shaped with a soft brand
 * background — uses an inline-block table cell so it survives Gmail's
 * aggressive style stripping. `whiteSpace: nowrap` keeps "15.35 m" from
 * wrapping mid-value on narrow Gmail mobile.
 */
const renderChip = (label: string, value: string): string => `
<td style="padding: 0 6px 6px 0;" valign="top">
  <table border="0" cellpadding="0" cellspacing="0" role="presentation"><tr>
    <td style="background: ${BRAND.primarySoft}; border: 1px solid ${BRAND.primaryBorder}; border-radius: 14px; padding: 5px 11px; font-family: ${FONT_STACK}; font-size: 12px; line-height: 1.2; color: ${BRAND.text}; white-space: nowrap;">
      <span style="color: ${BRAND.textMuted};">${escapeHtml(label)}</span>&nbsp;<b>${escapeHtml(value)}</b>
    </td>
  </tr></table>
</td>`;

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

// Amenities as a compact inline strip ("☀ Solar · 🛥 Dinghy · ❄ AC · …")
// instead of the old 54x54 boxes — keeps the hero band's right column low
// so each card stays short when several yachts stack in one offer.
const renderAmenitiesInline = (items: { labelCode: string; label: string }[]): string =>
  items
    .slice(0, 4)
    .map(a => `${AMENITY_ICON_MAP[a.labelCode] || '•'} ${escapeHtml(AMENITY_SHORT_LABEL[a.labelCode] || a.label)}`)
    .join(' &nbsp;&middot;&nbsp; ');

const renderYachtBlock = (y: CartYacht, options: OfferRenderOptions = {}, autoObligatory: CartExtra[] = []): string => {
  const periodHeader = `${formatDateLong(y.dateFrom, y.checkin)}  →  ${formatDateLong(y.dateTo, y.checkout)}`;
  const title = `${y.modelName} (${y.name})`;
  const sym = y.currencySymbol || '€';

  // Specs chips — only render values we actually have so the row never
  // shows "Length —". Order matches what brokers said matters most:
  // type → year → length → cabins → berths → WC.
  const chips: Array<[string, string]> = [];

  if (y.vesselType) chips.push(['Type', humanizeVesselType(y.vesselType)]);

  if (y.buildYear != null) chips.push(['Year', String(y.buildYear)]);

  if (y.lengthMeters != null) chips.push(['Length', `${y.lengthMeters.toFixed(2)} m`]);

  if (y.cabins != null) chips.push(['Cabins', String(y.cabins)]);

  if (y.berths != null) chips.push(['Berths', String(y.berths)]);

  if (y.wc != null) chips.push(['WC', String(y.wc)]);

  if (y.mainSailType) chips.push(['Mainsail', humanizeVesselType(y.mainSailType)]);

  // Pricing — line-through old, big new, savings badge if discount > 0.
  const hasDiscount = y.listPriceEur != null && y.listPriceEur > y.clientPriceEur;
  const discountPct =
    hasDiscount && y.listPriceEur != null && y.listPriceEur > 0
      ? ((y.listPriceEur - y.clientPriceEur) / y.listPriceEur) * 100
      : 0;
  const discountAmount =
    hasDiscount && y.listPriceEur != null ? y.listPriceEur - y.clientPriceEur : 0;

  // Title — model + name in a modern Poppins face. Clickable when a public
  // detail URL exists; the font is re-declared on the <a> because some
  // clients (Apple Mail, Outlook) inject default link styles that ignore
  // inherited font rules.
  const titleStyle = `font-family: ${POPPINS_STACK}; font-size: 22px; font-weight: 600; color: ${BRAND.text}; line-height: 1.18; letter-spacing: -0.2px; -webkit-text-size-adjust: 100%;`;
  const titleHtml = y.detailUrl
    ? `<a href="${escapeHtml(y.detailUrl)}" style="${titleStyle} text-decoration: none;" target="_blank" rel="noopener">${escapeHtml(title)}</a>`
    : `<span style="${titleStyle}">${escapeHtml(title)}</span>`;

  // Hero image cell — half-width (248px) and near-landscape (248x192) so the
  // mostly-square partner photos show far more of the boat than the old
  // full-width 640x220 letterbox crop. Labelled placeholder when no image.
  const heroCell = y.imageUrl
    ? `<img src="${escapeHtml(y.imageUrl)}" alt="${escapeHtml(y.modelName)}" width="248" height="192" class="b4y-img" style="display: block; width: 248px; height: 192px; object-fit: cover; border-radius: 10px;" />`
    : `<table border="0" cellpadding="0" cellspacing="0" width="248" role="presentation" class="b4y-img" style="width: 248px;"><tr><td align="center" valign="middle" height="192" style="height: 192px; background: ${BRAND.primarySoft}; border: 1px solid ${BRAND.primaryBorder}; border-radius: 10px; color: ${BRAND.textMuted}; font-family: ${FONT_STACK}; font-size: 11px; letter-spacing: 0.6px; text-transform: uppercase; font-weight: 700;">Yacht photo</td></tr></table>`;

  // Compact inline amenities (icon + short label) for the hero right column.
  const amenitiesInline = renderAmenitiesInline(y.keyAmenities || []);

  // Option badge — time-sensitive offers render "Under option until …" under
  // the period date in the hero right column.
  const optionBadge = y.isOption
    ? (() => {
        const formatted = y.optionExpiresAt
          ? (() => {
              const [datePart, timePart = ''] = y.optionExpiresAt!.split('T');
              const [yy, mm, dd] = datePart.split('-');
              const hm = timePart ? timePart.slice(0, 5) : '';

              return hm ? `${dd}.${mm}.${yy} ${hm}` : `${dd}.${mm}.${yy}`;
            })()
          : null;
        const badgeText = formatted ? `Under option until ${formatted}` : 'Under option';

        return `<div style="margin-top: 6px;"><span style="display: inline-block; background: ${BRAND.warnSoft}; color: ${BRAND.warn}; font-family: ${FONT_STACK}; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; letter-spacing: 0.3px;">${escapeHtml(badgeText)}</span></div>`;
      })()
    : '';

  // Location line under title — country, base, joined with a middle-dot
  // separator. Stays one line on desktop, wraps on mobile.
  const locationLine = [y.country, y.base].filter(Boolean).join(' · ');

  // Only obligatory extras surface in the client offer — optional add-ons
  // were dropped (23.4.2026) because brokers found them noisy and customers
  // routinely asked "is this included in the price?" when scanning a long
  // optional list. Non-obligatory extras still stay on the public boat
  // detail page for customers who follow the "More info" link.
  //
  // Mario explicitly wants ALL obligatory rows visible (1.5.2026), including
  // free/"included" ones like "WiFi GRATIS ON BOAT". The renderer below shows
  // those with a green "included" badge so customers see the value without
  // confusing them about price.
  const obligatory = y.extras.filter(e => e.obligatory);

  // Force-include Skipper / Hostess when the broker toggled them ON for
  // this offer (inquiry asked for crewed sailing). Avoid duplicating if the
  // partner already attached the row as obligatory — the existing entry
  // wins. Missing row → "on request" placeholder so broker replaces price
  // manually before sending.
  const placeholderExtra = (label: string): CartExtra => ({
    name: label,
    priceEur: null,
    included: false,
    obligatory: true,
    description: 'On request — confirm with charter',
    unit: null,
  });
  const ensureCrewExtra = (keyword: string, label: string) => {
    const alreadyShown = obligatory.some(e =>
      (e.name || '').toLowerCase().includes(keyword.toLowerCase())
    );

    if (alreadyShown) return;

    const found = findExtraByKeyword(y.extras, keyword);

    obligatory.push(found ? { ...found, obligatory: true } : placeholderExtra(label));
  };

  if (options.includeSkipper) ensureCrewExtra('skipper', 'Skipper');

  if (options.includeHostess) ensureCrewExtra('hostess', 'Hostess');

  // Partner-recomputed obligatory extras fetched live via /calculate when crew
  // is toggled on — chiefly the NauSys Damage Waiver that becomes mandatory once
  // a Skipper is added (mirrors the customer boat page). Promote/append each,
  // deduped by name against whatever is already shown (handling/preparation
  // fees + the crew rows above), so we never double a line.
  autoObligatory.forEach(extra => {
    const name = (extra.name || '').trim().toLowerCase();

    if (!name) return;

    const alreadyShown = obligatory.some(e => (e.name || '').trim().toLowerCase() === name);

    if (!alreadyShown) obligatory.push({ ...extra, obligatory: true });
  });

  const renderExtraRow = (e: CartExtra): string => {
    // "Included" is reserved for items that are TRULY free (e.priceEur=0 →
    // mapper sets included=true). priceEur=null means data is missing — show
    // a dash, NOT "included" (avoids the Captain/Chef/Stewardess false-
    // positives Mario flagged on crewed yachts where every item read as
    // "included").
    // eslint-disable-next-line no-nested-ternary
    const priceStr = e.included
      ? `<span style="color: ${BRAND.success}; font-weight: 600;">included</span>`
      : e.priceEur == null
        ? `<span style="color: ${BRAND.textFaint};">—</span>`
        : `<b>${priceWithCurrency(e.priceEur, sym)}</b>`;
    const unitSuffix = e.unit
      ? ` <span style="color: ${BRAND.textMuted}; font-weight: 400;">${escapeHtml(e.unit)}</span>`
      : '';
    const descriptionLine = e.description
      ? `<div style="font-size: 11px; color: ${BRAND.textMuted}; margin-top: 2px; line-height: 1.4;">${escapeHtml(e.description)}</div>`
      : '';

    
return `<tr>
      <td style="padding: 6px 12px 6px 0; font-size: 13px; color: ${BRAND.text};">
        <div>${escapeHtml(e.name)}</div>
        ${descriptionLine}
      </td>
      <td valign="top" style="padding: 6px 0; font-size: 13px; text-align: right; white-space: nowrap;">${priceStr}${unitSuffix}</td>
    </tr>`;
  };

  // Security deposit renders as a final row inside "Selected services" to
  // mirror the public ExtrasTab (web) — refundable, paid at the marina,
  // always mandatory. Styled muted (opacity 0.7) like the web row so it
  // reads as part of the obligatory stack without dominating it.
  const hasSecurityDeposit = y.securityDepositEur != null && y.securityDepositEur > 0;
  const securityDepositRow = hasSecurityDeposit
    ? `<tr>
        <td style="padding: 6px 12px 6px 0; font-size: 13px; color: ${BRAND.text}; opacity: 0.7;">
          <div>Refundable Security Deposit</div>
          <div style="font-size: 11px; color: ${BRAND.textMuted}; margin-top: 2px; line-height: 1.4;">Refundable, settled at the marina</div>
        </td>
        <td valign="top" style="padding: 6px 0; font-size: 13px; text-align: right; white-space: nowrap; opacity: 0.7;">
          <b>${priceWithCurrency(y.securityDepositEur, sym)}</b>
          <span style="color: ${BRAND.textMuted}; font-weight: 400;"> per booking</span>
        </td>
      </tr>`
    : '';

  const extrasSection: string[] = [];

  if (obligatory.length > 0 || hasSecurityDeposit) {
    extrasSection.push(`
      <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 12px;">
        <tr><td colspan="2" style="font-family: ${FONT_STACK}; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: ${BRAND.textMuted}; -webkit-text-size-adjust: 100%; padding-bottom: 6px;">Selected services <span style="font-weight: 400; text-transform: none; letter-spacing: 0;">(obligatory additional)</span></td></tr>
        ${obligatory.map(renderExtraRow).join('')}
        ${securityDepositRow}
      </table>`);
  }

  // Bottom EQUIPMENT grid was removed (1.5.2026) — its render was conditional
  // on per-yacht equipmentByCategory rows being synced, which made adjacent
  // yachts in the same offer look very different ("Bali 4.3" had no grid,
  // "Excess 11" had a 7-column wall). Top-4 amenity pills next to the title
  // already convey the marquee features (AC / Generator / Dinghy / Cooker /
  // …) and stay visually consistent across every yacht in the cart.
  const equipmentSection = '';

  // Right-hand price card — soft green bg, big number, optional savings
  // badge above. Renders as its own table-cell so it sits flush with the
  // extras column to its left. Security deposit NO LONGER shows here —
  // moved into the "Selected services" list to match the web ExtrasTab.
  const priceCard = `
    <td class="b4y-price-col" valign="top" width="220" style="width: 220px; padding-left: 16px; vertical-align: top;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background: ${BRAND.successSoft}; border: 1px solid ${BRAND.successBorder}; border-radius: 10px;">
        <tr><td style="padding: 16px 16px 14px 16px;">
          ${
            hasDiscount
              ? `
          <div style="display: inline-block; background: ${BRAND.saveBg}; color: ${BRAND.saveText}; font-family: ${FONT_STACK}; font-size: 11px; font-weight: 700; padding: 4px 9px; border-radius: 10px; margin-bottom: 8px; letter-spacing: 0.3px;">
            SAVE ${discountPct.toFixed(0)}% &nbsp;·&nbsp; -${priceWithCurrency(discountAmount, sym)}
          </div>
          <div style="font-family: ${FONT_STACK}; font-size: 13px; color: ${BRAND.textFaint}; text-decoration: line-through; margin-bottom: 2px;">${priceWithCurrency(y.listPriceEur, sym)}</div>`
              : ''
          }
          <div style="font-family: ${FONT_STACK}; font-size: 24px; font-weight: 800; color: ${BRAND.success}; line-height: 1.1;">${priceWithCurrency(y.clientPriceEur, sym)}</div>
          <div style="font-family: ${FONT_STACK}; font-size: 11px; color: ${BRAND.textMuted}; margin-top: 4px;">total for the period</div>
          ${
            y.detailUrl
              ? `
          <div style="margin-top: 14px;">
            <a href="${escapeHtml(y.detailUrl)}" target="_blank" rel="noopener" style="display: inline-block; background: ${BRAND.primary}; color: #ffffff; font-family: ${FONT_STACK}; font-size: 13px; font-weight: 600; text-decoration: none; padding: 9px 14px; border-radius: 6px;">More info  →</a>
          </div>`
              : ''
          }
        </td></tr>
      </table>
    </td>`;

  // Card-level wrapper — outer border + radius. Each yacht is wrapped in its
  // own outer table so spacing between cards stays consistent.
  return `
<table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin: 0 0 20px 0; font-family: ${FONT_STACK};">
  <tr><td>
    <table class="b4y-card" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background: ${BRAND.cardBg}; border: 1px solid ${BRAND.border}; border-radius: 12px;">

      <!-- Hero band — image left · date / title / location / amenities / specs chips all stacked right -->
      <tr><td style="padding: 14px 16px 8px 16px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tr>
          <td class="col-img" width="248" valign="top" style="width: 248px; padding: 0; line-height: 0;">${heroCell}</td>
          <td class="col-text" valign="top" style="vertical-align: top; padding-left: 18px;">
            <div style="font-family: ${FONT_STACK}; font-size: 12px; line-height: 1.3; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: ${BRAND.warn}; -webkit-text-size-adjust: 100%;">${escapeHtml(periodHeader)}</div>
            ${optionBadge}
            <p style="margin: 5px 0 1px 0; padding: 0;">${titleHtml}</p>
            ${
              locationLine
                ? `<div style="font-family: ${FONT_STACK}; font-size: 13px; color: ${BRAND.textMuted}; line-height: 1.3;">${escapeHtml(locationLine)}</div>`
                : ''
            }
            ${
              amenitiesInline
                ? `<div style="font-family: ${FONT_STACK}; font-size: 12px; color: ${BRAND.textMuted}; line-height: 1.6; margin-top: 9px;">${amenitiesInline}</div>`
                : ''
            }
            ${
              chips.length > 0
                ? `<table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-top: 8px;">${Array.from(
                    { length: Math.ceil(chips.length / 3) },
                    (_, i) => chips.slice(i * 3, i * 3 + 3),
                  )
                    .map(row => `<tr>${row.map(([k, v]) => renderChip(k, v)).join('')}</tr>`)
                    .join('')}</table>`
                : ''
            }
          </td>
        </tr></table>
      </td></tr>

      <tr><td class="b4y-pad-x" style="padding: 6px 16px 16px 16px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"><tr>
          <td class="b4y-extras-col" valign="top" style="vertical-align: top;">${extrasSection.join('')}</td>
          ${priceCard}
        </tr></table>
        ${equipmentSection}
      </td></tr>

    </table>
  </td></tr>
</table>`;
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

    // Public yacht detail link — WhatsApp auto-previews the first URL
    if (y.detailUrl) {
      lines.push('');
      lines.push(`🔗 ${y.detailUrl}`);
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

  const blocks = cart.map(y => renderYachtBlock(y, options, autoObligatoryByYacht[offerYachtKey(y)] ?? [])).join('\n');

  // Responsive style block — collapses the right-hand price card under the
  // extras list on screens narrower than ~600px (Gmail iOS/Android, Apple
  // Mail on iPhone). Gmail web preserves <style> blocks pasted via the
  // rich-text clipboard path; Outlook desktop ignores them but our inline
  // widths already give it the right desktop layout. The class names below
  // are the MUST-MATCH hooks for the inline <td> tags we render in
  // renderYachtBlock — keep in sync.
  const responsiveStyles = `
<style>
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
  @media only screen and (max-width: 600px) {
    .b4y-outer { width: 100% !important; }
    .b4y-card { width: 100% !important; }
    .col-img, .col-text, .b4y-extras-col, .b4y-price-col {
      display: block !important;
      width: 100% !important;
      padding-left: 0 !important;
      padding-right: 0 !important;
      box-sizing: border-box;
    }
    .b4y-img { width: 100% !important; height: 200px !important; }
    .col-text { padding: 12px 0 0 0 !important; }
    .b4y-price-col { padding-top: 12px !important; }
    .b4y-pad-x { padding-left: 14px !important; padding-right: 14px !important; }
  }
</style>`;

  // Outer wrapper — fluid (width="100%" + max-width:640px). Centered via
  // the table align attribute which works in Outlook where margin: auto
  // fails on table elements.
  return `${responsiveStyles}
<table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background: #f6f7fb;">
  <tr><td align="center" style="padding: 16px;">
    <table class="b4y-outer" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="max-width: 640px;">
      <tr><td>
        ${blocks}
      </td></tr>
    </table>
  </td></tr>
</table>`;
};
