/* Boat cards the AI showed in a reply (`payload.yachts`); text only, the link only through safeHref (ADMIN-11, ADMIN-12). */
import { Box } from '@mui/material';
import dayjs from 'dayjs';

import { bbColors } from '@/styles/bb';
import { PageLink } from '@/views/ContactCenter/common';

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
  const cards = cardsOf(payload);

  if (!cards.length) return null;

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 1, mt: 1 }}>
      {cards.map((c, i) => {
        const slug = text(c.slug);
        const start = text(c.startDate);
        const end = text(c.endDate);
        const path =
          text(c.url) ||
          (slug ? `/boat/${encodeURIComponent(slug)}?startDate=${start}&endDate=${end}&currency=EUR` : '');

        return (
          <Box
            // eslint-disable-next-line react/no-array-index-key
            key={`${slug}-${i}`}
            sx={{ border: `1px solid ${bbColors.gray200}`, borderRadius: 1.5, p: 1, bgcolor: '#fff', fontSize: 12 }}
          >
            <Box sx={{ fontWeight: 700, color: bbColors.navy900 }}>{text(c.name) || slug || '—'}</Box>
            <Box sx={{ color: bbColors.gray600 }}>
              {text(c.location)}
              {start && ` · ${dayjs(start).format('DD.MM.')}–${end ? dayjs(end).format('DD.MM.YYYY') : ''}`}
            </Box>
            {text(c.totalPriceEur) && <Box sx={{ fontWeight: 700 }}>{`€ ${text(c.totalPriceEur)}`}</Box>}
            {path && <PageLink siteId={siteId} path={path} label="↗" />}
          </Box>
        );
      })}
    </Box>
  );
};

export default YachtCards;
