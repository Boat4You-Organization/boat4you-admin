// Admin-only (backend YachtSearchResponseDto.offerCharter, 9.10.2026): how the offer behind a search card is
// chartered - the one "Add to offer" adds for the card's dates. Bareboat; Skippered = a bareboat offer whose skipper
// (or captain), and nobody else, is an obligatory charge; Crewed = a crewed product, a crew-only boat, an obligatory
// crew (a skipper and anyone else), or any gulet (a gulet is never bareboat). Shown to the broker only, never copied
// into client text.

export type OfferCharterKind = 'BAREBOAT' | 'SKIPPERED' | 'CREWED';

export type OfferCharterBasis =
  | 'GULET'
  | 'CREWED_PRODUCT'
  | 'CREWED_YACHT'
  | 'OBLIGATORY_CREW'
  | 'OBLIGATORY_SKIPPER'
  | 'OBLIGATORY_CREW_MEMBER'
  | 'BAREBOAT_UNCONFIRMED'
  | 'BAREBOAT';

export interface OfferCharter {
  kind: OfferCharterKind;
  // One of OfferCharterBasis; a basis this build does not know (a newer backend) reads the kind's own text.
  basis: string;
  // The partner's name of the obligatory charge behind OBLIGATORY_SKIPPER, OBLIGATORY_CREW or OBLIGATORY_CREW_MEMBER.
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
  // Orange: apart from Crewed's green at a glance, and from the yellow "option" pill next to it.
  SKIPPERED: { color: '#c2410c', backgroundColor: '#fff7ed', border: '1px solid #fdba74' },
  CREWED: { color: '#15803d', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' },
};

const CHARGE_MAX = 120;

// ': "name"' after a sentence's subject, nothing when the backend sent no name.
const quoted = (name?: string | null): string => {
  const n = (name || '').trim();

  if (!n) return '';

  return `: "${n.length > CHARGE_MAX ? `${n.slice(0, CHARGE_MAX - 1)}…` : n}"`;
};

const BASIS_REASON: Record<OfferCharterBasis, (c: OfferCharter) => string> = {
  GULET: () => 'Gulet - always chartered with its crew, never bareboat.',
  CREWED_PRODUCT: () => 'The partner sells this offer as a crewed charter.',
  CREWED_YACHT: () => 'The partner lists this boat for crewed charter only.',
  OBLIGATORY_CREW: c => `Obligatory crew on this offer${quoted(c.obligatoryExtra)}.`,
  OBLIGATORY_SKIPPER: c => `Bareboat offer with an obligatory skipper${quoted(c.obligatoryExtra)}.`,
  OBLIGATORY_CREW_MEMBER: c =>
    `Bareboat - the client skippers, but a crew member is an obligatory charge${quoted(c.obligatoryExtra)}.`,
  BAREBOAT_UNCONFIRMED: () =>
    'NauSys offer without a charter type, on a boat listed both bareboat and crewed, and no obligatory skipper or crew - confirm with the partner.',
  BAREBOAT: () => 'No obligatory skipper or crew on this offer.',
};

// A basis this build does not know says only what the kind says.
const KIND_REASON: Record<OfferCharterKind, (c: OfferCharter) => string> = {
  BAREBOAT: BASIS_REASON.BAREBOAT,
  SKIPPERED: BASIS_REASON.OBLIGATORY_SKIPPER,
  CREWED: () => 'Crewed offer.',
};

// Why the pill says what it says (hover text).
export const offerCharterReason = (c: OfferCharter): string =>
  Object.prototype.hasOwnProperty.call(BASIS_REASON, c.basis)
    ? BASIS_REASON[c.basis as OfferCharterBasis](c)
    : KIND_REASON[c.kind](c);

// The backend's object, or null for anything else (an older backend without the field, a malformed value).
export const toOfferCharter = (raw: unknown): OfferCharter | null => {
  if (!raw || typeof raw !== 'object') return null;

  const { kind, basis, obligatoryExtra } = raw as Record<string, unknown>;

  if (kind !== 'BAREBOAT' && kind !== 'SKIPPERED' && kind !== 'CREWED') return null;

  return {
    kind,
    basis: typeof basis === 'string' ? basis : '',
    obligatoryExtra: typeof obligatoryExtra === 'string' ? obligatoryExtra : null,
  };
};
