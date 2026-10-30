/* Contact Center redesign (30.10.2026, "Contact Center redizajn.html"): the colours and the small building blocks every
 * view shares, so a palette tweak touches one file. Native inputs and selects styled like the boards; MUI only where it
 * brings behaviour (Button, Menu, Drawer, Dialog). */
import { ReactNode } from 'react';

import { Box, Button, ButtonProps, SxProps, Theme } from '@mui/material';

import { bbColors, bbIllustrations, bbShadow, bbTones } from '@/styles/bb';

// Broker Desk v2.2: the Contact Center keeps its own names but takes its values from the one admin token set.
export const cc = {
  ink: bbColors.navy900,
  text: bbColors.gray600,
  text2: bbColors.gray600,
  muted: bbColors.gray500,
  faint: bbColors.gray450,
  page: bbColors.gray50,
  border: bbColors.cardBorder,
  hair: bbColors.gray100,
  field: bbColors.fieldBorder,
  hover: bbColors.foam50,
  seg: bbColors.gray150,
  soft: bbColors.tableHead,
  softer: bbColors.gray75,
  skeleton: bbColors.gray100,
  rowHover: bbColors.gray75,
  link: bbColors.navy700,
  linkHover: '#123f8a',
  red: bbColors.red700,
  redBg: bbColors.red100,
  redDot: bbColors.red600,
  redInk: '#7a1f12',
  redLine: bbColors.red200,
  alertInk: bbColors.red700,
  green: bbColors.green600,
  greenBg: bbColors.green100,
  greenInk: bbColors.green700,
  greenKpi: bbColors.green700,
  unreadBg: bbColors.unreadRow,
  tagBg: bbColors.progress100,
  tagFg: bbColors.progress700,
  note: bbColors.gray100,
  searchBar: bbColors.navy700,
  shadow: bbShadow.raised,
} as const;

/** [background, text] of a conversation status chip; an unknown status is grey. */
const tone = (t: keyof typeof bbTones): [string, string] => [bbTones[t].bg, bbTones[t].fg];

// Status tones from the v2.2 table: chat closed = neutral, AI = info, wants a human = attention,
// with the team = success, locked = danger.
export const CHAT_STATUS_COLORS: Record<string, [string, string]> = {
  AI: tone('info'),
  HUMAN_REQUESTED: tone('attention'),
  HUMAN: tone('success'),
  CLOSED: tone('neutral'),
  LOCKED: tone('danger'),
};

export const CONTACT_STATUS_COLORS: Record<string, [string, string]> = {
  NEW: tone('neutral'),
  REPLIED: tone('info'),
  OFFER_SENT: tone('progress'),
  NEGOTIATING: tone('attention'),
  WON: tone('success'),
  LOST: tone('neutral'),
  SPAM: tone('danger'),
};

const GREY: [string, string] = tone('neutral');

export const chipSx = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  height: 22,
  px: '9px',
  borderRadius: '999px',
  fontSize: 11.5,
  fontWeight: 700,
  boxShadow: 'inset 0 0 0 1px rgba(11,26,43,.06)',
  whiteSpace: 'nowrap',
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
} as const;

export const Pill = ({
  colors,
  sx,
  title,
  dot,
  children,
}: {
  colors?: [string, string];
  sx?: SxProps<Theme>;
  title?: string;
  /** Status pills lead with a dot in the text colour (colour is never the only signal). */
  dot?: boolean;
  children: ReactNode;
}) => {
  const [bg, fg] = colors ?? GREY;

  return (
    <Box
      component="span"
      title={title}
      sx={[
        {
          ...chipSx,
          bgcolor: bg,
          color: fg,
          ...(dot && {
            '&::before': {
              content: '""',
              flex: 'none',
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: 'currentColor',
            },
          }),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
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
  <Pill colors={[cc.tagBg, cc.tagFg]} sx={{ fontWeight: 600 }}>
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

type Kind = 'primary' | 'fill' | 'out' | 'txt' | 'red' | 'danger';

const KIND_SX: Record<Kind, object> = {
  primary: {
    bgcolor: bbColors.yellow500,
    color: bbColors.yellowText,
    fontWeight: 800,
    boxShadow: bbShadow.yellowCta,
    '&:hover': { bgcolor: bbColors.yellowHover, boxShadow: bbShadow.yellowCta },
  },
  fill: { bgcolor: cc.ink, color: '#FFFFFF', '&:hover': { bgcolor: bbColors.navy800 } },
  out: { bgcolor: '#FFFFFF', color: cc.ink, borderColor: cc.field, '&:hover': { bgcolor: cc.hover } },
  txt: { bgcolor: 'transparent', color: cc.ink, '&:hover': { bgcolor: cc.hover } },
  red: { bgcolor: 'transparent', color: cc.red, '&:hover': { bgcolor: cc.redBg } },
  danger: { bgcolor: cc.redDot, color: '#FFFFFF', '&:hover': { bgcolor: cc.red } },
};

// The theme's own disabled look (light blue) is not the board's: a disabled button keeps its colours, only fainter.
const DISABLED_SX: Record<Kind, object> = {
  primary: { bgcolor: bbColors.yellow500, color: bbColors.yellowText, boxShadow: 'none' },
  fill: { bgcolor: cc.ink, color: '#FFFFFF' },
  out: { bgcolor: '#FFFFFF', color: cc.ink, borderColor: cc.field },
  txt: { bgcolor: 'transparent', color: cc.ink },
  red: { bgcolor: 'transparent', color: cc.red },
  danger: { bgcolor: cc.redDot, color: '#FFFFFF' },
};

/** A board button: yellow primary (send / save), navy fill, outline, text, red text or red fill. */
export const CcButton = ({ kind = 'out', sx, ...props }: Omit<ButtonProps, 'variant' | 'color'> & { kind?: Kind }) => (
  <Button
    disableElevation
    disableRipple
    {...props}
    sx={[
      {
        minHeight: 36,
        px: '14px',
        borderRadius: '10px',
        fontSize: 13,
        fontWeight: 700,
        boxShadow: 'none',
        transition: 'background-color .15s, border-color .15s',
        textTransform: 'none',
        whiteSpace: 'nowrap',
        border: '1px solid transparent',
        lineHeight: 1.2,
      },
      KIND_SX[kind],
      { '&.Mui-disabled': { opacity: 0.45, ...DISABLED_SX[kind] } },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  />
);

/** Native input, select and textarea in the board style (class `fld`). */
export const fieldSx = {
  width: '100%',
  height: 36,
  px: '10px',
  border: `1px solid ${cc.field}`,
  borderRadius: '10px',
  bgcolor: '#FFFFFF',
  fontSize: { xs: 16, md: 13 }, // under 16 px iOS Safari zooms the page on focus
  color: cc.ink,
  fontFamily: 'inherit',
  outline: 'none',
  '&:focus': { borderColor: bbColors.navy700, boxShadow: bbShadow.focusRing },
} as const;

export const textareaSx = {
  ...fieldSx,
  height: 'auto',
  py: '8px',
  fontSize: { xs: 16, md: 13 },
  lineHeight: 1.5,
  resize: 'vertical',
} as const;

export const Labeled = ({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) => (
  <Box component="label" sx={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
    <Box component="span" sx={{ fontSize: 12, fontWeight: 600, color: cc.text2 }}>
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
    sx={[{ m: 0, fontSize: 12.5, fontWeight: 600, color: bbColors.gray600 }, ...(Array.isArray(sx) ? sx : [sx])]}
  >
    {children}
  </Box>
);

export const panelSx = {
  bgcolor: '#FFFFFF',
  border: `1px solid ${cc.border}`,
  borderRadius: '14px',
  boxShadow: bbShadow.card,
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
    fontSize: 11.5,
    fontWeight: 700,
    color: bbColors.tableHeadText,
    p: '9px 12px',
    borderBottom: `1px solid ${cc.border}`,
    whiteSpace: 'nowrap',
  },
  '& td': { p: '9px 12px', borderBottom: `1px solid ${cc.hair}`, fontSize: 13, verticalAlign: 'top' },
  '& tbody tr.click:hover td': { bgcolor: cc.rowHover, cursor: 'pointer' },
  '& .num': { textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
  '& .tnum': { fontVariantNumeric: 'tabular-nums' },
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
      { display: 'flex', gap: '2px', p: '3px', bgcolor: cc.seg, borderRadius: '10px' },
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
            minHeight: 30,
            px: '12px',
            border: 0,
            borderRadius: '7px',
            fontSize: 12.5,
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
            boxShadow: on ? '0 1px 2px rgba(11,26,43,.15)' : 'none',
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

// Empty-state illustrations (v2.2): nothing picked = binoculars, gone = sailboat, empty list = chart and dividers.
const Illustration = ({ src, height }: { src: string; height: number }) => (
  <Box component="img" src={src} alt="" loading="lazy" sx={{ height, width: 'auto', userSelect: 'none' }} />
);

export const ChatIcon = () => <Illustration src={bbIllustrations.binoculars} height={112} />;

export const GoneIcon = () => <Illustration src={bbIllustrations.sailboat} height={104} />;

export const EmptyListIcon = () => <Illustration src={bbIllustrations.chartDividers} height={92} />;

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
        height: 36,
        px: '10px',
        border: `1px solid ${cc.field}`,
        borderRadius: '10px',
        bgcolor: '#FFFFFF',
        '&:focus-within': { borderColor: bbColors.navy700, boxShadow: bbShadow.focusRing },
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
        fontSize: { xs: 16, md: 13 },
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
      borderRadius: '10px',
      border: `1px solid ${bbColors.red200}`,
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
      gap: '10px',
      p: '24px 16px',
      textAlign: 'center',
      color: cc.muted,
      fontSize: 14,
      lineHeight: 1.5,
    }}
  >
    {children}
  </Box>
);
