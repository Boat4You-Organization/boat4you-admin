/**
 * Boat4You Broker Desk design tokens.
 *
 * Lifted from the `backend-shared.jsx` / `bbStyles` prototype in
 * `design_handoff_boat4you_backend`. Treat this file as the single source
 * of truth for the redesigned admin — colours, typography, spacing, radii,
 * status-pill variants, tag chip styles. Modules import from here instead
 * of the general MUI `theme/colors` so a future palette tweak only touches
 * one file.
 */

export const bbColors = {
  navy900: '#0b1a2b',
  navy800: '#1b2d44',
  navy700: '#1a4fa8',
  navyDim: '#a8bccf',
  /** Inactive nav text and any text set on the chart texture. */
  navyMist: '#c3d2e0',
  yellow500: '#ffd24a',
  yellowHover: '#ffc928',
  yellowDisabled: '#f6e8bd',
  yellowText: '#3b2900',
  gray50: '#f4f6f8',
  gray75: '#fafbfc',
  /** foam.50 — hover and field backgrounds. */
  foam50: '#f3f6f9',
  gray100: '#eef2f6',
  /** Track of segmented controls and tabs. */
  gray150: '#e9edf2',
  gray200: '#e2e8f0',
  gray300: '#d7dde4',
  /** Input and outlined-button border (v2.2 visual layer). */
  fieldBorder: '#d7dfe8',
  cardBorder: '#e1e7ee',
  /** Decoration and icons only, 3.4:1 — never body text. */
  gray400: '#7b8ca3',
  gray450: '#9aa6b5',
  gray500: '#5b6b7d',
  /** Labels and secondary text that must read at 7:1. */
  gray600: '#46566a',
  tableHead: '#f6f8fb',
  tableHeadText: '#55657a',
  selectedRow: '#eef3fb',
  unreadRow: '#fffbeb',
  green600: '#128a51',
  green700: '#047857',
  green100: '#d1fae5',
  green200: '#a8e7c4',
  amber700: '#a65b00',
  amber800: '#8a5a00',
  amber100: '#fef3c7',
  amber200: '#f4e1a0',
  red600: '#c2442d',
  red700: '#b03221',
  red100: '#fde8e4',
  red200: '#f5c3bb',
  info100: '#e8f0fb',
  info200: '#cfddf4',
  attention700: '#9a3412',
  attention100: '#ffedd5',
  attention200: '#ffd3a8',
  progress700: '#3a3fa0',
  progress100: '#e9eafb',
  progress200: '#cdd0f5',
  lagoon500: '#12a39a',
  lagoonText: '#0b6e66',
  white: '#ffffff',
} as const;

export const bbFont = {
  stack: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
} as const;

export const bbRadii = {
  card: 14,
  input: 10,
  button: 10,
  modal: 16,
  pill: 999,
  squareTag: 4,
} as const;

export const bbShadow = {
  yellowCta: 'inset 0 -2px 0 rgba(59,41,0,.12), 0 8px 16px -10px rgba(204,150,0,.85)',
  card: '0 1px 2px rgba(11,26,43,.04), 0 16px 32px -26px rgba(11,26,43,.4)',
  raised: '0 8px 24px rgba(11,26,43,.14)',
  modal: '0 20px 50px rgba(11,26,43,.22)',
  sheet: '0 -8px 30px rgba(11,26,43,.18)',
  focusRing: '0 0 0 4px rgba(26,79,168,.14)',
} as const;

/**
 * Nautical-chart texture for dark surfaces only (header, mobile nav drawer,
 * profile banner, sign-in, 403/404). Never under tables, forms or modals.
 * The motif sits in the right third — keep text out of it.
 */
export const bbTexture = {
  chart: `${bbColors.navy900} url('/images/brand/chart-texture.webp') right center / cover no-repeat`,
} as const;

/** Empty-state and error illustrations (transparent WebP). */
export const bbIllustrations = {
  binoculars: '/images/illustrations/binoculars.webp',
  sailboat: '/images/illustrations/sailboat.webp',
  chartDividers: '/images/illustrations/chart-dividers.webp',
  bottle: '/images/illustrations/bottle.webp',
  lighthouse: '/images/illustrations/lighthouse.webp',
} as const;

/** Soft card surface — bg, hairline border, radius and shadow in one place. */
export const bbCardSx = {
  backgroundColor: bbColors.white,
  border: `1px solid ${bbColors.cardBorder}`,
  borderRadius: `${bbRadii.card}px`,
  boxShadow: bbShadow.card,
} as const;

/** Auth page H1 — replaces the old Raleway-italic blue hero. */
export const bbAuthTitleSx = {
  fontFamily: bbFont.stack,
  fontSize: { xs: 32, md: 40 },
  fontWeight: 800,
  letterSpacing: '-0.02em',
  lineHeight: 1.15,
  color: bbColors.navy900,
} as const;

export type StatusVariant =
  | 'new'
  | 'replied'
  | 'offer_sent'
  | 'negotiating'
  | 'won'
  | 'lost'
  | 'confirmed'
  | 'deposit'
  | 'option'
  | 'cancelled'
  | 'draft'
  | 'viewed'
  | 'converted'
  | 'paid'
  | 'pending'
  | 'overdue'
  | 'live'
  | 'active'
  | 'in_charter'
  | 'ended'
  | 'ready'
  | 'sent';

export type StatusTone = 'neutral' | 'info' | 'progress' | 'warning' | 'attention' | 'success' | 'danger';

/** One palette for every status in the admin: text colour on a tinted background, always with a label. */
export const bbTones: Record<StatusTone, { bg: string; fg: string; bd: string }> = {
  neutral: { bg: bbColors.gray100, fg: bbColors.gray600, bd: bbColors.gray300 },
  info: { bg: bbColors.info100, fg: bbColors.navy700, bd: bbColors.info200 },
  progress: { bg: bbColors.progress100, fg: bbColors.progress700, bd: bbColors.progress200 },
  warning: { bg: bbColors.amber100, fg: bbColors.amber800, bd: bbColors.amber200 },
  attention: { bg: bbColors.attention100, fg: bbColors.attention700, bd: bbColors.attention200 },
  success: { bg: bbColors.green100, fg: bbColors.green700, bd: bbColors.green200 },
  danger: { bg: bbColors.red100, fg: bbColors.red700, bd: bbColors.red200 },
};

const STATUS_MAP: Record<StatusVariant, { tone: StatusTone; label: string }> = {
  new: { tone: 'neutral', label: 'New' },
  replied: { tone: 'info', label: 'Replied' },
  offer_sent: { tone: 'progress', label: 'Offer sent' },
  negotiating: { tone: 'attention', label: 'Negotiating' },
  won: { tone: 'success', label: 'Won' },
  lost: { tone: 'neutral', label: 'Lost' },
  confirmed: { tone: 'success', label: 'Confirmed' },
  deposit: { tone: 'warning', label: 'Deposit paid' },
  option: { tone: 'info', label: 'Option' },
  cancelled: { tone: 'danger', label: 'Cancelled' },
  draft: { tone: 'neutral', label: 'Draft' },
  ready: { tone: 'warning', label: 'Ready' },
  sent: { tone: 'success', label: 'Sent' },
  viewed: { tone: 'info', label: 'Viewed' },
  converted: { tone: 'success', label: 'Converted' },
  paid: { tone: 'success', label: 'Paid' },
  pending: { tone: 'warning', label: 'Pending' },
  overdue: { tone: 'danger', label: 'Overdue' },
  live: { tone: 'success', label: 'Live' },
  active: { tone: 'success', label: 'Active' },
  in_charter: { tone: 'progress', label: 'In charter' },
  ended: { tone: 'neutral', label: 'Ended' },
};

/**
 * Status pill style for a tone: 22px capsule, 11.5/700, tinted background and a
 * leading dot in the text colour (drawn as a background gradient so callers can
 * keep rendering a plain span).
 */
export const bbPillStyle = (tone: StatusTone) => {
  const c = bbTones[tone];

  return {
    display: 'inline-flex',
    alignItems: 'center',
    height: 22,
    padding: '0 9px 0 20px',
    borderRadius: bbRadii.pill,
    fontSize: 11.5,
    fontWeight: 700,
    lineHeight: 1,
    whiteSpace: 'nowrap' as const,
    background: `radial-gradient(circle at 11px 50%, ${c.fg} 3px, transparent 3.5px) no-repeat, ${c.bg}`,
    color: c.fg,
    boxShadow: 'inset 0 0 0 1px rgba(11,26,43,.06)',
    fontFamily: bbFont.stack,
  };
};

export const bbStatusPill = (variant: StatusVariant | string) => {
  const c = STATUS_MAP[variant as StatusVariant] ?? { tone: 'neutral' as StatusTone, label: String(variant) };

  return { style: bbPillStyle(c.tone), label: c.label };
};

/** Tag = a property or a source (square-ish, 4px, capitals). Never used for a status. */
export const bbTagStyles = {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    height: 20,
    padding: '0 7px',
    borderRadius: bbRadii.squareTag,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap' as const,
  },
  hot: { background: bbColors.yellow500, color: bbColors.yellowText },
  returning: { background: bbColors.gray100, color: bbColors.gray600 },
  vip: { background: bbColors.gray100, color: bbColors.gray600 },
  loyal: { background: bbColors.info100, color: bbColors.navy700 },
  lead: { background: bbColors.attention100, color: bbColors.attention700 },
  exclusive: { background: bbColors.amber100, color: bbColors.amber800 },
  mmk: { background: '#f3e8ff', color: '#6b21a8' },
  nausys: { background: '#e0f2fe', color: '#075985' },
} as const;

/** Page wrapper below the fixed 54px header: gray.50, 20px top gap, 24 / 12 side gutters. */
export const bbPageSx = {
  backgroundColor: bbColors.gray50,
  minHeight: '100vh',
  pt: '74px',
  pb: 4,
  px: { xs: '12px', sm: '24px' },
  fontFamily: bbFont.stack,
  color: bbColors.navy900,
} as const;

/** PageHead title 22/800 and subtitle 12.5. */
export const bbPageTitleSx = {
  fontFamily: bbFont.stack,
  fontSize: 22,
  fontWeight: 800,
  letterSpacing: '-0.015em',
  lineHeight: 1.25,
  color: bbColors.navy900,
  m: 0,
} as const;

export const bbPageSubtitleSx = {
  fontFamily: bbFont.stack,
  fontSize: 12.5,
  color: bbColors.gray500,
  mt: '2px',
} as const;

/** Section heading inside a card (h3 15/700). */
export const bbCardTitleSx = {
  fontFamily: bbFont.stack,
  fontSize: 15,
  fontWeight: 700,
  color: bbColors.navy900,
} as const;

/** Small label above a value or a group (v2.2: sentence case, 12.5/600). */
export const bbOverlineSx = {
  fontFamily: bbFont.stack,
  fontSize: 12.5,
  fontWeight: 600,
  color: bbColors.gray600,
} as const;

/** Data-table header cell and body cell (dense, 9px vertical). */
export const bbThSx = {
  backgroundColor: bbColors.tableHead,
  textAlign: 'left' as const,
  fontFamily: bbFont.stack,
  fontSize: 11.5,
  fontWeight: 700,
  color: bbColors.tableHeadText,
  padding: '9px 12px',
  borderBottom: `1px solid ${bbColors.gray200}`,
  whiteSpace: 'nowrap' as const,
} as const;

export const bbTdSx = {
  fontFamily: bbFont.stack,
  fontSize: 13,
  color: bbColors.navy900,
  padding: '9px 12px',
  borderBottom: `1px solid ${bbColors.gray100}`,
} as const;

/** Tabs: the single tab style — navy fill on a grey track, count in a capsule. */
export const bbTabsTrackSx = {
  display: 'inline-flex',
  flexWrap: 'wrap' as const,
  gap: '2px',
  padding: '3px',
  backgroundColor: bbColors.gray150,
  borderRadius: '10px',
  maxWidth: '100%',
} as const;

export const bbTabSx = (active: boolean) =>
  ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    height: 30,
    padding: '0 12px',
    border: 0,
    borderRadius: '7px',
    cursor: 'pointer',
    fontFamily: bbFont.stack,
    fontSize: 12.5,
    fontWeight: 600,
    whiteSpace: 'nowrap' as const,
    backgroundColor: active ? bbColors.navy900 : 'transparent',
    color: active ? bbColors.white : bbColors.gray600,
    '&:hover': active ? {} : { color: bbColors.navy900, backgroundColor: 'rgba(255,255,255,.6)' },
  }) as const;

export const bbTabCountSx = (active: boolean) =>
  ({
    minWidth: 18,
    height: 18,
    px: '5px',
    borderRadius: '999px',
    fontSize: 10.5,
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: active ? 'rgba(255,255,255,.18)' : 'rgba(11,26,43,.08)',
  }) as const;

/** Segmented control: white slider on the grey track (view modes, periods). */
export const bbSegmentSx = (active: boolean) =>
  ({
    ...bbTabSx(false),
    backgroundColor: active ? bbColors.white : 'transparent',
    color: active ? bbColors.navy900 : bbColors.gray600,
    boxShadow: active ? '0 1px 2px rgba(11,26,43,.15)' : 'none',
  }) as const;

/** Buttons for places that cannot use the themed MUI Button (raw elements, Links). */
export const bbButtonSx = {
  primary: {
    backgroundColor: bbColors.yellow500,
    color: bbColors.yellowText,
    fontWeight: 800,
    boxShadow: bbShadow.yellowCta,
    '&:hover': { backgroundColor: bbColors.yellowHover },
  },
  secondary: {
    backgroundColor: bbColors.navy900,
    color: bbColors.white,
    '&:hover': { backgroundColor: bbColors.navy800 },
  },
  tertiary: {
    backgroundColor: bbColors.white,
    color: bbColors.navy900,
    border: `1px solid ${bbColors.fieldBorder}`,
    '&:hover': { backgroundColor: bbColors.foam50 },
  },
} as const;
