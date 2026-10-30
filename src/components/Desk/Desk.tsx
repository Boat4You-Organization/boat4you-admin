/* eslint-disable react/no-array-index-key, no-nested-ternary */
import React from 'react';

import { Box, Button, Stack, SxProps, Theme, Typography } from '@mui/material';

import {
  bbCardSx,
  bbColors,
  bbFont,
  bbIllustrations,
  bbPageSubtitleSx,
  bbPageSx,
  bbPageTitleSx,
  bbPillStyle,
  bbTabCountSx,
  bbTabSx,
  bbTabsTrackSx,
  bbTdSx,
  bbTexture,
  bbThSx,
} from '@/styles/bb';

/**
 * Broker Desk v2.2 page building blocks: page wrapper, PageHead, Tabs,
 * FilterBar, table card with header/body cell styles, pager and the
 * table empty / loading / error rows. Visual only — every caller keeps
 * its own state, handlers and texts.
 */

export const DeskPage = ({ children, sx }: { children: React.ReactNode; sx?: SxProps<Theme> }) => (
  <Box sx={[bbPageSx, ...(Array.isArray(sx) ? sx : [sx])]}>
    <Box sx={{ maxWidth: 1600, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>{children}</Box>
  </Box>
);

/** Title 22/800 + subtitle 12.5 left, actions right (the primary, yellow one last). */
export const PageHead = ({
  title,
  subtitle,
  actions,
  sx,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  sx?: SxProps<Theme>;
}) => (
  <Stack
    direction={{ xs: 'column', sm: 'row' }}
    alignItems={{ xs: 'stretch', sm: 'flex-end' }}
    flexWrap="wrap"
    gap={1.5}
    sx={sx}
  >
    <Box sx={{ flex: 1, minWidth: 240 }}>
      <Typography component="h1" sx={bbPageTitleSx}>
        {title}
      </Typography>
      {subtitle && <Typography sx={bbPageSubtitleSx}>{subtitle}</Typography>}
    </Box>
    {actions && (
      <Stack
        direction="row"
        gap={1}
        flexWrap="wrap"
        sx={{ flexShrink: 0, '@media (max-width: 599px)': { '& > .MuiButton-root': { flex: 1, minHeight: 44 } } }}
      >
        {actions}
      </Stack>
    )}
  </Stack>
);

export interface DeskTabItem<V extends string> {
  value: V;
  label: React.ReactNode;
  count?: number;
}

/** The one tab style: navy fill on a grey track, optional count capsule. */
export const DeskTabs = <V extends string>({
  items,
  value,
  onChange,
  ariaLabel,
  sx,
}: {
  items: DeskTabItem<V>[];
  value: V;
  onChange: (v: V) => void;
  ariaLabel?: string;
  sx?: SxProps<Theme>;
}) => (
  <Box
    role="tablist"
    aria-label={ariaLabel}
    sx={[
      bbTabsTrackSx,
      { flexWrap: 'nowrap', overflowX: 'auto', alignSelf: 'flex-start', scrollbarWidth: 'none' },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    {items.map(item => {
      const active = item.value === value;

      return (
        <Box
          component="button"
          type="button"
          role="tab"
          aria-selected={active}
          key={item.value}
          onClick={() => onChange(item.value)}
          sx={bbTabSx(active)}
        >
          {item.label}
          {item.count != null && (
            <Box component="span" sx={bbTabCountSx(active)}>
              {item.count}
            </Box>
          )}
        </Box>
      );
    })}
  </Box>
);

/** White card holding the search (first and widest) and the filters. */
export const FilterBar = ({ children, sx }: { children: React.ReactNode; sx?: SxProps<Theme> }) => (
  <Stack
    direction="row"
    gap={1}
    flexWrap="wrap"
    alignItems="center"
    sx={[{ ...bbCardSx, p: '10px' }, ...(Array.isArray(sx) ? sx : [sx])]}
  >
    {children}
  </Stack>
);

/** Card around a data table; the table scrolls sideways inside it. */
export const TableCard = ({
  children,
  footer,
  minWidth,
  sx,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  minWidth?: number;
  sx?: SxProps<Theme>;
}) => (
  <Box sx={[{ ...bbCardSx, overflow: 'hidden' }, ...(Array.isArray(sx) ? sx : [sx])]}>
    <Box sx={{ overflowX: 'auto' }}>
      <Box component="table" sx={{ width: '100%', minWidth, borderCollapse: 'collapse' }}>
        {children}
      </Box>
    </Box>
    {footer}
  </Box>
);

/** Header cell; sortable when `onSort` is given (↑ ↓ on the active column, ↕ on hover). */
export const Th = ({
  children,
  align = 'left',
  active,
  direction,
  onSort,
  sx,
}: {
  children?: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  active?: boolean;
  direction?: 'asc' | 'desc';
  onSort?: () => void;
  sx?: SxProps<Theme>;
}) => (
  <Box
    component="th"
    onClick={onSort}
    aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : undefined}
    sx={[
      {
        ...bbThSx,
        textAlign: align,
        position: 'sticky',
        top: 0,
        zIndex: 1,
        cursor: onSort ? 'pointer' : 'default',
        userSelect: 'none',
        color: active ? bbColors.navy900 : bbThSx.color,
        '&:hover .desk-sort': { opacity: 1 },
        '&:hover': onSort ? { color: bbColors.navy900 } : undefined,
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    {children}
    {onSort && (
      <Box component="span" className="desk-sort" sx={{ ml: '4px', opacity: active ? 1 : 0 }} aria-hidden>
        {active ? (direction === 'asc' ? '↑' : '↓') : '↕'}
      </Box>
    )}
  </Box>
);

export const tdSx = { ...bbTdSx, whiteSpace: 'nowrap' as const, verticalAlign: 'middle' as const };

/** Row styles: hover gray.75, selected, and new/unread (amber + 3px yellow bar on the first cell). */
export const rowSx = ({ unread, selected }: { unread?: boolean; selected?: boolean } = {}) => ({
  cursor: 'pointer',
  backgroundColor: unread ? bbColors.unreadRow : selected ? bbColors.selectedRow : bbColors.white,
  '& > td:first-of-type': unread ? { boxShadow: `inset 3px 0 0 ${bbColors.yellow500}` } : undefined,
  '&:hover > td': { backgroundColor: unread ? '#fff4d6' : bbColors.gray75 },
});

/** Secondary line under a cell value. */
export const cellSubSx = { display: 'block', fontSize: 12, color: bbColors.gray500, lineHeight: 1.35 };

/** "NEW" tag next to a booking number. */
export const NewTag = ({ children }: { children: React.ReactNode }) => (
  <Box
    component="span"
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      height: 20,
      px: '7px',
      borderRadius: '4px',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.02em',
      textTransform: 'uppercase',
      backgroundColor: bbColors.yellow500,
      color: bbColors.yellowText,
    }}
  >
    {children}
  </Box>
);

/** Five skeleton rows while a table loads. */
export const SkeletonRows = ({ cols, rows = 5 }: { cols: number; rows?: number }) => (
  <>
    {Array.from({ length: rows }).map((_, r) => (
      <Box component="tr" key={r} aria-hidden>
        {Array.from({ length: cols }).map((__, c) => (
          <Box component="td" key={c} sx={{ ...tdSx, py: '13px' }}>
            <Box
              sx={{
                height: 10,
                borderRadius: '5px',
                backgroundColor: bbColors.gray100,
                width: `${45 + ((r * 7 + c * 13) % 45)}%`,
                minWidth: 28,
              }}
            />
          </Box>
        ))}
      </Box>
    ))}
  </>
);

export const EmptyState = ({
  title,
  hint,
  action,
  tone = 'empty',
  illustration,
  sx,
}: {
  title: React.ReactNode;
  hint?: React.ReactNode;
  action?: React.ReactNode;
  tone?: 'empty' | 'error';
  illustration?: keyof typeof bbIllustrations;
  sx?: SxProps<Theme>;
}) => (
  <Stack alignItems="center" gap={0.5} sx={[{ textAlign: 'center', py: 1 }, ...(Array.isArray(sx) ? sx : [sx])]}>
    {illustration && (
      <Box
        component="img"
        src={bbIllustrations[illustration]}
        alt=""
        loading="lazy"
        sx={{ height: 96, width: 'auto', mb: 1, userSelect: 'none' }}
      />
    )}
    <Typography sx={{ fontSize: 14, fontWeight: 700, color: tone === 'error' ? bbColors.red700 : bbColors.navy900 }}>
      {title}
    </Typography>
    {hint && <Typography sx={{ fontSize: 12.5, color: bbColors.gray500 }}>{hint}</Typography>}
    {action && <Box sx={{ mt: 1 }}>{action}</Box>}
  </Stack>
);

/** Empty or error state inside a table: optional illustration, title, hint and action. */
export const TableMessageRow = ({
  cols,
  title,
  hint,
  action,
  tone = 'empty',
  illustration,
}: {
  cols: number;
  title: React.ReactNode;
  hint?: React.ReactNode;
  action?: React.ReactNode;
  tone?: 'empty' | 'error';
  illustration?: keyof typeof bbIllustrations;
}) => (
  <Box component="tr">
    <Box
      component="td"
      colSpan={cols}
      sx={{
        p: '28px 20px',
        textAlign: 'center',
        backgroundColor: tone === 'error' ? '#fffbfa' : bbColors.white,
        fontFamily: bbFont.stack,
      }}
    >
      <EmptyState title={title} hint={hint} action={action} tone={tone} illustration={illustration} />
    </Box>
  </Box>
);

/** One pagination pattern: range on the left, Prev · Page X of Y · Next on the right. */
export const Pager = ({
  page,
  totalPages,
  onChange,
  range,
  prevLabel = '← Prev',
  nextLabel = 'Next →',
  pageLabel,
  sx,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  range?: React.ReactNode;
  prevLabel?: React.ReactNode;
  nextLabel?: React.ReactNode;
  pageLabel?: React.ReactNode;
  sx?: SxProps<Theme>;
}) => (
  <Stack
    direction="row"
    alignItems="center"
    justifyContent={range ? 'space-between' : 'flex-end'}
    gap={1.5}
    flexWrap="wrap"
    sx={[
      {
        p: '10px 14px',
        fontSize: 12.5,
        color: bbColors.gray600,
        borderTop: `1px solid ${bbColors.gray100}`,
        fontFamily: bbFont.stack,
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    {range && <Box component="span">{range}</Box>}
    <Stack direction="row" alignItems="center" gap={0.5}>
      <Button variant="outlined" size="small" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        {prevLabel}
      </Button>
      <Box component="span" sx={{ px: 1, whiteSpace: 'nowrap' }}>
        {pageLabel ?? (
          <>
            Page{' '}
            <Box component="strong" sx={{ color: bbColors.navy900 }}>
              {page}
            </Box>{' '}
            of {totalPages}
          </>
        )}
      </Box>
      <Button variant="outlined" size="small" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        {nextLabel}
      </Button>
    </Stack>
  </Stack>
);

/** Initials avatar used in list rows (navy gradient circle). */
export const InitialsAvatar = ({ text, size = 26 }: { text: string; size?: number }) => (
  <Box
    component="span"
    sx={{
      width: size,
      height: size,
      flexShrink: 0,
      borderRadius: '50%',
      background: `linear-gradient(135deg, ${bbColors.navy700}, ${bbColors.navy900})`,
      color: bbColors.white,
      fontSize: size >= 36 ? 13 : 10.5,
      fontWeight: 700,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    {text}
  </Box>
);

/** Section card (white, radius 14, soft shadow). */
export const DeskCard = ({
  children,
  sx,
  component,
}: {
  children: React.ReactNode;
  sx?: SxProps<Theme>;
  component?: React.ElementType;
}) => (
  <Box
    component={component ?? 'section'}
    sx={[{ ...bbCardSx, overflow: 'hidden' }, ...(Array.isArray(sx) ? sx : [sx])]}
  >
    {children}
  </Box>
);

/** Card header row: h2 15/700, optional hint and an action on the right. */
export const CardHead = ({
  title,
  hint,
  action,
  sx,
}: {
  title: React.ReactNode;
  hint?: React.ReactNode;
  action?: React.ReactNode;
  sx?: SxProps<Theme>;
}) => (
  <Stack
    direction="row"
    alignItems="center"
    flexWrap="wrap"
    gap={1}
    sx={[{ p: '12px 16px', borderBottom: `1px solid ${bbColors.gray100}` }, ...(Array.isArray(sx) ? sx : [sx])]}
  >
    <Typography component="h2" sx={{ fontSize: 15, fontWeight: 700, color: bbColors.navy900, m: 0 }}>
      {title}
    </Typography>
    {hint && <Typography sx={{ fontSize: 12, color: bbColors.gray500 }}>{hint}</Typography>}
    {action && <Box sx={{ ml: 'auto' }}>{action}</Box>}
  </Stack>
);

/** 403 / 404 card: textured strip, illustration, code pill, title and description. */
export const ErrorCard = ({
  code,
  tone,
  illustration,
  title,
  children,
}: {
  code: string;
  tone: 'danger' | 'info';
  illustration: keyof typeof bbIllustrations;
  title: React.ReactNode;
  children?: React.ReactNode;
}) => (
  <Box sx={{ ...bbPageSx, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
    <Box
      component="section"
      sx={{
        ...bbCardSx,
        overflow: 'hidden',
        width: '100%',
        maxWidth: 640,
        mt: { xs: 2, md: 6 },
        background: `linear-gradient(180deg, ${bbColors.white} 0%, ${bbColors.gray50} 100%)`,
      }}
    >
      <Box aria-hidden sx={{ height: 44, background: bbTexture.chart }} />
      <Stack
        alignItems="center"
        gap={1.5}
        sx={{ p: { xs: '28px 20px 32px', sm: '36px 40px 44px' }, textAlign: 'center' }}
      >
        <Box component="img" src={bbIllustrations[illustration]} alt="" sx={{ height: 140, width: 'auto' }} />
        <Box component="span" sx={bbPillStyle(tone)}>
          {code}
        </Box>
        <Typography component="h1" sx={{ ...bbPageTitleSx, fontSize: { xs: 22, sm: 26 } }}>
          {title}
        </Typography>
        {children}
      </Stack>
    </Box>
  </Box>
);
