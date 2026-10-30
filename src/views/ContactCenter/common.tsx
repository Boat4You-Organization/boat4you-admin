/* Contact Center (P2) shared bits. Everything a visitor, the AI or the tracker wrote is rendered as a React text node:
 * never dangerouslySetInnerHTML, markdown or linkify (ADMIN-12; .eslintrc react/no-danger). A page becomes a link only
 * through safeHref, on the conversation's own site (ADMIN-11). */
import { useTranslation } from 'react-i18next';

import { Box, Link } from '@mui/material';
import dayjs from 'dayjs';

import { safeHref, siteLabel } from '@/utils/contactCenter/safeLink';

import { CHAT_STATUS_COLORS, CONTACT_STATUS_COLORS, OutlinePill, Pill, cc } from './ui';

export const isSuspicious = (row: { flagged?: boolean; status?: string | null }) =>
  row.flagged === true || row.status === 'LOCKED';

export const formatAt = (at: string | null | undefined, pattern = 'DD.MM. HH:mm') =>
  at ? dayjs(at).format(pattern) : '—';

export const ChatStatusChip = ({ status }: { status: string }) => {
  const { t } = useTranslation('contactCenter');

  return (
    <Pill dot colors={CHAT_STATUS_COLORS[status]}>
      {t(`status.${status}`, { defaultValue: status })}
    </Pill>
  );
};

export const ContactStatusChip = ({ status }: { status: string }) => {
  const { t } = useTranslation('contactCenter');

  return (
    <Pill dot colors={CONTACT_STATUS_COLORS[status]}>
      {t(`contactStatus.${status}`, { defaultValue: status })}
    </Pill>
  );
};

export const SiteChip = ({ siteId, small }: { siteId: string; small?: boolean }) => (
  <OutlinePill sx={small ? { height: 20, fontSize: 11 } : undefined}>{siteLabel(siteId)}</OutlinePill>
);

/** A country as text (ISO code and name); no flag emoji, they do not render without an emoji font. */
export const countryText = (code: string | null | undefined, name?: string | null) =>
  [code?.toUpperCase(), name].filter(Boolean).join(' · ') || '—';

export const linkSx = {
  color: cc.link,
  textDecorationColor: 'currentColor',
  '&:hover': { color: cc.linkHover },
} as const;

/** A page of [siteId]: a link when safeHref allows it, otherwise plain text with the red "suspicious" tag. */
export const PageLink = ({
  siteId,
  path,
  label,
  ariaLabel,
}: {
  siteId: string;
  path: string | null | undefined;
  label?: string;
  ariaLabel?: string;
}) => {
  const { t } = useTranslation('contactCenter');

  if (!path) return <span>—</span>;

  const href = safeHref(siteId, path);

  if (href) {
    return (
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer nofollow"
        aria-label={ariaLabel}
        sx={{ ...linkSx, fontSize: 'inherit', wordBreak: 'break-all' }}
      >
        {label ?? path}
      </Link>
    );
  }

  return (
    <Box component="span" sx={{ wordBreak: 'break-all', color: cc.text2 }}>
      {/* The tag comes first so a one-line ellipsis never cuts it off. */}
      <Pill title={t('suspiciousLinkHint')} colors={[cc.redBg, cc.red]} sx={{ height: 18, fontSize: 10.5 }}>
        {t('suspiciousLink')}
      </Pill>{' '}
      {path}
    </Box>
  );
};
