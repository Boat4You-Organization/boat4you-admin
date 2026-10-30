/* Boat cards the AI showed in a reply (`payload.yachts`); text only, the link only through safeHref (ADMIN-11, ADMIN-12). */
import { useTranslation } from 'react-i18next';

import { Box } from '@mui/material';
import dayjs from 'dayjs';

import { PageLink } from '@/views/ContactCenter/common';
import { cc } from '@/views/ContactCenter/ui';

interface Card {
  name?: unknown;
  slug?: unknown;
  location?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  totalPriceEur?: unknown;
  url?: unknown;
}

const text = (v: unknown) => (typeof v === 'string' || typeof v === 'number' ? String(v) : '');

/** The cards of a message payload; anything that is not the expected JSON shape gives none. */
export const cardsOf = (payload: string | null): Card[] => {
  if (!payload) return [];

  try {
    const parsed = JSON.parse(payload);
    const yachts = parsed && typeof parsed === 'object' ? (parsed as { yachts?: unknown }).yachts : null;

    return Array.isArray(yachts) ? (yachts.filter(y => y && typeof y === 'object') as Card[]).slice(0, 12) : [];
  } catch {
    return [];
  }
};

const YachtCards = ({ payload, siteId }: { payload: string | null; siteId: string }) => {
  const { t } = useTranslation('contactCenter');
  const cards = cardsOf(payload);

  if (!cards.length) return null;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fill, minmax(180px, 1fr))' },
        gap: 1,
        width: '100%',
        minWidth: { md: 380 },
      }}
    >
      {cards.map((c, i) => {
        const slug = text(c.slug);
        const start = text(c.startDate);
        const end = text(c.endDate);
        const path =
          text(c.url) ||
          (slug ? `/boat/${encodeURIComponent(slug)}?startDate=${start}&endDate=${end}&currency=EUR` : '');
        const where = [
          text(c.location),
          start && `${dayjs(start).format('DD.MM.')}–${end ? dayjs(end).format('DD.MM.') : ''}`,
        ].filter(Boolean);

        return (
          <Box
            // eslint-disable-next-line react/no-array-index-key
            key={`${slug}-${i}`}
            sx={{
              p: '10px 12px',
              border: `1px solid ${cc.border}`,
              borderRadius: '10px',
              bgcolor: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
            }}
          >
            <Box
              component="span"
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '6px',
                fontWeight: 600,
                fontSize: 13.5,
                color: cc.ink,
              }}
            >
              {text(c.name) || slug || '—'}
              {path && <PageLink siteId={siteId} path={path} label="↗" ariaLabel={t('openBoatPage')} />}
            </Box>
            {where.length > 0 && (
              <Box component="span" sx={{ fontSize: 12, color: cc.muted }}>
                {where.join(' · ')}
              </Box>
            )}
            {text(c.totalPriceEur) && (
              <Box component="span" sx={{ fontSize: 13, fontWeight: 600, color: cc.ink }}>
                {`€ ${text(c.totalPriceEur)}`}
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

export default YachtCards;
