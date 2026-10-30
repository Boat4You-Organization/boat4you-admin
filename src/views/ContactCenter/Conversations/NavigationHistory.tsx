/* Where the visitor went on all our sites (P1b page views), oldest first; an old IRIS conversation without a visitor
 * shows its widget page trail instead (BACKEND-30). Paths are links only through safeHref (ADMIN-11). */
import { useTranslation } from 'react-i18next';

import { Box } from '@mui/material';
import dayjs from 'dayjs';

import { bbColors } from '@/styles/bb';
import { ConversationDetail } from '@/types/contactCenter.type';
import { PageLink, SiteChip } from '@/views/ContactCenter/common';

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
  const { row } = detail;

  if (detail.history.length) {
    return (
      <Box sx={{ maxHeight: 180, overflowY: 'auto', fontSize: 12 }}>
        {detail.history.map((p, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <Box key={`${p.at}-${i}`} sx={{ display: 'flex', gap: 1, alignItems: 'center', py: 0.25 }}>
            <Box component="span" sx={{ color: bbColors.gray500, minWidth: 74 }}>
              {dayjs(p.at).format('DD.MM. HH:mm')}
            </Box>
            <SiteChip siteId={p.siteId} />
            <Box component="span" sx={{ minWidth: 0 }}>
              {p.title && <Box component="span" sx={{ fontWeight: 600 }}>{`${p.title} · `}</Box>}
              <PageLink siteId={p.siteId} path={p.path} />
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  const trail = trailOf(detail.pageTrail);

  return (
    <Box sx={{ fontSize: 12, color: bbColors.gray600 }}>
      {trail.length ? (
        <>
          {t('trail')}:{' '}
          {trail.map((p, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <Box component="span" key={`${p}-${i}`}>
              {i > 0 && ' → '}
              <PageLink siteId={row.siteId} path={p} />
            </Box>
          ))}
        </>
      ) : (
        t('noHistory')
      )}
    </Box>
  );
};

export default NavigationHistory;
