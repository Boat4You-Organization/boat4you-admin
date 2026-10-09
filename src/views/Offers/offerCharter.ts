// Admin-only (backend YachtSearchResponseDto.offerCharter, 9.10.2026): how the offer behind a search card is
// chartered - the one "Add to offer" adds for the card's dates. Bareboat; Skippered = a bareboat offer whose skipper
// (or captain) is an obligatory charge; Crewed = a crewed product, a crew-only boat, an obligatory crew charge, or any
// gulet (a gulet is never bareboat). Shown to the broker only, never copied into client text.

export type OfferCharterKind = 'BAREBOAT' | 'SKIPPERED' | 'CREWED';

export type OfferCharterBasis =
  | 'GULET'
  | 'CREWED_PRODUCT'
  | 'CREWED_YACHT'
  | 'OBLIGATORY_CREW'
  | 'OBLIGATORY_SKIPPER'
  | 'BAREBOAT';

export interface OfferCharter {
  kind: OfferCharterKind;
  basis: OfferCharterBasis;
  // The partner's name of the obligatory skipper / crew charge behind SKIPPERED or OBLIGATORY_CREW.
  obligatoryExtra?: string | null;
}

export const OFFER_CHARTER_LABEL: Record<OfferCharterKind, string> = {
  BAREBOAT: 'Bareboat',
  SKIPPERED: 'Skippered',
  CREWED: 'Crewed',
};

export const OFFER_CHARTER_COLORS: Record<
  OfferCharterKind,
  { color: string; backgroundColor: string; border: string }
> = {
  BAREBOAT: { color: '#1d4ed8', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' },
  SKIPPERED: { color: '#0f766e', backgroundColor: '#f0fdfa', border: '1px solid #99f6e4' },
  CREWED: { color: '#15803d', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' },
};

const CHARGE_MAX = 120;

const quoted = (name?: string | null): string => {
  const n = (name || '').trim();

  if (!n) return '';

  return ` "${n.length > CHARGE_MAX ? `${n.slice(0, CHARGE_MAX - 1)}…` : n}"`;
};

// Why the pill says what it says (hover text).
export const offerCharterReason = (c: OfferCharter): string => {
  switch (c.basis) {
    case 'GULET':
      return 'Gulet - always chartered with its crew, never bareboat.';
    case 'CREWED_PRODUCT':
      return 'The partner sells this offer as a crewed charter.';
    case 'CREWED_YACHT':
      return 'The partner lists this boat for crewed charter only.';
    case 'OBLIGATORY_CREW':
      return `Crew is an obligatory charge on this offer:${quoted(c.obligatoryExtra)}.`;
    case 'OBLIGATORY_SKIPPER':
      return `Bareboat offer with an obligatory skipper:${quoted(c.obligatoryExtra)}.`;
    default:
      return 'No obligatory skipper or crew on this offer - a skipper can still be added as an extra.';
  }
};

// The backend's object, or null for anything else (an older backend without the field, a malformed value).
export const toOfferCharter = (raw: unknown): OfferCharter | null => {
  if (!raw || typeof raw !== 'object') return null;

  const { kind, basis, obligatoryExtra } = raw as Record<string, unknown>;

  if (kind !== 'BAREBOAT' && kind !== 'SKIPPERED' && kind !== 'CREWED') return null;

  return {
    kind,
    basis: (typeof basis === 'string' ? basis : 'BAREBOAT') as OfferCharterBasis,
    obligatoryExtra: typeof obligatoryExtra === 'string' ? obligatoryExtra : null,
  };
};
