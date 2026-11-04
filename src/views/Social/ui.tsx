/* Objave: shared bits — platform badge, status pill, issue text, date formatting. Everything from the backend or the
 * networks (names, texts, errors) renders as React text nodes. */
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import FacebookIcon from '@mui/icons-material/Facebook';
import GoogleIcon from '@mui/icons-material/Google';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import PinterestIcon from '@mui/icons-material/Pinterest';
import XIcon from '@mui/icons-material/X';
import YouTubeIcon from '@mui/icons-material/YouTube';
import { Box, SxProps, Theme, Tooltip } from '@mui/material';

import { StatusTone, bbColors, bbPillStyle } from '@/styles/bb';
import { SocialAccount, SocialPlatform, SocialPostStatus, SocialTargetStatus } from '@/types/social.type';
import { Issue, PLATFORM_RULES } from '@/utils/social/rules';

/** The connected channels, loaded once by the Social page and shared by its tabs. */
export interface AccountsState {
  list: SocialAccount[];
  loading: boolean;
  error: string | null;
  reload(): void;
}

const ICONS: Partial<Record<SocialPlatform, typeof FacebookIcon>> = {
  FACEBOOK: FacebookIcon,
  INSTAGRAM: InstagramIcon,
  LINKEDIN: LinkedInIcon,
  X: XIcon,
  YOUTUBE: YouTubeIcon,
  PINTEREST: PinterestIcon,
  GOOGLE_BUSINESS: GoogleIcon,
};

/** Networks without an MUI icon get a plain glyph (no emoji: some admin machines have no emoji font, DEPLOY_NOTES 14.10.). */
const GLYPHS: Partial<Record<SocialPlatform, string>> = { THREADS: '@', TIKTOK: '♪', BLUESKY: 'B' };

/** Round badge in the network's colour. */
export const PlatformBadge = ({
  platform,
  size = 22,
  dim,
  title,
}: {
  platform: SocialPlatform;
  size?: number;
  dim?: boolean;
  title?: string;
}) => {
  const r = PLATFORM_RULES[platform];
  const Icon = ICONS[platform];

  return (
    <Tooltip title={title ?? r.label} arrow>
      <Box
        component="span"
        role="img"
        aria-label={title ?? r.label}
        sx={{
          width: size,
          height: size,
          flexShrink: 0,
          borderRadius: '50%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: r.color,
          color: '#fff',
          opacity: dim ? 0.35 : 1,
          fontSize: size * 0.55,
          fontWeight: 800,
          lineHeight: 1,
        }}
      >
        {Icon ? <Icon sx={{ fontSize: size * 0.62 }} /> : GLYPHS[platform]}
      </Box>
    </Tooltip>
  );
};

export const POST_TONES: Record<SocialPostStatus | SocialTargetStatus, StatusTone> = {
  DRAFT: 'neutral',
  PENDING: 'neutral',
  SCHEDULED: 'info',
  PUBLISHING: 'progress',
  PUBLISHED: 'success',
  PARTIAL: 'warning',
  FAILED: 'danger',
  CANCELLED: 'neutral',
};

export const StatusPill = ({ status }: { status: SocialPostStatus | SocialTargetStatus }) => {
  const { t } = useTranslation('social');

  return (
    <Box component="span" sx={bbPillStyle(POST_TONES[status])}>
      {t(`status.${status}`)}
    </Box>
  );
};

/** One line per problem; errors red, warnings amber. */
export const IssueList = ({ issues, sx }: { issues: Issue<string>[]; sx?: SxProps<Theme> }) => {
  const { t } = useTranslation('social');

  if (!issues.length) return null;

  return (
    <Box
      component="ul"
      sx={[{ m: 0, pl: '18px', fontSize: 12.5, listStyle: 'disc' }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      {issues.map(i => (
        <Box component="li" key={i.code} sx={{ color: i.level === 'error' ? bbColors.red700 : bbColors.amber800 }}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {t(`issue.${i.code}` as any, { count: i.count, max: i.max })}
        </Box>
      ))}
    </Box>
  );
};

export const useDateFormat = () => {
  const { i18n } = useTranslation();
  const locale = i18n.language?.startsWith('hr') ? 'hr-HR' : 'en-GB';

  return {
    locale,
    dateTime: (iso: string | null | undefined) =>
      iso
        ? new Date(iso).toLocaleString(locale, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '—',
    time: (d: Date) => d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
    day: (d: Date) => d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }),
    month: (d: Date) => d.toLocaleDateString(locale, { month: 'long', year: 'numeric' }),
    weekdayShort: (d: Date) => d.toLocaleDateString(locale, { weekday: 'short' }),
  };
};

/** Small grey label above a field. */
export const FieldLabel = ({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) => (
  <Box
    component="label"
    htmlFor={htmlFor}
    sx={{ display: 'block', fontSize: 12, fontWeight: 600, color: bbColors.gray600, mb: '6px' }}
  >
    {children}
  </Box>
);

export const textAreaSx = {
  width: '100%',
  minHeight: 140,
  resize: 'vertical',
  p: '10px 12px',
  borderRadius: '10px',
  border: `1px solid ${bbColors.fieldBorder}`,
  fontFamily: 'inherit',
  fontSize: 14,
  lineHeight: 1.5,
  color: bbColors.navy900,
  bgcolor: bbColors.white,
  outline: 'none',
  boxSizing: 'border-box',
  '&:focus': { borderColor: bbColors.navy700, boxShadow: '0 0 0 3px rgba(26,79,168,.15)' },
  '@media (max-width: 599px)': { fontSize: 16 },
} as const;

/** First line of a post, for lists and calendar chips. */
export const excerpt = (text: string, max = 80) => {
  const line = text.trim().split('\n')[0] ?? '';

  return Array.from(line).length > max ? `${Array.from(line).slice(0, max).join('')}…` : line;
};
