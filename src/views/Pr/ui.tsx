/* PR: shared bits of the PR screens — the confirmation dialog, status pills, dates, error text and safe external links.
 * Everything from the backend (names, subjects, bodies, errors) renders as React text nodes. */
import { ReactNode, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Link } from '@mui/material';

import { errorMessage } from '@/services/yacht-media.api';
import { StatusTone, bbColors, bbPillStyle } from '@/styles/bb';
import { PrPitchStatus } from '@/types/pr.type';
import { blockCodeOf, decisionLabelKey } from '@/utils/pr/format';

export const PITCH_TONES: Record<PrPitchStatus, StatusTone> = {
  DRAFT: 'neutral',
  SENDING: 'progress',
  SENT: 'info',
  REPLIED: 'success',
  DECLINED: 'neutral',
  PUBLISHED: 'success',
  BOUNCED: 'danger',
  FAILED: 'danger',
};

export const Pill = ({ tone, children }: { tone: StatusTone; children: ReactNode }) => (
  <Box component="span" sx={bbPillStyle(tone)}>
    {children}
  </Box>
);

/** A send-rule block code reads as its own label; any other rejection as the backend message (or the fallback). */
export const usePrError = () => {
  const { t } = useTranslation('pr');

  return useCallback(
    (e: unknown, fallback?: string) => {
      const code = blockCodeOf(e);

      return code ? t(decisionLabelKey(code)) : errorMessage(e, fallback ?? t('ui.actionError'));
    },
    [t]
  );
};

export const useDates = () => {
  const { i18n } = useTranslation();
  const locale = i18n.language?.startsWith('hr') ? 'hr-HR' : 'en-GB';

  return {
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
    /** A "YYYY-MM-DD" day, read as that calendar day (no time zone shift). */
    day: (ymd: string | null | undefined) =>
      ymd
        ? new Date(`${ymd}T12:00:00Z`).toLocaleDateString(locale, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            timeZone: 'UTC',
          })
        : '—',
  };
};

/** Today as "YYYY-MM-DD" (local day), for date inputs. */
export const todayYmd = () => {
  const d = new Date();

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** A link only for an http(s) address, opened in a new tab without the referrer; anything else stays text. */
export const ExtLink = ({ href, children }: { href: string | null | undefined; children?: ReactNode }) => {
  if (!href) return '—';

  if (!/^https?:\/\//i.test(href)) return <span>{children ?? href}</span>;

  return (
    <Link href={href} target="_blank" rel="noopener noreferrer nofollow" sx={{ wordBreak: 'break-all' }}>
      {children ?? href}
    </Link>
  );
};

/**
 * Yes / no dialog. onConfirm may be async: the confirm button is off (with a spinner) until it settles, and a second
 * click while it runs does nothing.
 */
export const ConfirmDialog = ({
  open,
  title,
  children,
  confirmLabel,
  confirmDisabled,
  danger,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: ReactNode;
  children?: ReactNode;
  confirmLabel: ReactNode;
  confirmDisabled?: boolean;
  danger?: boolean;
  onConfirm(): Promise<void> | void;
  onClose(): void;
}) => {
  const { t } = useTranslation('pr');
  const [busy, setBusy] = useState(false);
  // The ref, not the state, blocks a second click that lands before React re-renders the disabled button.
  const running = useRef(false);

  const confirm = async () => {
    if (running.current) return;

    running.current = true;
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      running.current = false;
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      {children && <DialogContent sx={{ fontSize: 14, color: bbColors.gray600 }}>{children}</DialogContent>}
      <DialogActions>
        <Button variant="outlined" onClick={onClose} disabled={busy}>
          {t('ui.cancel')}
        </Button>
        <Button
          variant="contained"
          color={danger ? 'error' : 'primary'}
          onClick={confirm}
          disabled={busy || confirmDisabled}
        >
          {busy ? <CircularProgress size={18} /> : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/** Small grey label above a block of text. */
export const Label = ({ children }: { children: ReactNode }) => (
  <Box sx={{ fontSize: 12, fontWeight: 600, color: bbColors.gray600, mb: '4px' }}>{children}</Box>
);

export const preSx = {
  m: 0,
  p: '12px 14px',
  borderRadius: '10px',
  border: `1px solid ${bbColors.cardBorder}`,
  bgcolor: bbColors.gray50,
  fontFamily: 'inherit',
  fontSize: 13.5,
  lineHeight: 1.55,
  color: bbColors.navy900,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
} as const;

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
