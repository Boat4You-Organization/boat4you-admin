/**
 * yachtCapacity.ts - shared capacity / rig formatter (capacity contract v1, 6.10.2026).
 *
 * Copy this file BYTE-IDENTICAL into:
 *   boat4you-web            src/utils/static/yachtCapacity.ts
 *   6 sisters (EY CY CC GR IT CB)  src/utils/static/yachtCapacity.ts
 *   boat4you-admin          src/utils/yachtCapacity.ts
 * Framework-free (no React, no next-intl, no fetch, no imports). Erasable TypeScript only.
 *
 * What it does: turns the backend `capacity` / `rig` blocks (CONTRACT.md section 2) - or, for old payloads and cached
 * admin carts, the flat fields - into DATA FRAGMENTS: labelled rows, compact chips and card chips. It never builds a
 * sentence: every site writes its own prose (SEO rule: never copy sentences between sisters) from `capacityFacts()`.
 *
 * Rules it enforces (CONTRACT.md section 7):
 *  - the partner's numbers only: no estimate (no cabins*2+2), unknown / 0 / negative = hidden, never "null" or "0";
 *  - "berths" wording from berths, "on board" wording from maxPersons; maxPersons is never shown as berths;
 *  - NauSys crew cabins / crew WC are separately labelled figures, never added to cabins / WC;
 *  - a split ("12 + 1 crew") is shown only when its parts add up exactly to the partner's number;
 *  - the partner note text is never changed; one pair of brackets is added only when the note starts with a letter or
 *    a digit ("8+2" -> "10 (8+2)"); a translated note comes from the reviewed table, an unseen one stays English and
 *    is marked lang="en";
 *  - crew count only for crewed charter types; skipper is its own part, never "crew";
 *  - showers only when the partner sent showers > 0; no "certified", no "with shower" anywhere.
 */

// ---------------------------------------------------------------------------------------------------------------
// Wire types (backend YachtDetailsDto.capacity / .rig; search rows carry `capacity` only, with short notes)
// ---------------------------------------------------------------------------------------------------------------

export type Dim = 'cabins' | 'berths' | 'heads';

export type SailKind =
  | 'FULL_BATTEN'
  | 'SEMI_FULL_BATTEN'
  | 'HALF_BATTEN'
  | 'CLASSIC'
  | 'FURLING'
  | 'SELF_TACKING_JIB'
  | 'JIB';

export const SAIL_KINDS: readonly SailKind[] = [
  'FULL_BATTEN',
  'SEMI_FULL_BATTEN',
  'HALF_BATTEN',
  'CLASSIC',
  'FURLING',
  'SELF_TACKING_JIB',
  'JIB',
];

export interface CapacitySplitDto {
  guests?: number | null;
  inCabins?: number | null;
  saloon?: number | null;
  crew?: number | null;
  skipper?: number | null;
}

export interface CapacityDimDto {
  value?: number | null;
  note?: string | null;
  split?: CapacitySplitDto | null;
}

export interface CapacityDto {
  cabins?: CapacityDimDto | null;
  berths?: CapacityDimDto | null;
  heads?: CapacityDimDto | null;
  crewCabins?: number | null;
  crewHeads?: number | null;
  showers?: number | null;
  crewShowers?: number | null;
  maxPersons?: number | null;
  recommendedPersons?: number | null;
  crewNumber?: number | null;
}

export interface SailDto {
  kind?: string | null;
  label?: string | null;
}

export interface EngineDto {
  label?: string | null;
  count?: number | null;
  powerEach?: number | null;
}

export interface RigDto {
  mainsail?: SailDto | null;
  headsail?: SailDto | null;
  engine?: EngineDto | null;
  draught?: number | null;
}

/** Anything that looks like a yacht: detail payload, search row, reservation, trip yacht, admin cart entry. */
export interface YachtLike {
  capacity?: CapacityDto | null;
  rig?: RigDto | null;
  // flat fields (old payloads, cached admin carts, search rows of an old backend)
  cabins?: number | string | null;
  berths?: number | string | null;
  wc?: number | string | null;
  maxPersons?: number | string | null;
  crewNumber?: number | string | null;
  enginePower?: number | string | null;
  custom?: boolean | null;
  customDetails?: { engineText?: string | null } | null;
  /** Detail: array of CharterType names; reservation / search row: one name. */
  charterType?: string | readonly string[] | null;
}

// ---------------------------------------------------------------------------------------------------------------
// Resolved model
// ---------------------------------------------------------------------------------------------------------------

export interface Split {
  guests: number | null;
  inCabins: number | null;
  saloon: number | null;
  crew: number | null;
  skipper: number | null;
}

export interface ResolvedNote {
  /** The partner's note, normalized (trim, NBSP -> space, collapsed blanks), English. */
  en: string;
  /** What to print: the reviewed translation, or `en`. */
  text: string;
  /** 'en' when `text` is the English original on a non-English page (wrap it in lang="en"). */
  lang: 'en' | null;
  /** Language-neutral (digits, + / ( ) and blanks only) and at most SHORT_NOTE_MAX characters: allowed on cards. */
  short: boolean;
}

export interface ResolvedDim {
  value: number;
  note: ResolvedNote | null;
  split: Split | null;
}

export type ResolvedEngine =
  | { type: 'text'; text: string; lang: 'en' | null }
  | { type: 'power'; count: number; powerEach: number };

export interface Capacity {
  locale: string;
  cabins: ResolvedDim | null;
  berths: ResolvedDim | null;
  heads: ResolvedDim | null;
  crewCabins: number | null;
  crewHeads: number | null;
  showers: number | null;
  crewShowers: number | null;
  maxPersons: number | null;
  recommendedPersons: number | null;
  /** Null unless crewNumber > 0 AND a crewed charter type is offered. */
  crew: { count: number; alsoBareboat: boolean } | null;
  mainsail: { kind: SailKind | null; label: string | null } | null;
  headsail: { kind: SailKind | null; label: string | null } | null;
  engine: ResolvedEngine | null;
  draught: number | null;
}

/** Looks a normalized English note up in the reviewed table (capacityNotes.json); undefined = not translated. */
export type NoteLookup = (note: string, dim: Dim) => string | undefined;

/** next-intl `t` of the `capacity` namespace, or createFmt() below. Keys are relative: 'label.cabins'. */
export type Fmt = (key: string, values?: Record<string, string | number>) => string;

export interface Segment {
  text: string;
  /** Set only when this piece is in another language than the page ('en' for an untranslated partner note). */
  lang?: string;
}

export type RowKey =
  | 'cabins'
  | 'crewCabins'
  | 'berths'
  | 'heads'
  | 'crewHeads'
  | 'showers'
  | 'crewShowers'
  | 'maxPeople'
  | 'recommendedPeople'
  | 'crew'
  | 'mainsail'
  | 'headsail'
  | 'engine'
  | 'draught';

export interface CapacityRow {
  key: RowKey;
  label: string;
  /** Plain text of the value (for PDFs, e-mail, WhatsApp, aria). */
  value: string;
  /** The same value split for rendering; wrap a segment with `lang` in <span lang={lang}>. */
  segments: Segment[];
}

export type ChipKey = 'cabins' | 'crewCabins' | 'berths' | 'heads' | 'crewHeads' | 'maxPeople' | 'crew';

export interface CapacityChip {
  key: ChipKey;
  text: string;
}

export type CardKey = 'cabins' | 'berths' | 'maxPeople';

export interface CardChip {
  key: CardKey;
  label: string;
  value: string;
}

export interface CapacityFacts {
  cabins: number | null;
  crewCabins: number | null;
  berths: number | null;
  /** Berths without crew - only when the partner's own split says so (NauSys identity, MMK strict parse). */
  guestBerths: number | null;
  heads: number | null;
  crewHeads: number | null;
  /** Only > 0 (NauSys): the ONLY figure that may back a "shower" claim. */
  showers: number | null;
  /** "max. people on board" - never "sleeps". */
  maxPersons: number | null;
  recommendedPersons: number | null;
  /** Gated like the crew row (crewed charter types only). */
  crewNumber: number | null;
}

// ---------------------------------------------------------------------------------------------------------------
// Constants shared with the backend (CONTRACT.md section 5)
// ---------------------------------------------------------------------------------------------------------------

/** Longest note a card or a search row may carry. */
export const SHORT_NOTE_MAX = 12;
/** Longest capacity note / label any public surface shows (the backend sanitizer hides longer ones). */
export const CAPACITY_NOTE_MAX = 120;
/** Charter types whose listing may show a crew count. */
export const CREWED_CHARTER_TYPES: readonly string[] = ['CREWED', 'ALL_INCLUSIVE', 'CRUISE'];

/** trim, U+00A0 / U+2007 / U+202F -> space, collapse blank runs; '' -> null. Same as the backend sync. */
export const normalizeNote = (raw: unknown): string | null => {
  if (typeof raw !== 'string') return null;

  const clean = raw.replace(/[\u00a0\u2007\u202f]/g, ' ').replace(/\s+/g, ' ').trim();

  return clean ? clean : null;
};

/** Digits, + / ( ) and blanks only, with at least one digit: reads the same in every language. */
export const isLanguageNeutral = (note: string): boolean => /^[0-9+/()\s]+$/.test(note) && /\d/.test(note);

/** The note as a card / search row may carry it: language-neutral and at most SHORT_NOTE_MAX characters. */
export const isShortNote = (note: string): boolean => note.length <= SHORT_NOTE_MAX && isLanguageNeutral(note);

// ---------------------------------------------------------------------------------------------------------------
// safeCapacityNote - the backend PartnerTextSanitizer.capacityNote rules, ported for an OPTIONAL second line of
// defence. Never route capacity notes through safePartnerText / sanitizePartnerYacht (they drop letter-less notes and
// strip a leading "+": critique B-1). Hides, never rewrites.
// ---------------------------------------------------------------------------------------------------------------

const W_BEFORE = '(?<![\\p{L}\\p{N}_])';
const W_AFTER = '(?![\\p{L}\\p{N}_])';
const wordsRx = (alternatives: readonly string[]): RegExp =>
  new RegExp(`${W_BEFORE}(?:${alternatives.join('|')})${W_AFTER}`, 'iu');

/** b4y HARD_WORDS + PROSE_WORDS, sister COMPANY_WORDS_RX, b4y NOTE_WORDS + sister INTERNAL_NOTE_RX (whole text). */
export const CAPACITY_NOTE_BLOCKED_WORDS: readonly string[] = [
  // operator voice, contract, premises (b4y HARD + sisters COMPANY)
  'liable',
  'liability',
  'charterers?',
  'the company',
  'manually',
  'to be (?:confirmed|updated|checked|defined|added|agreed|approved)',
  'tb[acd]',
  'piers?',
  'pontoons?',
  'ponton',
  'nausys',
  'mmk',
  'booking ?manager',
  'nss',
  // partner prose / company (b4y PROSE + sisters COMPANY)
  'yachts',
  'yachting',
  'charters?',
  'sailing',
  'ltd',
  'd\\.\\s?o\\.\\s?o\\.?',
  'bases?',
  'agency',
  'owners?',
  'office',
  'our',
  'we',
  'allowance',
  'moorings',
  // internal / back-office notes (b4y NOTE + sisters INTERNAL_NOTE)
  'internal',
  'notes?',
  'update[ds]?',
  'to update',
  'check with',
  'ask (?:the )?(?:base|office|agency|owner)',
  'agents?',
  'brokers?',
  'b2b',
  'commission',
  'admin',
  'office use',
  'net price',
  'do not (?:show|publish)',
  'not for (?:the )?clients?',
  'charter company',
  // literal junk tokens
  'null',
  'undefined',
  'nan',
];

const BLOCKED_WORDS_RX = wordsRx(CAPACITY_NOTE_BLOCKED_WORDS);
const SHOUTING_RX = /[!?]{2,}/;
const MARKUP_RX = /[<>{}\\`]|[\u0000-\u001f\u007f\u200b-\u200f\u2028-\u202e\u2060-\u2064\ufeff]/;
const EMAIL_RX = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}-]+\.[\p{L}\p{N}.-]+/u;
const WEB_RX =
  /\bhttps?:\/\/|\bwww\.|\b[\p{L}\p{N}-]{2,}\.(?:com|net|org|eu|hr|gr|it|de|es|fr|pt|me|tr|co|io|uk|info|biz|travel)\b/iu;
const CONTACT_WORD_RX = /\b(?:tel|phone|mob|mobile|whats ?app|viber)\b[.:]?\s*\+?\d/i;
const PHONE_RUN_RX = /\+?\(?\d[\d\s()./-]{6,}\d/g;
const LONG_NUMBER_RX = /\d[\d\s()./-]{8,}\d/;

const hasPhone = (text: string): boolean =>
  Array.from(text.matchAll(PHONE_RUN_RX)).some(match => {
    const run = match[0];
    const digits = run.replace(/\D/g, '').length;

    return digits >= 9 || (digits >= 8 && /^[+(]*0|^\+/.test(run));
  });

/**
 * A capacity note / engine label / unknown sail label as a public surface may show it, or null (hide - never
 * rewrite). `findOperatorName` = the site's operator matcher where it is available (server side only on b4y).
 */
export const safeCapacityNote = (
  raw: unknown,
  findOperatorName: (text: string) => boolean = () => false
): string | null => {
  const text = normalizeNote(raw);

  if (!text) return null;
  if (text.length > CAPACITY_NOTE_MAX) return null;
  if (MARKUP_RX.test(text)) return null;
  if (BLOCKED_WORDS_RX.test(text) || SHOUTING_RX.test(text)) return null;
  if (EMAIL_RX.test(text) || WEB_RX.test(text) || CONTACT_WORD_RX.test(text)) return null;
  if (hasPhone(text) || LONG_NUMBER_RX.test(text)) return null;
  if (findOperatorName(text)) return null;

  return text;
};

// ---------------------------------------------------------------------------------------------------------------
// fromYacht
// ---------------------------------------------------------------------------------------------------------------

const toNumber = (v: unknown): number | null => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' && /^\s*\d+(?:\.\d+)?\s*$/.test(v)) return Number(v);

  return null;
};

/** A partner count as shown: a positive number, else null (0 = "partner did not fill it in"). */
const positive = (v: unknown): number | null => {
  const n = toNumber(v);

  return n !== null && n > 0 ? n : null;
};

const isEnglish = (locale: string): boolean => /^en(?:[-_]|$)/i.test(locale);

const SPLIT_KEYS = ['guests', 'inCabins', 'saloon', 'crew', 'skipper'] as const;

/** A split only when at least two parts are > 0 and they add up exactly to the partner's number. */
const resolveSplit = (value: number, raw: CapacitySplitDto | null | undefined): Split | null => {
  if (!raw || typeof raw !== 'object') return null;

  const split: Split = {
    guests: positive(raw.guests),
    inCabins: positive(raw.inCabins),
    saloon: positive(raw.saloon),
    crew: positive(raw.crew),
    skipper: positive(raw.skipper),
  };
  const parts = SPLIT_KEYS.map(key => split[key]).filter((n): n is number => n !== null);
  const sum = parts.reduce((a, b) => a + b, 0);

  return parts.length >= 2 && sum === value ? split : null;
};

export interface FromYachtOptions {
  /** Page locale ('en', 'de', ...); English pages print notes as they are. */
  locale: string;
  /** Reviewed note translations (noteTableLookup). Omit on English-only surfaces. */
  noteLookup?: NoteLookup;
  /** Second-line sanitizer on (default true). */
  sanitize?: boolean;
  /** Operator matcher for the second-line sanitizer (server side only on b4y). */
  findOperatorName?: (text: string) => boolean;
}

const resolveNote = (raw: unknown, dim: Dim, opts: FromYachtOptions): ResolvedNote | null => {
  const en = opts.sanitize === false ? normalizeNote(raw) : safeCapacityNote(raw, opts.findOperatorName);

  if (!en) return null;

  const short = isShortNote(en);

  if (isLanguageNeutral(en) || isEnglish(opts.locale)) return { en, text: en, lang: null, short };

  const translated = opts.noteLookup?.(en, dim);

  if (typeof translated === 'string' && translated.trim()) return { en, text: translated.trim(), lang: null, short };

  return { en, text: en, lang: 'en', short };
};

const resolveDim = (raw: CapacityDimDto | null | undefined, dim: Dim, opts: FromYachtOptions): ResolvedDim | null => {
  if (!raw || typeof raw !== 'object') return null;

  const value = positive(raw.value);

  if (value === null) return null;

  return { value, note: resolveNote(raw.note, dim, opts), split: resolveSplit(value, raw.split) };
};

const flatDim = (v: unknown): ResolvedDim | null => {
  const value = positive(v);

  return value === null ? null : { value, note: null, split: null };
};

const charterTypes = (y: YachtLike): string[] => {
  const raw = y.charterType;

  if (typeof raw === 'string') return [raw.toUpperCase()];
  if (Array.isArray(raw)) return raw.filter((t): t is string => typeof t === 'string').map(t => t.toUpperCase());

  return [];
};

const resolveSail = (
  raw: SailDto | null | undefined,
  opts: FromYachtOptions
): { kind: SailKind | null; label: string | null } | null => {
  if (!raw || typeof raw !== 'object') return null;

  const kind = typeof raw.kind === 'string' && (SAIL_KINDS as readonly string[]).includes(raw.kind)
    ? (raw.kind as SailKind)
    : null;

  if (kind) return { kind, label: null };

  const label = opts.sanitize === false ? normalizeNote(raw.label) : safeCapacityNote(raw.label, opts.findOperatorName);

  return label ? { kind: null, label } : null;
};

/** The engine as a public page may show it: custom engineText > custom enginePower > count x power > MMK label. */
const resolveEngine = (y: YachtLike, opts: FromYachtOptions): ResolvedEngine | null => {
  const customText = y.custom ? normalizeNote(y.customDetails?.engineText) : null;

  if (customText) return { type: 'text', text: customText, lang: null };

  const customPower = y.custom ? positive(y.enginePower) : null;

  if (customPower !== null) return { type: 'power', count: 1, powerEach: customPower };

  const engine = y.rig?.engine;

  if (!engine || typeof engine !== 'object') return null;

  const powerEach = positive(engine.powerEach);

  if (powerEach !== null) return { type: 'power', count: positive(engine.count) ?? 1, powerEach };

  const label = opts.sanitize === false
    ? normalizeNote(engine.label)
    : safeCapacityNote(engine.label, opts.findOperatorName);

  return label ? { type: 'text', text: label, lang: isEnglish(opts.locale) ? null : 'en' } : null;
};

/**
 * The yacht's capacity and rig, resolved for one locale. Reads `capacity` / `rig`; without them (old payload, cached
 * admin cart) it falls back to the flat cabins / berths / wc / maxPersons / crewNumber - numbers only, no notes, no
 * splits, no sail (the flat mainSailType enum is a filter value, not a sail kind), engine only for custom yachts.
 */
export const fromYacht = (y: YachtLike | null | undefined, opts: FromYachtOptions): Capacity => {
  const yacht: YachtLike = y && typeof y === 'object' ? y : {};
  const c = yacht.capacity && typeof yacht.capacity === 'object' ? yacht.capacity : null;
  const types = charterTypes(yacht);
  const crewCount = positive(c ? c.crewNumber : yacht.crewNumber);
  const crewed = types.some(t => CREWED_CHARTER_TYPES.includes(t));
  const rig = yacht.rig && typeof yacht.rig === 'object' ? yacht.rig : null;

  return {
    locale: opts.locale,
    cabins: c ? resolveDim(c.cabins, 'cabins', opts) : flatDim(yacht.cabins),
    berths: c ? resolveDim(c.berths, 'berths', opts) : flatDim(yacht.berths),
    heads: c ? resolveDim(c.heads, 'heads', opts) : flatDim(yacht.wc),
    crewCabins: c ? positive(c.crewCabins) : null,
    crewHeads: c ? positive(c.crewHeads) : null,
    showers: c ? positive(c.showers) : null,
    crewShowers: c ? positive(c.crewShowers) : null,
    maxPersons: positive(c ? c.maxPersons : yacht.maxPersons),
    recommendedPersons: c ? positive(c.recommendedPersons) : null,
    crew: crewCount !== null && crewed ? { count: crewCount, alsoBareboat: types.includes('BAREBOAT') } : null,
    mainsail: resolveSail(rig?.mainsail, opts),
    headsail: resolveSail(rig?.headsail, opts),
    engine: resolveEngine(yacht, opts),
    draught: positive(rig?.draught),
  };
};

// ---------------------------------------------------------------------------------------------------------------
// Renderers (data fragments only)
// ---------------------------------------------------------------------------------------------------------------

const formatNumber = (n: number, locale: string): string => {
  if (Number.isInteger(n)) return String(n);

  try {
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 2, useGrouping: false }).format(n);
  } catch {
    return String(n);
  }
};

/** The note as printed: unchanged; one pair of brackets added only when the English original starts with a letter
 *  or a digit ("8+2" -> "(8+2)", "Reccomended Guests Number : 6" -> "(…)"), never for "(…)", "+2", "/5", "- 4 …". */
const bracketed = (note: ResolvedNote): string => (/^[\p{L}\p{N}]/u.test(note.en) ? `(${note.text})` : note.text);

const splitParts = (split: Split, fmt: Fmt, full: boolean): string[] =>
  SPLIT_KEYS.flatMap(key => {
    const count = split[key];

    if (count === null) return [];
    if (key === 'guests') return [String(count)];
    if (key === 'inCabins') return [full ? fmt('part.inCabins', { count }) : String(count)];

    return [fmt(`part.${key}`, { count })];
  });

/** " (12 + 1 crew)" / "" */
const splitSuffix = (split: Split | null, fmt: Fmt, full: boolean): string =>
  split ? ` (${splitParts(split, fmt, full).join(' + ')})` : '';

/** Card / compact suffix: a short language-neutral note wins (verbatim partner), else the split, else nothing. */
const compactSuffix = (dim: ResolvedDim, fmt: Fmt): string => {
  if (dim.note?.short) return ` ${bracketed(dim.note)}`;

  return splitSuffix(dim.split, fmt, false);
};

/** Full-form value segments: number + note (translated or English), else number + split, else number. */
const fullDimSegments = (dim: ResolvedDim, fmt: Fmt): Segment[] => {
  if (dim.note) {
    const note: Segment = dim.note.lang ? { text: bracketed(dim.note), lang: dim.note.lang } : { text: bracketed(dim.note) };

    return [{ text: `${dim.value} ` }, note];
  }

  return [{ text: `${dim.value}${splitSuffix(dim.split, fmt, true)}` }];
};

const joinSegments = (segments: Segment[]): string => segments.map(s => s.text).join('');

const mergeSegments = (segments: Segment[]): Segment[] =>
  segments.reduce<Segment[]>((out, seg) => {
    const last = out[out.length - 1];

    if (last && last.lang === seg.lang) last.text += seg.text;
    else out.push({ ...seg });

    return out;
  }, []);

const engineSegments = (engine: ResolvedEngine, c: Capacity, fmt: Fmt): Segment[] => {
  if (engine.type === 'text') return [engine.lang ? { text: engine.text, lang: engine.lang } : { text: engine.text }];

  const power = formatNumber(engine.powerEach, c.locale);

  return [
    {
      text: engine.count > 1
        ? fmt('value.engineCountPower', { count: engine.count, power })
        : fmt('value.enginePower', { power }),
    },
  ];
};

const sailSegments = (sail: { kind: SailKind | null; label: string | null }, c: Capacity, fmt: Fmt): Segment[] => {
  if (sail.kind) return [{ text: fmt(`sail.${sail.kind}`) }];

  return sail.label ? [isEnglish(c.locale) ? { text: sail.label } : { text: sail.label, lang: 'en' }] : [];
};

/**
 * Full form: labelled rows for the boat-page spec grid, PDFs, the offer e-mail capacity line, my-bookings.
 * Order: cabins, crew cabins, berths, WC, crew WC, showers, crew showers, max. people (or recommended), crew,
 * mainsail, headsail, engine, draught. A site keeps its own Year / Length / Beam / Fuel / Water rows and filters
 * these by `key` if it shows fewer.
 */
export const capacityRows = (c: Capacity, fmt: Fmt): CapacityRow[] => {
  const rows: CapacityRow[] = [];
  const push = (key: RowKey, labelKey: string, segments: Segment[]): void => {
    const merged = mergeSegments(segments.filter(s => s.text));

    if (merged.length) rows.push({ key, label: fmt(labelKey), value: joinSegments(merged), segments: merged });
  };
  const num = (n: number | null): Segment[] => (n === null ? [] : [{ text: String(n) }]);

  if (c.cabins) push('cabins', 'label.cabins', fullDimSegments(c.cabins, fmt));
  push('crewCabins', 'label.crewCabins', num(c.crewCabins));
  if (c.berths) push('berths', 'label.berths', fullDimSegments(c.berths, fmt));
  if (c.heads) push('heads', 'label.heads', fullDimSegments(c.heads, fmt));
  push('crewHeads', 'label.crewHeads', num(c.crewHeads));
  push('showers', 'label.showers', num(c.showers));
  push('crewShowers', 'label.crewShowers', num(c.crewShowers));

  if (c.maxPersons !== null) {
    const rec = c.recommendedPersons !== null && c.recommendedPersons !== c.maxPersons
      ? ` (${fmt('value.recommended', { count: c.recommendedPersons })})`
      : '';

    push('maxPeople', 'label.maxPeople', [{ text: `${c.maxPersons}${rec}` }]);
  } else {
    push('recommendedPeople', 'label.recommendedPeople', num(c.recommendedPersons));
  }

  if (c.crew) push('crew', c.crew.alsoBareboat ? 'label.crewCrewedCharter' : 'label.crew', num(c.crew.count));
  if (c.mainsail) push('mainsail', 'label.mainsail', sailSegments(c.mainsail, c, fmt));
  if (c.headsail) push('headsail', 'label.headsail', sailSegments(c.headsail, c, fmt));
  if (c.engine) push('engine', 'label.engine', engineSegments(c.engine, c, fmt));
  if (c.draught !== null) {
    push('draught', 'label.draught', [{ text: fmt('value.draught', { value: formatNumber(c.draught, c.locale) }) }]);
  }

  return rows;
};

/**
 * Compact form: "6 cabins", "13 berths (12 + 1 crew)", "6 WC (5 + 1 crew)", "max. 14 people", "1 crew member".
 * For admin pills, WhatsApp, BookingHero / checkout, inquiry modal, ChatWidget, TripHub, /fleet. Never a word note
 * (only a short language-neutral note or the ICU split), so it never mixes languages.
 */
export const capacityChips = (c: Capacity, fmt: Fmt): CapacityChip[] => {
  const chips: CapacityChip[] = [];

  if (c.cabins) chips.push({ key: 'cabins', text: fmt('compact.cabins', { count: c.cabins.value }) + compactSuffix(c.cabins, fmt) });
  if (c.crewCabins !== null) chips.push({ key: 'crewCabins', text: fmt('compact.crewCabins', { count: c.crewCabins }) });
  if (c.berths) chips.push({ key: 'berths', text: fmt('compact.berths', { count: c.berths.value }) + compactSuffix(c.berths, fmt) });
  if (c.heads) chips.push({ key: 'heads', text: fmt('compact.heads', { count: c.heads.value }) + compactSuffix(c.heads, fmt) });
  if (c.crewHeads !== null) chips.push({ key: 'crewHeads', text: fmt('compact.crewHeads', { count: c.crewHeads }) });
  if (c.maxPersons !== null) chips.push({ key: 'maxPeople', text: fmt('compact.maxPeople', { count: c.maxPersons }) });
  if (c.crew) chips.push({ key: 'crew', text: fmt('compact.crew', { count: c.crew.count }) });

  return chips;
};

/**
 * Listing-card chips (label + value): Cabins · Berths · Max. people, each hidden when unknown. Value = the partner's
 * number + a short language-neutral note ("4 +2", "10 (8+2)") or the split ("13 (12 + 1 crew)", "8 (6 + 2 in the
 * saloon)"). No WC, no crew cabins on cards (the detail rows carry them). Never an estimate.
 */
export const cardChips = (c: Capacity, fmt: Fmt): CardChip[] => {
  const chips: CardChip[] = [];

  if (c.cabins) chips.push({ key: 'cabins', label: fmt('card.cabins'), value: `${c.cabins.value}${compactSuffix(c.cabins, fmt)}` });
  if (c.berths) chips.push({ key: 'berths', label: fmt('card.berths'), value: `${c.berths.value}${compactSuffix(c.berths, fmt)}` });
  if (c.maxPersons !== null) chips.push({ key: 'maxPeople', label: fmt('card.maxPeople'), value: String(c.maxPersons) });

  return chips;
};

/** Numbers for each site's OWN sentences (descriptions, FAQ, meta, JSON-LD, AI context). No text. */
export const capacityFacts = (c: Capacity): CapacityFacts => ({
  cabins: c.cabins?.value ?? null,
  crewCabins: c.crewCabins,
  berths: c.berths?.value ?? null,
  guestBerths: c.berths?.split ? c.berths.value - (c.berths.split.crew ?? 0) : null,
  heads: c.heads?.value ?? null,
  crewHeads: c.crewHeads,
  showers: c.showers,
  maxPersons: c.maxPersons,
  recommendedPersons: c.recommendedPersons,
  crewNumber: c.crew?.count ?? null,
});

// ---------------------------------------------------------------------------------------------------------------
// Note table + a minimal ICU formatter (admin, PDFs, tests: surfaces without next-intl)
// ---------------------------------------------------------------------------------------------------------------

export interface NoteTableEntry {
  dims: readonly string[];
  [locale: string]: unknown;
}

/**
 * NoteLookup over capacityNotes.json `notes` (or a per-locale slice { note: { dims, [locale]: text } }).
 * A translation is used only for a dimension the entry was reviewed for; anything else falls back to English.
 */
export const noteTableLookup = (table: Record<string, NoteTableEntry> | null | undefined, locale: string): NoteLookup =>
  (note, dim) => {
    const entry = table?.[note];

    if (!entry || !Array.isArray(entry.dims) || !entry.dims.includes(dim)) return undefined;

    const text = entry[locale];

    return typeof text === 'string' && text.trim() ? text : undefined;
  };

type IcuNode =
  | string
  | { arg: string }
  | { pound: true }
  | { plural: string; offset: number; options: Record<string, IcuNode[]> };

const parseIcu = (src: string): IcuNode[] => {
  let i = 0;

  const parseNodes = (inPlural: boolean): IcuNode[] => {
    const nodes: IcuNode[] = [];
    let text = '';
    const flush = (): void => {
      if (text) nodes.push(text);
      text = '';
    };

    while (i < src.length) {
      const ch = src[i];

      if (ch === "'" && src[i + 1] === "'") {
        text += "'";
        i += 2;
      } else if (ch === "'" && /[{}#]/.test(src[i + 1] ?? '')) {
        const end = src.indexOf("'", i + 1);

        if (end < 0) throw new Error(`ICU: unclosed quote in "${src}"`);
        text += src.slice(i + 1, end);
        i = end + 1;
      } else if (ch === '{') {
        flush();
        i += 1;
        nodes.push(parseArgument());
      } else if (ch === '}') {
        if (!inPlural) throw new Error(`ICU: unbalanced } in "${src}"`);
        break;
      } else if (ch === '#' && inPlural) {
        flush();
        nodes.push({ pound: true });
        i += 1;
      } else {
        text += ch;
        i += 1;
      }
    }
    flush();

    return nodes;
  };

  const readName = (): string => {
    const m = /^\s*([A-Za-z_][\w]*)\s*/.exec(src.slice(i));

    const name = m?.[1];

    if (!m || !name) throw new Error(`ICU: argument name expected at ${i} in "${src}"`);
    i += m[0].length;

    return name;
  };

  const parseArgument = (): IcuNode => {
    const name = readName();

    if (src[i] === '}') {
      i += 1;

      return { arg: name };
    }
    if (src[i] !== ',') throw new Error(`ICU: , or } expected at ${i} in "${src}"`);
    i += 1;

    const type = readName();

    if (type !== 'plural') throw new Error(`ICU: only plural is supported ("${type}" in "${src}")`);
    if (src[i] !== ',') throw new Error(`ICU: , expected after plural in "${src}"`);
    i += 1;

    const options: Record<string, IcuNode[]> = {};
    let offset = 0;

    for (;;) {
      const m = /^\s*(offset:\d+|=\d+|zero|one|two|few|many|other)\s*/.exec(src.slice(i));
      const selector = m?.[1];

      if (!m || !selector) break;
      i += m[0].length;
      if (selector.startsWith('offset:')) {
        offset = Number(selector.slice(7));
        continue;
      }
      if (src[i] !== '{') throw new Error(`ICU: { expected after ${selector} in "${src}"`);
      i += 1;
      options[selector] = parseNodes(true);
      if (src[i] !== '}') throw new Error(`ICU: } expected to close ${selector} in "${src}"`);
      i += 1;
    }
    while (src[i] === ' ') i += 1;
    if (src[i] !== '}') throw new Error(`ICU: } expected to close plural in "${src}"`);
    i += 1;
    if (!options.other) throw new Error(`ICU: plural without "other" in "${src}"`);

    return { plural: name, offset, options };
  };

  const nodes = parseNodes(false);

  if (i !== src.length) throw new Error(`ICU: trailing input in "${src}"`);

  return nodes;
};

/** Plural categories a message must cover for a locale (Intl.PluralRules, integers). */
export const pluralCategories = (locale: string): string[] => {
  const rules = new Intl.PluralRules(locale);
  const seen = new Set<string>();

  for (let n = 0; n <= 200; n += 1) seen.add(rules.select(n));

  return Array.from(seen);
};

/** Throws when `message` is not valid in the supported ICU subset (simple arguments + plural). */
export const validateIcu = (message: string): void => {
  parseIcu(message);
};

/** Plural arguments used in a message, each with its option keys (for the locale coverage test). */
export const icuPlurals = (message: string): Array<{ arg: string; options: string[] }> => {
  const out: Array<{ arg: string; options: string[] }> = [];
  const walk = (nodes: IcuNode[]): void => {
    for (const node of nodes) {
      if (typeof node === 'object' && 'plural' in node) {
        out.push({ arg: node.plural, options: Object.keys(node.options) });
        Object.values(node.options).forEach(walk);
      }
    }
  };

  walk(parseIcu(message));

  return out;
};

/** A Fmt over a plain messages object (the `capacity` namespace of messages/<locale>/capacity.json). */
export const createFmt = (messages: Record<string, unknown>, locale: string): Fmt => {
  const rules = new Intl.PluralRules(locale);
  const cache = new Map<string, IcuNode[]>();

  const render = (nodes: IcuNode[], values: Record<string, string | number>, pound: string | null): string =>
    nodes
      .map(node => {
        if (typeof node === 'string') return node;
        if ('pound' in node) return pound ?? '#';
        if ('arg' in node) return String(values[node.arg] ?? `{${node.arg}}`);

        const n = Number(values[node.plural]);
        const exact = node.options[`=${n}`];
        const branch = exact ?? node.options[rules.select(n - node.offset)] ?? node.options.other ?? [];

        return render(branch, values, String(n - node.offset));
      })
      .join('');

  return (key, values = {}) => {
    const message = key.split('.').reduce<unknown>(
      (node, part) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined),
      messages
    );

    if (typeof message !== 'string') return key;

    let nodes = cache.get(key);

    if (!nodes) {
      nodes = parseIcu(message);
      cache.set(key, nodes);
    }

    return render(nodes, values, null);
  };
};
