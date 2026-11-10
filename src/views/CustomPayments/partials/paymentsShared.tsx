import { useTranslation } from 'react-i18next';

import { Box, Button, Stack, Typography } from '@mui/material';

import { molliePaymentUrl } from '@/models/cardPayment.model';
import { bbColors } from '@/styles/bb';
import DateTime from '@/utils/static/DateTime';
import { formatPrice } from '@/utils/static/formatNumber';

/** Table and helpers shared by the two Payments tabs, the booking detail and the Mollie details modal. */

export const thBase = {
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: bbColors.gray500,
  fontWeight: 700,
  padding: '10px 14px',
  textAlign: 'left',
  backgroundColor: bbColors.gray75,
  borderBottom: `1px solid ${bbColors.gray200}`,
  whiteSpace: 'nowrap',
} as const;

export const tdBase = {
  padding: '12px 14px',
  fontSize: 12.5,
  borderBottom: `1px solid ${bbColors.gray100}`,
  color: '#2c3e56',
  whiteSpace: 'nowrap' as const,
  verticalAlign: 'top',
};

export const monoSx = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 11 } as const;

export const mutedLineSx = { fontSize: 11, color: bbColors.gray500 } as const;

export const formatMoney = (minor: number, currency = 'EUR'): string =>
  currency === 'EUR' ? `€${formatPrice(minor / 100)}` : `${currency} ${formatPrice(minor / 100)}`;

export const formatDateTime = (iso: string | null | undefined): string => {
  if (!iso) return '—';

  const d = DateTime.date(iso);

  if (!d.isValid()) return '—';

  return `${DateTime.formatHR(d)} ${DateTime.formatTime(d)}`;
};

/** The Mollie payment id as a link to the Mollie dashboard. */
export const MollieLink = ({ paymentId }: { paymentId: string | null | undefined }) =>
  paymentId ? (
    <Box
      component="a"
      href={molliePaymentUrl(paymentId)}
      target="_blank"
      rel="noopener noreferrer"
      sx={{ ...monoSx, color: 'inherit' }}
    >
      {paymentId}
    </Box>
  ) : (
    <>—</>
  );

interface SegmentTabsProps<T extends string> {
  ids: readonly T[];
  active: T;
  label: (id: T) => string;
  onChange: (id: T) => void;
}

/** Segmented status filter (white track, navy active segment). */
export const SegmentTabs = <T extends string>({ ids, active, label, onChange }: SegmentTabsProps<T>) => (
  <Box
    sx={{
      display: 'flex',
      gap: 0.5,
      backgroundColor: bbColors.white,
      border: `1px solid ${bbColors.gray200}`,
      borderRadius: '10px',
      padding: '4px',
      width: 'fit-content',
      overflowX: 'auto',
      maxWidth: '100%',
    }}
  >
    {ids.map(id => {
      const isActive = id === active;

      return (
        <Box
          key={id}
          component="button"
          type="button"
          aria-pressed={isActive}
          onClick={() => onChange(id)}
          sx={{
            padding: '7px 14px',
            fontSize: 12,
            fontWeight: 700,
            fontFamily: 'inherit',
            color: isActive ? bbColors.white : bbColors.gray500,
            backgroundColor: isActive ? bbColors.navy900 : 'transparent',
            border: 0,
            borderRadius: '6px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {label(id)}
        </Box>
      );
    })}
  </Box>
);

interface PagerProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export const Pager = ({ page, totalPages, onChange }: PagerProps) => {
  const { t } = useTranslation('custom-payments');

  if (totalPages <= 1) return null;

  const btnSx = { textTransform: 'none', fontSize: 12, borderColor: bbColors.gray300, color: bbColors.navy900 };

  return (
    <Stack direction="row" alignItems="center" justifyContent="center" gap={2} sx={{ mt: 2 }}>
      <Button variant="outlined" size="small" disabled={page <= 0} onClick={() => onChange(page - 1)} sx={btnSx}>
        {t('prev')}
      </Button>
      <Typography sx={{ fontSize: 12, color: bbColors.gray500 }}>
        {t('pageOf', { page: page + 1, total: totalPages })}
      </Typography>
      <Button
        variant="outlined"
        size="small"
        disabled={page + 1 >= totalPages}
        onClick={() => onChange(page + 1)}
        sx={btnSx}
      >
        {t('next')}
      </Button>
    </Stack>
  );
};

/** Footer of a list: "Total received" (backend sum over the current filter). */
export const TotalReceived = ({ minor }: { minor: number }) => {
  const { t } = useTranslation('custom-payments');

  return (
    <Stack
      direction="row"
      justifyContent="flex-end"
      gap={1}
      sx={{ padding: '12px 14px', backgroundColor: bbColors.gray75, borderTop: `1px solid ${bbColors.gray200}` }}
    >
      <Typography sx={{ fontSize: 12, color: bbColors.gray500 }}>{t('totalReceived')}</Typography>
      <Typography sx={{ fontSize: 13, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
        {formatMoney(minor)}
      </Typography>
    </Stack>
  );
};
