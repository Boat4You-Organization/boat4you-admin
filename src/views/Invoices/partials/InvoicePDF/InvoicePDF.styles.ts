import { Font, StyleSheet } from '@react-pdf/renderer';

Font.register({
  family: 'Inter',
  fonts: [
    { src: '/fonts/Inter/Inter-Regular.ttf' },
    { src: '/fonts/Inter/Inter-Italic.ttf', fontStyle: 'italic' },
    { src: '/fonts/Inter/Inter-SemiBold.ttf', fontWeight: 600 },
  ],
});

Font.register({
  family: 'Raleway',
  fonts: [
    { src: '/fonts/Raleway/Raleway-Regular.ttf' },
    { src: '/fonts/Raleway/Raleway-SemiBold.ttf', fontWeight: 600 },
  ],
});

// No auto-hyphenation: 'klijen-ta' style breaks look sloppy on an invoice.
Font.registerHyphenationCallback(word => [word]);

// Brand tokens (mirrors the web / email palette).
export const NAVY = '#141857';
export const BLUE = '#2856ff';
export const BLUE_SOFT = '#eef3ff';
export const INK = '#0f172a';
export const MUTED = '#64708a';
export const LINE = '#dfe5f1';
export const PANEL = '#f4f6fb';

export const styles = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontSize: 9.5,
    color: INK,
    paddingTop: 0,
    paddingBottom: 110,
    paddingHorizontal: 0,
    backgroundColor: '#ffffff',
  },
  // ── header band ──────────────────────────────────────────────
  band: {
    backgroundColor: NAVY,
    paddingVertical: 22,
    paddingHorizontal: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bandCompany: { marginTop: 10 },
  bandCompanyName: { fontFamily: 'Raleway', fontWeight: 600, fontSize: 12, color: '#ffffff' },
  bandCompanyLine: { fontSize: 8.5, color: '#bcd0ff', marginTop: 2 },
  bandRight: { alignItems: 'flex-end' },
  invoiceTitle: { fontFamily: 'Raleway', fontWeight: 600, fontSize: 26, color: '#ffffff', letterSpacing: 3 },
  invoiceNumber: { fontFamily: 'Raleway', fontWeight: 600, fontSize: 13, color: '#8eb2ff', marginTop: 2 },
  accent: { height: 4, backgroundColor: BLUE },

  body: { paddingHorizontal: 40, paddingTop: 22 },

  // ── meta strip (date / place / delivery / payment) ───────────
  metaRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  metaCell: { flex: 1, backgroundColor: PANEL, borderRadius: 6, paddingVertical: 8, paddingHorizontal: 10 },
  metaLabel: { fontSize: 7, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8 },
  metaValue: { fontSize: 10, fontWeight: 600, color: NAVY, marginTop: 3 },

  // ── parties ──────────────────────────────────────────────────
  parties: { flexDirection: 'row', gap: 14, marginBottom: 22 },
  party: { flex: 1, borderWidth: 1, borderColor: LINE, borderRadius: 8, padding: 12 },
  partyLabel: { fontSize: 7.5, fontWeight: 600, color: BLUE, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  partyName: { fontFamily: 'Raleway', fontWeight: 600, fontSize: 11.5, color: NAVY, marginBottom: 3 },
  partyLine: { fontSize: 9, color: INK, lineHeight: 1.45 },
  partyMuted: { fontSize: 8.5, color: MUTED, marginTop: 3 },

  // ── items table ──────────────────────────────────────────────
  table: { marginBottom: 16 },
  thead: { flexDirection: 'row', backgroundColor: NAVY, borderRadius: 6, paddingVertical: 7, paddingHorizontal: 10 },
  th: { fontSize: 7.5, fontWeight: 600, color: '#ffffff', textTransform: 'uppercase', letterSpacing: 0.8 },
  tr: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: LINE },
  td: { fontSize: 9.5, color: INK, lineHeight: 1.45 },
  colNo: { width: 32 },
  colDesc: { flex: 1, paddingRight: 12 },
  colQty: { width: 40, textAlign: 'right' },
  colUnit: { width: 80, textAlign: 'right' },
  colAmount: { width: 86, textAlign: 'right' },

  // ── summary ──────────────────────────────────────────────────
  summaryWrap: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 22 },
  summary: { width: 250 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, paddingHorizontal: 10 },
  sumLabel: { fontSize: 9.5, color: MUTED },
  sumValue: { fontSize: 9.5, color: INK, fontWeight: 600 },
  sumNote: { fontSize: 8, color: MUTED, paddingHorizontal: 10, paddingTop: 2, fontStyle: 'italic' },
  // Reverse-charge legal citation under the summary — full page width,
  // pulled up into the summary's bottom margin.
  vatExemptClause: { fontSize: 8.5, color: INK, fontStyle: 'italic', marginTop: -12, marginBottom: 18 },
  sumTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: BLUE_SOFT,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginTop: 6,
  },
  sumTotalLabel: { fontSize: 8.5, fontWeight: 600, color: NAVY, letterSpacing: 0.8 },
  sumTotalValue: { fontFamily: 'Raleway', fontWeight: 600, fontSize: 15, color: BLUE },

  // ── payment box ──────────────────────────────────────────────
  payBox: { borderWidth: 1, borderColor: LINE, borderRadius: 8, padding: 12, marginBottom: 14 },
  payTitle: { fontSize: 7.5, fontWeight: 600, color: BLUE, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  payGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  payCell: { width: '33.33%', marginBottom: 7, paddingRight: 8 },
  payLabel: { fontSize: 7, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.6 },
  payValue: { fontSize: 9.5, fontWeight: 600, color: NAVY, marginTop: 2 },

  signatureRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 },
  issuedBy: { fontSize: 8.5, color: MUTED },
  issuedByName: { fontSize: 9.5, fontWeight: 600, color: INK, marginTop: 2 },
  computerNote: { fontSize: 7.5, color: MUTED, fontStyle: 'italic', maxWidth: 300, textAlign: 'right' },

  // ── footer ───────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    left: 40,
    right: 40,
    bottom: 28,
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 8,
  },
  footerText: { fontSize: 6.8, color: MUTED, textAlign: 'center', lineHeight: 1.5 },
});
