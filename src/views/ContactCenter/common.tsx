/* Contact Center (P2) shared bits. Everything a visitor, the AI or the tracker wrote is rendered as a React text node:
 * never dangerouslySetInnerHTML, markdown or linkify (ADMIN-12; .eslintrc react/no-danger). A page becomes a link only
 * through safeHref, on the conversation's own site (ADMIN-11). */
import { useTranslation } from 'react-i18next';

import { Box, Chip, Link, Tooltip } from '@mui/material';
import dayjs from 'dayjs';

import { bbColors } from '@/styles/bb';
import { safeHref, siteLabel } from '@/utils/contactCenter/safeLink';

// Keyed by string: a status this build does not know gets a grey chip.
const STATUS_COLOR: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  AI: 'info',
  HUMAN_REQUESTED: 'warning',
  HUMAN: 'success',
  CLOSED: 'default',
  LOCKED: 'error',
};

export const isSuspicious = (row: { flagged?: boolean; status?: string | null }) =>
  row.flagged === true || row.status === 'LOCKED';

export const formatAt = (at: string | null | undefined, pattern = 'DD.MM. HH:mm') =>
  at ? dayjs(at).format(pattern) : '—';

export const ChatStatusChip = ({ status }: { status: string }) => {
  const { t } = useTranslation('contactCenter');

  return (
    <Chip
      size="small"
      color={STATUS_COLOR[status] ?? 'default'}
      label={t(`status.${status}`, { defaultValue: status })}
    />
  );
};

export const SiteChip = ({ siteId }: { siteId: string }) => (
  <Chip
    size="small"
    variant="outlined"
    label={siteLabel(siteId)}
    sx={{ height: 20, fontSize: 11, color: bbColors.gray600, borderColor: bbColors.gray200 }}
  />
);

/** A country as text (ISO code and name); no flag emoji, they do not render without an emoji font. */
export const countryText = (code: string | null | undefined, name?: string | null) =>
  [code?.toUpperCase(), name].filter(Boolean).join(' · ') || '—';

/** A page of [siteId]: a link when safeHref allows it, otherwise plain text with the red "suspicious" tag. */
export const PageLink = ({
  siteId,
  path,
  label,
}: {
  siteId: string;
  path: string | null | undefined;
  label?: string;
}) => {
  const { t } = useTranslation('contactCenter');

  if (!path) return <span>—</span>;

  const href = safeHref(siteId, path);

  if (href) {
    return (
      <Link href={href} target="_blank" rel="noopener noreferrer nofollow" sx={{ wordBreak: 'break-all' }}>
        {label ?? path}
      </Link>
    );
  }

  return (
    <Box component="span" sx={{ wordBreak: 'break-all' }}>
      {path}{' '}
      <Tooltip title={t('suspiciousLinkHint')}>
        <Chip
          size="small"
          label={t('suspiciousLink')}
          sx={{ height: 18, fontSize: 10, bgcolor: bbColors.red100, color: bbColors.red600 }}
        />
      </Tooltip>
    </Box>
  );
};

/** One line of label and value in a card. */
export const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Box sx={{ display: 'flex', gap: 1, fontSize: 13, lineHeight: 1.6 }}>
    <Box component="span" sx={{ color: bbColors.gray500, minWidth: 110, flexShrink: 0 }}>
      {label}
    </Box>
    <Box component="span" sx={{ color: bbColors.navy900, minWidth: 0, wordBreak: 'break-word' }}>
      {children}
    </Box>
  </Box>
);

export const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Box sx={{ fontSize: 12, fontWeight: 800, color: bbColors.gray600, textTransform: 'uppercase', mt: 2, mb: 0.75 }}>
    {children}
  </Box>
);
