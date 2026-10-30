/* Contact Center redesign (30.10.2026, "Contact Center redizajn.html"): the colours and the small building blocks every
 * view shares, so a palette tweak touches one file. Native inputs and selects styled like the boards; MUI only where it
 * brings behaviour (Button, Menu, Drawer, Dialog). */
import { ReactNode } from 'react';

import { Box, Button, ButtonProps, SxProps, Theme } from '@mui/material';

export const cc = {
  ink: '#0B1D3A',
  text: '#374151',
  text2: '#4B5563',
  muted: '#5F6B7A',
  faint: '#9AA4B2',
  page: '#F5F6F8',
  border: '#E2E6EB',
  hair: '#EEF0F3',
  field: '#CBD2DB',
  hover: '#EFF1F4',
  seg: '#E9ECF0',
  soft: '#F7F8FA',
  softer: '#FBFBFC',
  skeleton: '#EAEDF1',
  rowHover: '#F9FAFB',
  link: '#1D4ED8',
  linkHover: '#1E3A8A',
  red: '#B91C1C',
  redBg: '#FEE2E2',
  redDot: '#DC2626',
  redInk: '#7F1D1D',
  redLine: '#FCA5A5',
  alertInk: '#991B1B',
  green: '#16A34A',
  greenBg: '#DCFCE7',
  greenInk: '#166534',
  greenKpi: '#15803D',
  unreadBg: '#FFFBEB',
  tagBg: '#EEF2FF',
  tagFg: '#3730A3',
  note: '#EEF2F7',
  searchBar: '#3B6FD8',
  shadow: '0 6px 20px rgba(11,29,58,.25)',
} as const;

/** [background, text] of a conversation status chip; an unknown status is grey. */
export const CHAT_STATUS_COLORS: Record<string, [string, string]> = {
  AI: ['#DBEAFE', '#1E40AF'],
  HUMAN_REQUESTED: ['#FFEDD5', '#9A3412'],
  HUMAN: [cc.greenBg, cc.greenInk],
  CLOSED: [cc.hover, cc.text2],
  LOCKED: [cc.redBg, cc.red],
};

export const CONTACT_STATUS_COLORS: Record<string, [string, string]> = {
  NEW: [cc.hover, cc.text],
  REPLIED: ['#DBEAFE', '#1E40AF'],
  OFFER_SENT: ['#E0E7FF', cc.tagFg],
  NEGOTIATING: ['#FFEDD5', '#9A3412'],
  WON: [cc.greenBg, cc.greenInk],
  LOST: ['#F3F4F6', cc.text2],
  SPAM: [cc.redBg, cc.red],
};

const GREY: [string, string] = [cc.hover, cc.text2];

export const chipSx = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  height: 22,
  px: '8px',
  borderRadius: '999px',
  fontSize: 11.5,
  fontWeight: 600,
  whiteSpace: 'nowrap',
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
} as const;

export const Pill = ({
  colors,
  sx,
  title,
  children,
}: {
  colors?: [string, string];
  sx?: SxProps<Theme>;
  title?: string;
  children: ReactNode;
}) => {
  const [bg, fg] = colors ?? GREY;

  return (
    <Box
      component="span"
      title={title}
      sx={[{ ...chipSx, bgcolor: bg, color: fg }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      {children}
    </Box>
  );
};

export const OutlinePill = ({ children, sx }: { children: ReactNode; sx?: SxProps<Theme> }) => (
  <Box
    component="span"
    sx={[
      { ...chipSx, bgcolor: '#FFFFFF', border: `1px solid ${cc.field}`, color: cc.text2, fontWeight: 500 },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    {children}
  </Box>
);

export const TagPill = ({ children }: { children: ReactNode }) => (
  <Pill colors={[cc.tagBg, cc.tagFg]} sx={{ fontWeight: 500 }}>
    {children}
  </Pill>
);

export const Dot = ({ color, label, size = 8 }: { color: string; label?: string; size?: number }) => (
  <Box
    component="span"
    role={label ? 'img' : undefined}
    aria-label={label}
    title={label}
    sx={{ flex: 'none', width: size, height: size, borderRadius: '50%', bgcolor: color }}
  />
);

type Kind = 'fill' | 'out' | 'txt' | 'red' | 'danger';

const KIND_SX: Record<Kind, object> = {
  fill: { bgcolor: cc.ink, color: '#FFFFFF', '&:hover': { bgcolor: '#14294d' } },
  out: { bgcolor: '#FFFFFF', color: cc.ink, borderColor: cc.field, '&:hover': { bgcolor: cc.hover } },
  txt: { bgcolor: 'transparent', color: cc.ink, '&:hover': { bgcolor: cc.hover } },
  red: { bgcolor: 'transparent', color: cc.red, '&:hover': { bgcolor: cc.redBg } },
  danger: { bgcolor: cc.redDot, color: '#FFFFFF', '&:hover': { bgcolor: cc.red } },
};

/** A board button: navy fill, outline, text, red text or red fill. */
export const CcButton = ({ kind = 'out', sx, ...props }: Omit<ButtonProps, 'variant' | 'color'> & { kind?: Kind }) => (
  <Button
    disableElevation
    disableRipple
    {...props}
    sx={[
      {
        minHeight: 36,
        px: '14px',
        borderRadius: '8px',
        fontSize: 13,
        fontWeight: 600,
        textTransform: 'none',
        whiteSpace: 'nowrap',
        border: '1px solid transparent',
        lineHeight: 1.2,
        '&.Mui-disabled': { opacity: 0.45, color: kind === 'fill' || kind === 'danger' ? '#FFFFFF' : cc.ink },
      },
      KIND_SX[kind],
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  />
);

/** Native input, select and textarea in the board style (class `fld`). */
export const fieldSx = {
  width: '100%',
  height: 38,
  px: '10px',
  border: `1px solid ${cc.field}`,
  borderRadius: '8px',
  bgcolor: '#FFFFFF',
  fontSize: 13.5,
  color: cc.ink,
  fontFamily: 'inherit',
  outline: 'none',
  '&:focus-visible': { borderColor: cc.ink, boxShadow: `0 0 0 1px ${cc.ink}` },
} as const;

export const textareaSx = {
  ...fieldSx,
  height: 'auto',
  py: '8px',
  fontSize: 13,
  lineHeight: 1.5,
  resize: 'vertical',
} as const;

export const Labeled = ({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) => (
  <Box component="label" sx={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
    <Box component="span" sx={{ fontSize: 12, fontWeight: 500, color: cc.text2 }}>
      {label}
      {hint && (
        <Box component="span" sx={{ fontWeight: 400, color: cc.muted }}>
          {` · ${hint}`}
        </Box>
      )}
    </Box>
    {children}
  </Box>
);

/** Small uppercase section title (class `sec`). */
export const SectionLabel = ({ children, sx }: { children: ReactNode; sx?: SxProps<Theme> }) => (
  <Box
    component="h3"
    sx={[
      { m: 0, fontSize: 11, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: cc.muted },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    {children}
  </Box>
);

export const panelSx = {
  bgcolor: '#FFFFFF',
  border: `1px solid ${cc.border}`,
  borderRadius: '12px',
  overflow: 'hidden',
} as const;

export const scrollSx = {
  overflowY: 'auto',
  '&::-webkit-scrollbar': { width: 8 },
  '&::-webkit-scrollbar-thumb': { background: '#D5DAE1', borderRadius: 8 },
} as const;

/** Header and body cells of the board tables (Live, Contacts). */
export const tableSx = {
  width: '100%',
  borderCollapse: 'collapse',
  '& th': {
    position: 'sticky',
    top: 0,
    bgcolor: cc.soft,
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '.06em',
    textTransform: 'uppercase',
    color: cc.muted,
    p: '10px 14px',
    borderBottom: `1px solid ${cc.border}`,
    whiteSpace: 'nowrap',
  },
  '& td': { p: '12px 14px', borderBottom: `1px solid ${cc.hair}`, fontSize: 13, verticalAlign: 'top' },
  '& tbody tr.click:hover td': { bgcolor: cc.rowHover, cursor: 'pointer' },
  '& .num': { textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
  '& .soft': { color: cc.text },
  '& .muted': { color: cc.muted },
  '& .nowrap': { whiteSpace: 'nowrap' },
} as const;

/** A row of pill buttons with one pressed (the board's segmented control). */
export const Segmented = <T extends string>({
  value,
  options,
  onChange,
  label,
  sx,
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange(v: T): void;
  label: string;
  sx?: SxProps<Theme>;
}) => (
  <Box
    role="group"
    aria-label={label}
    sx={[
      { display: 'flex', gap: '2px', p: '3px', bgcolor: cc.hover, borderRadius: '9px' },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    {options.map(o => {
      const on = o.value === value;

      return (
        <Box
          key={o.value}
          component="button"
          type="button"
          aria-pressed={on}
          onClick={() => onChange(o.value)}
          sx={{
            flex: 1,
            minHeight: 34,
            px: '14px',
            border: 0,
            borderRadius: '7px',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'inherit',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
            bgcolor: on ? '#FFFFFF' : 'transparent',
            color: on ? cc.ink : cc.text2,
            boxShadow: on ? '0 1px 2px rgba(11,29,58,.15)' : 'none',
          }}
        >
          {o.label}
        </Box>
      );
    })}
  </Box>
);

const Svg = ({
  size = 16,
  children,
  stroke = 'currentColor',
  width = 2,
}: {
  size?: number;
  children: ReactNode;
  stroke?: string;
  width?: number;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth={width}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={{ flex: 'none' }}
  >
    {children}
  </svg>
);

export const SearchIcon = () => (
  <Svg stroke={cc.muted}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Svg>
);

export const FilterIcon = () => (
  <Svg size={13}>
    <path d="M3 5h18M6 12h12M10 19h4" />
  </Svg>
);

export const ChatIcon = () => (
  <Svg size={36} stroke={cc.faint} width={1.6}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Svg>
);

export const GoneIcon = () => (
  <Svg size={36} stroke={cc.faint} width={1.6}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 9l6 6M15 9l-6 6" />
  </Svg>
);

export const CloseIcon = () => (
  <Svg size={20}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);

export const MoreIcon = () => (
  <Svg size={18}>
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="19" r="1" />
  </Svg>
);

export const InfoIcon = () => (
  <Svg>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8h.01M11 12h1v5h1" />
  </Svg>
);

const RetryIcon = () => (
  <Svg>
    <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
    <path d="M21 3v5h-5" />
  </Svg>
);

/** The board's search field: a magnifier and a borderless input inside one bordered label. */
export const SearchField = ({
  value,
  onChange,
  placeholder,
  label,
  maxLength = 100,
  sx,
}: {
  value: string;
  onChange(v: string): void;
  placeholder: string;
  label: string;
  maxLength?: number;
  sx?: SxProps<Theme>;
}) => (
  <Box
    component="label"
    sx={[
      {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        height: 38,
        px: '10px',
        border: `1px solid ${cc.field}`,
        borderRadius: '8px',
        bgcolor: '#FFFFFF',
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    <SearchIcon />
    <Box
      component="input"
      type="search"
      aria-label={label}
      placeholder={placeholder}
      value={value}
      maxLength={maxLength}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      sx={{
        flex: 1,
        minWidth: 0,
        border: 0,
        outline: 'none',
        fontSize: 13.5,
        color: cc.ink,
        bgcolor: 'transparent',
        fontFamily: 'inherit',
      }}
    />
  </Box>
);

/** "Loading failed, retrying": the last good data stays visible below it. */
export const LoadAlert = ({ text }: { text: string }) => (
  <Box
    role="alert"
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      p: '10px 14px',
      borderRadius: '8px',
      bgcolor: cc.redBg,
      color: cc.alertInk,
      fontSize: 13,
      fontWeight: 500,
    }}
  >
    <RetryIcon />
    {text}
  </Box>
);

export const Sk = ({ h, w, r = 6, sx }: { h: number; w: number | string; r?: number; sx?: SxProps<Theme> }) => (
  <Box
    sx={[{ height: h, width: w, borderRadius: `${r}px`, bgcolor: cc.skeleton }, ...(Array.isArray(sx) ? sx : [sx])]}
  />
);

/** A centred grey message (empty and "pick something" states). */
export const Empty = ({ children }: { children: ReactNode }) => (
  <Box
    sx={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 1,
      p: '40px 16px',
      textAlign: 'center',
      color: cc.muted,
      fontSize: 13.5,
    }}
  >
    {children}
  </Box>
);
