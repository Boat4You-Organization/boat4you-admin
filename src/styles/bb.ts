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
  navy700: '#1a4fa8',
  navyDim: '#a8bccf',
  yellow500: '#ffd24a',
  yellowText: '#3b2900',
  gray50: '#eef1f4',
  gray75: '#fafbfc',
  gray100: '#eef2f6',
  gray200: '#e2e8f0',
  gray300: '#d7dde4',
  gray500: '#5b6b7d',
  gray600: '#7b8ca3',
  green600: '#128a51',
  green100: '#d1fae5',
  amber700: '#a65b00',
  amber100: '#fef7e0',
  red600: '#c2442d',
  red100: '#fde8e4',
  white: '#ffffff',
} as const;

export const bbFont = {
  stack: '-apple-system, BlinkMacSystemFont, \'Inter\', \'Segoe UI\', Helvetica, Arial, sans-serif',
} as const;

export const bbRadii = {
  card: 10,
  input: 6,
  pill: 999,
  squareTag: 4,
} as const;

export const bbShadow = {
  yellowCta: '0 4px 10px -4px rgba(255,210,74,0.5)',
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
  | 'ended';

interface PillSpec {
  bg: string;
  fg: string;
  bd: string;
  label: string;
}

const STATUS_MAP: Record<StatusVariant, PillSpec> = {
  new: { bg: '#fef7e0', fg: '#8a6d00', bd: '#f4e7a8', label: 'New' },
  replied: { bg: '#eef3f9', fg: '#1a4fa8', bd: '#dce4ee', label: 'Replied' },
  offer_sent: { bg: '#e8f0fb', fg: '#0f3d82', bd: '#cfddf4', label: 'Offer sent' },
  negotiating: { bg: '#fff1e0', fg: '#a85a00', bd: '#ffdab3', label: 'Negotiating' },
  won: { bg: '#d1fae5', fg: '#047857', bd: '#a8e7c4', label: 'Won' },
  lost: { bg: '#f1f3f5', fg: '#6b7684', bd: '#e1e5ea', label: 'Lost' },
  confirmed: { bg: '#d1fae5', fg: '#047857', bd: '#a8e7c4', label: 'Confirmed' },
  deposit: { bg: '#fef7e0', fg: '#8a6d00', bd: '#f4e7a8', label: 'Deposit paid' },
  option: { bg: '#eef3f9', fg: '#1a4fa8', bd: '#dce4ee', label: 'Option' },
  cancelled: { bg: '#fde8e4', fg: '#b03221', bd: '#f5c3bb', label: 'Cancelled' },
  draft: { bg: '#f1f3f5', fg: '#6b7684', bd: '#e1e5ea', label: 'Draft' },
  viewed: { bg: '#e8f0fb', fg: '#0f3d82', bd: '#cfddf4', label: 'Viewed' },
  converted: { bg: '#d1fae5', fg: '#047857', bd: '#a8e7c4', label: 'Converted' },
  paid: { bg: '#d1fae5', fg: '#047857', bd: '#a8e7c4', label: 'Paid' },
  pending: { bg: '#fef7e0', fg: '#8a6d00', bd: '#f4e7a8', label: 'Pending' },
  overdue: { bg: '#fde8e4', fg: '#b03221', bd: '#f5c3bb', label: 'Overdue' },
  live: { bg: '#d1fae5', fg: '#047857', bd: '#a8e7c4', label: 'Live' },
  active: { bg: '#d1fae5', fg: '#047857', bd: '#a8e7c4', label: 'Active' },
  in_charter: { bg: '#e8f0fb', fg: '#0f3d82', bd: '#cfddf4', label: 'In charter' },
  ended: { bg: '#f1f3f5', fg: '#6b7684', bd: '#e1e5ea', label: 'Ended' },
};

export const bbStatusPill = (variant: StatusVariant | string) => {
  const c = STATUS_MAP[variant as StatusVariant] ?? {
    bg: '#f1f3f5',
    fg: '#6b7684',
    bd: '#e1e5ea',
    label: String(variant),
  };

  
return {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      padding: '3px 9px',
      borderRadius: bbRadii.pill,
      background: c.bg,
      color: c.fg,
      border: `1px solid ${c.bd}`,
      letterSpacing: '0.02em',
      display: 'inline-block',
      whiteSpace: 'nowrap' as const,
    },
    label: c.label,
  };
};

export const bbTagStyles = {
  base: {
    fontSize: 10,
    fontWeight: 800,
    padding: '2px 6px',
    borderRadius: bbRadii.squareTag,
    letterSpacing: '0.06em',
    display: 'inline-block',
  },
  hot: { background: bbColors.yellow500, color: bbColors.yellowText },
  returning: { background: bbColors.green100, color: '#047857' },
  vip: { background: bbColors.navy900, color: bbColors.yellow500 },
  loyal: { background: '#eef3f9', color: bbColors.navy700 },
  lead: { background: '#fff1e0', color: '#a85a00' },
  exclusive: { background: bbColors.amber100, color: '#8a6d00' },
} as const;
