/**
 * The admin's side of the shared capacity formatter (`yachtCapacity.ts`, capacity contract v1, 6.10.2026).
 *
 * The admin is English-only: the ICU messages are the EN `capacity` namespace (`yachtCapacityMessages.en.json`,
 * the same file as the web's messages/en/capacity.json) behind createFmt, and no note table is needed (English
 * notes print as the partner sent them).
 *
 * Which partner text may reach the client: only the `capacity.*.note` / `rig` labels of the PUBLIC yacht detail.
 * The backend sanitizer has already passed them, and the formatter runs the same rules again here. The admin-only
 * `brokerNotes` of a search row (the raw notes plus the partner's internal remark) are shown to the broker behind an
 * info icon and are NEVER copied into the offer e-mail or the WhatsApp text.
 */
import {
  CapacityChip,
  CapacityRow,
  Fmt,
  RowKey,
  YachtLike,
  capacityChips,
  capacityRows,
  createFmt,
  fromYacht,
  normalizeNote,
} from './yachtCapacity';
import messagesEn from './yachtCapacityMessages.en.json';

export const capacityFmtEn: Fmt = createFmt(messagesEn, 'en');

/** Full-form rows that describe the accommodation (offer e-mail line 2). */
export const CAPACITY_ROW_KEYS: readonly RowKey[] = [
  'cabins',
  'crewCabins',
  'berths',
  'heads',
  'crewHeads',
  'showers',
  'crewShowers',
  'maxPeople',
  'recommendedPeople',
  'crew',
];

/** Full-form rows that describe sails, engine and draught (offer e-mail line 3). */
export const RIG_ROW_KEYS: readonly RowKey[] = ['mainsail', 'headsail', 'engine', 'draught'];

/**
 * Compact form: "6 cabins", "2 crew cabins", "13 berths (12 + 1 crew)", "6 WC (5 + 1 crew)", "max. 14 people",
 * "1 crew member". Without the backend `capacity` block it falls back to the flat numbers.
 */
export const capacityChipsEn = (y: YachtLike | null | undefined): CapacityChip[] =>
  capacityChips(fromYacht(y, { locale: 'en' }), capacityFmtEn);

/** Full form ("Cabins" / "6 (5 double +1 …)"), optionally only the rows in `keys` (formatter order kept). */
export const capacityRowsEn = (y: YachtLike | null | undefined, keys?: readonly RowKey[]): CapacityRow[] => {
  const rows = capacityRows(fromYacht(y, { locale: 'en' }), capacityFmtEn);

  return keys ? rows.filter(row => keys.includes(row.key)) : rows;
};

/** Admin-only extra on search rows: the raw stored partner notes and the internal remark (contract 2.3). */
export interface BrokerNotes {
  cabinsNote?: string | null;
  berthsNote?: string | null;
  headsNote?: string | null;
  remark?: string | null;
}

/** The broker notes as labelled lines for the admin info icon; [] when the partner wrote none. */
export const brokerNoteLines = (notes: BrokerNotes | null | undefined): Array<{ label: string; text: string }> => {
  if (!notes) return [];

  const lines: Array<[string, unknown]> = [
    ['Cabins note', notes.cabinsNote],
    ['Berths note', notes.berthsNote],
    ['WC note', notes.headsNote],
    ['Internal remark', notes.remark],
  ];

  return lines.flatMap(([label, raw]) => {
    const text = normalizeNote(raw);

    return text ? [{ label, text }] : [];
  });
};
