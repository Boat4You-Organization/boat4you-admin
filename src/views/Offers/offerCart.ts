// Cart figures of one yacht in the Offers workspace: its extras list and its security deposit, built from the public
// yacht detail. Kept free of React so `yarn test` can run it (tests/offer-cart.test.ts).
//
// 16.11.2026 a two-week NauSys offer had no extras yet (the per-yacht sync runs after the response), so the catalogue
// alone supplied the obligatory rows, and the client was sent an old amount under "payable separately" with the
// yacht-level deposit. An offer in that state is now waited for, and a NauSys yacht still without extras is not added.
import type { CartExtra, ExtraPaymentType } from './offerHtml';

export interface ExtraResponse {
  id?: number;
  externalId?: number | string | null;
  key?: string;
  name?: string;
  priceEur?: number | null;
  // Currency-converted amount when the request carried ?currency= — priceEur
  // ALWAYS stays EUR (29.7.2026: a GBP offer showed "250.00 £" for a 250 €
  // service — symbol swapped, amount not). Cart snapshots priceInfo.amount.
  priceInfo?: { amount: number; currency?: string; rate?: number } | null;
  obligatory?: boolean;
  payableInBase?: boolean;
  // How the client pays it (WITH_BOOKING = charged online with the charter).
  paymentType?: ExtraPaymentType | null;
  unit?: string | null;
  description?: string | null;
  extras?: { labelCode?: string };
}

/** The fields of one offer of the detail response the cart is built from. */
export interface CartOfferSource {
  obligatoryExtrasKeys?: string[];
  supersededExtrasKeys?: string[];
  extras?: ExtraResponse[];
  // The partner's deposit for this period. Absent on a backend older than 18.11.2026.
  securityDeposit?: number | null;
}

// Maps the backend ExtrasUnitType enum to the human label shown in the offer.
// Module-scoped so both the add-to-cart extras builder and the live /calculate
// effect (skipper -> Damage Waiver) format units identically.
export const UNIT_LABEL: Record<string, string> = {
  PER_WEEK: 'per week',
  PER_WEEK_PERSON: 'per week / person',
  PER_BOOKING: 'per booking',
  PER_BOOKING_PERSON: 'per booking / person',
  PER_NIGHT: 'per night',
  PER_NIGHT_PERSON: 'per person / night',
  PER_BOAT: 'per boat',
  PERCENTAGE: '%',
};

/** The admin search row names the partner system for SYSTEM_ADMIN only; a MANAGER gets null ("unknown"). */
export const isNauSys = (sourceSystem: string | null | undefined): boolean =>
  (sourceSystem || '').toUpperCase() === 'NAUSYS';

/**
 * True when the offer came back without a single extra and that may only mean "not synced yet": the per-yacht partner
 * sync runs in the background of the very request that returned this offer. The caller waits and asks again.
 * Never for an own (custom) yacht, and never for MMK, whose offers carry obligatory rows only and are legitimately
 * empty when the period has none. An unknown system (MANAGER) is treated like NauSys here: waiting costs seconds.
 */
export const offerMayLackSyncedExtras = (
  sourceSystem: string | null | undefined,
  custom: boolean | null | undefined,
  offer: CartOfferSource
): boolean => custom !== true && (sourceSystem || '').toUpperCase() !== 'MMK' && (offer.extras || []).length === 0;

/** Obligatory rows of the yacht catalogue: what would have to stand in for a partner offer that carries no extras. */
export const catalogueHasObligatory = (services: ExtraResponse[]): boolean => services.some(s => s.obligatory === true);

/**
 * The deposit shown on the card, in the cart currency: the offer's own (it differs by period), else the yacht-level
 * figure. Both arrive in EUR; `rate` is the offer's EUR -> cart currency rate.
 */
export const cartSecurityDeposit = (
  offerDeposit: number | null | undefined,
  yachtDeposit: number | null | undefined,
  rate: number | null | undefined
): number | null => {
  const eur = offerDeposit ?? yachtDeposit;

  return eur != null ? Math.round(Number(eur) * (rate ?? 1) * 100) / 100 : null;
};

/**
 * The merge of catalogue and offer rows is the one the checkout makes (PriceCalculationService.mergeYachtAndOfferExtras):
 * an offer row replaces its catalogue twin, a catalogue row the offer does not carry stays.
 *
 * @param services      yacht-level catalogue rows (`yachtDetails.services`)
 * @param matchedOffer  the offer of the period
 */
export const buildCartExtras = (services: ExtraResponse[], matchedOffer: CartOfferSource): CartExtra[] => {
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
      paymentType?: ExtraPaymentType | null;
    };
  } => {
    // Converted amount first (active currency), EUR as fallback — priceEur
    // is ALWAYS EUR while the card renders with the cart currency symbol.
    const priceNum = e.priceInfo?.amount ?? (e.priceEur != null ? Number(e.priceEur) : null);
    const name = e.name || e.extras?.labelCode || e.key || 'Extra';
    // Stable de-dup key: partner row id (`e.key`), then catalogue labelCode,
    // then name+price. The partner row id wins over labelCode because the
    // same partner row appears on BOTH yacht.services (with labelCode
    // mapped) and offer.extras (with labelCode null) — keying on labelCode
    // broke the merge and rendered "Charter package" twice.
    // obligatoryExtrasKeys uses `e.key` too. NOT externalId: NauSys
    // obligatory offer rows carry synthetic per-offer ids, so keying on it
    // split catalogue/offer twins; the partner id (sent to admins only, as a
    // string) is used below only to drop a renamed catalogue twin, like the
    // price calc's mergeYachtAndOfferExtras.
    const key = String(e.key ?? e.extras?.labelCode ?? `${name.toLowerCase().trim()}-${priceNum ?? '-'}`);

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
        // Same fallback as the checkout (foldedIntoOurPayment): an unclassified
        // row not payable in base is charged online with the charter.
        paymentType: e.paymentType ?? (e.payableInBase === false ? 'WITH_BOOKING' : null),
      },
    };
  };

  const extrasMap = new Map<string, ReturnType<typeof toCartExtra>['value']>();

  // Partner models ONE obligatory charge as duration siblings ("Comfort
  // Pack" / "… 2 weeks" / "… 3 weeks"), all flagged obligatory on the yacht;
  // the offer carries the one that applies. The backend lists the others as
  // supersededExtrasKeys — never show them (LUNA Lagoon 46 card stacked all
  // three, Mario 23.8.2026).
  const supersededKeys = new Set(matchedOffer.supersededExtrasKeys || []);

  // Catalogue row key by partner id: the partner renames a charge in place
  // ("Premium Line Pack (… Outboard Engine)" -> "(… Outboard Engine; 1 SUP)",
  // same id); an older offer keeps the old name while the catalogue has the
  // new one, and the client e-mail listed the pack twice (29.9.2026).
  const catalogueKeyByExternalId = new Map<string, string>();

  services.forEach(s => {
    if (s.key != null && supersededKeys.has(s.key)) return;

    const { key, value } = toCartExtra(s, false);

    extrasMap.set(key, value);

    if (s.externalId != null) catalogueKeyByExternalId.set(String(s.externalId), key);
  });

  // Offer-level data wins where the partner sent period-specific values,
  // but DO NOT force-flag every offer.extras row as obligatory — trust the
  // partner-side `obligatory` boolean instead. Forcing it caused yachts with
  // large optional services lists (Excess 11: Extra towels, Crew change,
  // Transfer, etc.) to dominate the offer card while yachts with leaner
  // partner data (Bali 4.3) looked clean — visually inconsistent across
  // the same offer. obligatoryExtrasKeys still pins items the partner
  // explicitly tagged.
  // The partner often names the SAME obligatory charge differently on the
  // yacht catalogue vs the offer feed ("Comfort Pack 39/40/42 (…, OB)" vs
  // "Comfort Pack 38/39/40/42 (…)") — strict keys can't unify those and
  // the card showed the pack twice (Mario 26.7.2026, Master Yachting
  // LUNA). Normalize away the size-group digits and parentheticals so an
  // offer-level obligatory row supersedes its catalogue twin.
  const normalizeExtraName = (n: string): string =>
    n
      .toLowerCase()
      .replace(/\(.*?\)/g, '')
      .replace(/[\d/]+/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  // The offer's extras list is already one row per partner charge (backend
  // Offer.filterDuplicateExtras): two obligatory rows under one catalogue
  // key ("Skipper" + "Skipper's liability insurance") are two charges and
  // the checkout bills both since 26.9.2026 — so a later offer row must not
  // overwrite an earlier one that shares its key.
  const offerRowKeys = new Set<string>();

  (matchedOffer.extras || []).forEach(e => {
    const converted = toCartExtra(e, false);
    const { value } = converted;
    const key =
      value.obligatory && offerRowKeys.has(converted.key)
        ? `${converted.key}#${e.id ?? value.name.toLowerCase().trim()}`
        : converted.key;

    offerRowKeys.add(key);

    // Same partner charge under another catalogue name: the offer row replaces
    // it (mirrors PriceCalculationService.mergeYachtAndOfferExtras). Never a row
    // another offer charge already holds.
    const renamedTwinKey = e.externalId != null ? catalogueKeyByExternalId.get(String(e.externalId)) : undefined;

    if (renamedTwinKey != null && renamedTwinKey !== key && !offerRowKeys.has(renamedTwinKey)) {
      const twin = extrasMap.get(renamedTwinKey);

      if (twin && !value.description && twin.description) value.description = twin.description;

      extrasMap.delete(renamedTwinKey);
    }

    // Merge: keep richer description when offer-level lacks one.
    const existing = extrasMap.get(key);

    if (existing && !value.description && existing.description) {
      value.description = existing.description;
    }

    // Supersede a catalogue OBLIGATORY twin (same normalized name +
    // price + unit) — the offer row carries the period-specific truth.
    if (value.obligatory) {
      const norm = normalizeExtraName(value.name);

      Array.from(extrasMap.entries())
        .filter(
          ([k, v]) =>
            k !== key &&
            !offerRowKeys.has(k) && // only catalogue (yacht) twins — never another offer charge
            v.obligatory &&
            v.priceEur === value.priceEur &&
            v.unit === value.unit &&
            normalizeExtraName(v.name) === norm
        )
        .forEach(([k]) => extrasMap.delete(k));
    }

    extrasMap.set(key, value);
  });

  return Array.from(extrasMap.values());
};

/** The figures of a cart entry the client pays by. */
export interface CartFigures {
  clientPriceEur: number;
  securityDepositEur: number | null;
  extras: CartExtra[];
}

const obligatorySignature = (extras: CartExtra[]): string =>
  extras
    .filter(x => x.obligatory)
    .map(x => `${x.name.trim().toLowerCase()}|${x.priceEur ?? '-'}|${x.paymentType ?? '-'}`)
    .sort()
    .join(';');

/** Which of price / obligatory extras / security deposit differ between the cart snapshot and a fresh read. */
export const cartFigureChanges = (before: CartFigures, after: CartFigures): string[] => {
  const changed: string[] = [];

  if (Math.abs(before.clientPriceEur - after.clientPriceEur) >= 0.01) changed.push('price');

  if (obligatorySignature(before.extras) !== obligatorySignature(after.extras)) changed.push('obligatory extras');

  if ((before.securityDepositEur ?? null) !== (after.securityDepositEur ?? null)) changed.push('security deposit');

  return changed;
};
