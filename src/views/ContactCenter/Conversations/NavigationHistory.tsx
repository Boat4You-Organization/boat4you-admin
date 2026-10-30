/* "Kretanje": where the visitor went on all our sites (P1b page views), oldest first, folded to one line; an old IRIS
 * conversation without a visitor shows its widget page trail instead (BACKEND-30). Paths are links only through
 * safeHref (ADMIN-11). */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, useMediaQuery, useTheme } from '@mui/material';
import dayjs from 'dayjs';

import { ConversationDetail } from '@/types/contactCenter.type';
import { PageLink, SiteChip } from '@/views/ContactCenter/common';
import { SectionLabel, cc, scrollSx } from '@/views/ContactCenter/ui';

const trailOf = (raw: string | null): string[] => {
  try {
    const parsed = JSON.parse(raw ?? '[]');

    return Array.isArray(parsed) ? parsed.filter(p => typeof p === 'string').slice(-10) : [];
  } catch {
    return [];
  }
};

const NavigationHistory = ({ detail }: { detail: ConversationDetail }) => {
  const { t } = useTranslation('contactCenter');
  const wide = useMediaQuery(useTheme().breakpoints.up('md'), { noSsr: true });
  const [open, setOpen] = useState(wide);
  const { row, history } = detail;
  const trail = history.length ? [] : trailOf(detail.pageTrail);
  const count = history.length || trail.length;
  const current = history.length ? history[history.length - 1] : null;
  const currentTitle = current && current.path === row.currentPage ? current.title : null;

  return (
    <Box sx={{ border: `1px solid ${cc.border}`, borderRadius: '10px', bgcolor: cc.softer }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          minHeight: 40,
          pl: '12px',
          fontSize: 12.5,
          color: cc.text,
        }}
      >
        <SectionLabel sx={{ flex: 'none' }}>{t('trailTitle')}</SectionLabel>
        <Box
          component="span"
          sx={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {`${t('viewing')}: `}
          <Box component="strong" sx={{ fontWeight: 600, color: cc.ink }}>
            {row.currentPage ? (
              <PageLink siteId={row.siteId} path={row.currentPage} label={currentTitle ?? undefined} />
            ) : (
              '—'
            )}
          </Box>
          {` · ${t('cameFrom')}: ${detail.referrer || t('direct')}`}
        </Box>
        <Box
          component="button"
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
          sx={{
            flex: 'none',
            minHeight: 40,
            px: '12px',
            border: 0,
            bgcolor: 'transparent',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 12.5,
            color: cc.muted,
          }}
        >
          {t('pagesShort', { count })} {open ? '▴' : '▾'}
        </Box>
      </Box>
      {open && (
        <Box sx={{ ...scrollSx, maxHeight: 180, borderTop: `1px solid ${cc.hair}`, p: '4px 12px 8px', fontSize: 12.5 }}>
          {history.map((p, i) => (
            <Box
              // eslint-disable-next-line react/no-array-index-key
              key={`${p.at}-${i}`}
              sx={{
                display: 'grid',
                gridTemplateColumns: '74px auto minmax(0, 1fr)',
                alignItems: 'center',
                gap: 1,
                minHeight: 30,
              }}
            >
              <Box component="span" sx={{ color: cc.muted, fontVariantNumeric: 'tabular-nums' }}>
                {dayjs(p.at).format('DD.MM. HH:mm')}
              </Box>
              <SiteChip siteId={p.siteId} small />
              <Box
                component="span"
                sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}
              >
                {p.title && (
                  <Box component="span" sx={{ color: cc.ink, fontSize: 12.5 }}>
                    {`${p.title} · `}
                  </Box>
                )}
                <PageLink siteId={p.siteId} path={p.path} />
              </Box>
            </Box>
          ))}
          {trail.length > 0 && (
            <Box sx={{ py: 1, color: cc.text2 }}>
              {t('trail')}:{' '}
              {trail.map((p, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <Box component="span" key={`${p}-${i}`}>
                  {i > 0 && ' → '}
                  <PageLink siteId={row.siteId} path={p} />
                </Box>
              ))}
            </Box>
          )}
          {!count && <Box sx={{ py: 1, color: cc.muted }}>{t('noHistory')}</Box>}
        </Box>
      )}
    </Box>
  );
};

export default NavigationHistory;
