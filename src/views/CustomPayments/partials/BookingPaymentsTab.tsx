import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';

import RefreshIcon from '@mui/icons-material/Refresh';
import { Box, Button, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material';

import { CARD_PAYMENT_FILTERS, CardPaymentFilter, CardPaymentModel } from '@/models/cardPayment.model';
import { bbColors } from '@/styles/bb';
import { getCardPayments, refreshCardPayment } from '@/valtio/cardPayments/cardPayments.actions';
import { useCardPaymentsStore } from '@/valtio/cardPayments/cardPayments.store';
import { showToast } from '@/valtio/global/global.actions';

import CardPaymentStatusCell from './CardPaymentStatusCell';
import {
  MollieLink,
  Pager,
  SegmentTabs,
  TotalReceived,
  formatDateTime,
  formatMoney,
  mutedLineSx,
  tdBase,
  thBase,
} from './paymentsShared';

const FILTERS = Object.keys(CARD_PAYMENT_FILTERS) as CardPaymentFilter[];

const COLUMNS = ['date', 'booking', 'client', 'amount', 'status', 'orderId'] as const;

const linkSx = { color: bbColors.navy700, textDecoration: 'none', fontSize: 11.5 } as const;

/** Booking label; links to the booking detail when the payment belongs to a reservation with a number. */
export const BookingCell = ({ p }: { p: CardPaymentModel }) => {
  const label = p.reservationNumber ?? p.reference;

  return p.reservationId && p.reservationNumber ? (
    <Typography
      component={RouterLink}
      to={`/bookings/${encodeURIComponent(p.reservationNumber.replace('/', '-'))}`}
      sx={{ fontSize: 12.5, fontWeight: 700, color: bbColors.navy700, textDecoration: 'none' }}
    >
      {`${label} →`}
    </Typography>
  ) : (
    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: bbColors.navy900 }}>{label}</Typography>
  );
};

/** Charged amount, with the instalment / card-fee split on a muted line. */
export const AmountCell = ({ p }: { p: CardPaymentModel }) => {
  const { t } = useTranslation('custom-payments');

  return (
    <>
      <Box sx={{ fontWeight: 700 }}>{formatMoney(p.amountMinor, p.currency)}</Box>
      {p.surchargeAmountMinor > 0 && (
        <Box sx={mutedLineSx}>
          {t('instalmentPlusFee', {
            base: formatMoney(p.baseAmountMinor, p.currency),
            fee: formatMoney(p.surchargeAmountMinor, p.currency),
          })}
        </Box>
      )}
    </>
  );
};

interface RowActionsProps {
  p: CardPaymentModel;
  refreshing: boolean;
  onDetails: (paymentId: string) => void;
  onRefresh: (id: number) => void;
}

export const CardPaymentActions = ({ p, refreshing, onDetails, onRefresh }: RowActionsProps) => {
  const { t } = useTranslation('custom-payments');

  return (
    <Stack direction="row" gap={0.5} alignItems="center" justifyContent="flex-end">
      <Button
        size="small"
        variant="text"
        disabled={!p.providerOrderId}
        onClick={() => onDetails(p.providerOrderId)}
        sx={{ textTransform: 'none', fontSize: 12, fontWeight: 700, color: bbColors.navy700, minWidth: 0 }}
      >
        {t('details')}
      </Button>
      <Tooltip title={t('refresh')}>
        <span>
          <IconButton size="small" aria-label={t('refresh')} disabled={refreshing} onClick={() => onRefresh(p.id)}>
            <RefreshIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
};

interface BookingPaymentsTabProps {
  onDetails: (paymentId: string) => void;
}

/** Card payments of online bookings (Mollie), newest first. */
const BookingPaymentsTab = ({ onDetails }: BookingPaymentsTabProps) => {
  const { t } = useTranslation('custom-payments');
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';

  const { isLoading, loadFailed, cardPayments, totalPages, totalReceivedMinor } = useCardPaymentsStore();
  const [filter, setFilter] = useState<CardPaymentFilter>('all');
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState(q);
  const [refreshingId, setRefreshingId] = useState<number | null>(null);

  useEffect(() => setSearchInput(q), [q]);

  useEffect(() => {
    getCardPayments({ page, statuses: CARD_PAYMENT_FILTERS[filter], q });
  }, [page, filter, q]);

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;

    const next = new URLSearchParams(searchParams);
    const value = searchInput.trim();

    if (value) {
      next.set('q', value);
    } else {
      next.delete('q');
    }

    setSearchParams(next, { replace: true });
    setPage(0);
  };

  const onRefresh = async (id: number) => {
    setRefreshingId(id);

    const ok = await refreshCardPayment(id);

    setRefreshingId(null);

    if (!ok) showToast({ status: 'error', text: t('refreshFailed') });
  };

  let tableMessage: string | null = null;

  if (isLoading) {
    tableMessage = t('loading');
  } else if (loadFailed) {
    tableMessage = t('cardLoadFailed');
  } else if (cardPayments.length === 0) {
    tableMessage = t('cardEmpty');
  }

  return (
    <>
      <Stack direction="row" gap={1} sx={{ mb: 1.75, flexWrap: 'wrap', alignItems: 'center' }}>
        <SegmentTabs
          ids={FILTERS}
          active={filter}
          label={id => t(`cardFilter.${id}`)}
          onChange={id => {
            setFilter(id);
            setPage(0);
          }}
        />
      </Stack>

      <Stack
        direction="row"
        gap={1}
        sx={{
          backgroundColor: bbColors.white,
          border: `1px solid ${bbColors.gray200}`,
          borderRadius: '10px',
          padding: '10px 12px',
          mb: 1.75,
          alignItems: 'center',
        }}
      >
        <TextField
          placeholder={t('cardSearchPlaceholder')}
          size="small"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={onSearchKey}
          sx={{
            flex: 1,
            minWidth: 0,
            '& .MuiOutlinedInput-root': {
              fontSize: 12,
              borderRadius: '6px',
              '& fieldset': { borderColor: bbColors.gray300 },
            },
          }}
        />
      </Stack>

      <Box
        sx={{
          backgroundColor: bbColors.white,
          border: `1px solid ${bbColors.gray200}`,
          borderRadius: '10px',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ overflowX: 'auto' }}>
          <Box component="table" sx={{ width: '100%', minWidth: 1100, borderCollapse: 'collapse' }}>
            <Box component="thead">
              <Box component="tr">
                {COLUMNS.map(col => (
                  <Box component="th" key={col} sx={thBase}>
                    {t(`cardColumns.${col}`)}
                  </Box>
                ))}
                {/* No header text: the action buttons carry their own labels. */}
                <Box component="td" sx={thBase} />
              </Box>
            </Box>
            <Box component="tbody">
              {tableMessage && (
                <Box component="tr">
                  <Box
                    component="td"
                    colSpan={COLUMNS.length + 1}
                    sx={{
                      padding: '40px 20px',
                      textAlign: 'center',
                      color: loadFailed && !isLoading ? bbColors.red600 : bbColors.gray500,
                      fontSize: 13,
                    }}
                  >
                    {tableMessage}
                  </Box>
                </Box>
              )}
              {!isLoading &&
                cardPayments.map(p => (
                  <Box component="tr" key={p.id} sx={{ '&:hover': { backgroundColor: bbColors.gray75 } }}>
                    <Box component="td" sx={{ ...tdBase, fontVariantNumeric: 'tabular-nums' }}>
                      {formatDateTime(p.createdAt)}
                      {p.completedAt && (
                        <Box sx={mutedLineSx}>{t('paidOn', { date: formatDateTime(p.completedAt) })}</Box>
                      )}
                    </Box>
                    <Box component="td" sx={tdBase}>
                      <BookingCell p={p} />
                      {p.payFullAmount && <Box sx={mutedLineSx}>{t('fullAmount')}</Box>}
                    </Box>
                    <Box component="td" sx={tdBase}>
                      <Box sx={{ fontWeight: 700, color: bbColors.navy900 }}>{p.clientName || '—'}</Box>
                      {p.clientEmail && (
                        <Box component="a" href={`mailto:${p.clientEmail}`} sx={{ ...linkSx, display: 'block' }}>
                          {p.clientEmail}
                        </Box>
                      )}
                      {p.clientPhone && (
                        <Box
                          component="a"
                          href={`tel:${p.clientPhone.replace(/[^\d+]/g, '')}`}
                          sx={{ ...linkSx, display: 'block' }}
                        >
                          {p.clientPhone}
                        </Box>
                      )}
                    </Box>
                    <Box component="td" sx={{ ...tdBase, fontVariantNumeric: 'tabular-nums' }}>
                      <AmountCell p={p} />
                    </Box>
                    <Box component="td" sx={tdBase}>
                      <CardPaymentStatusCell payment={p} />
                    </Box>
                    <Box component="td" sx={tdBase}>
                      <MollieLink paymentId={p.providerOrderId} />
                    </Box>
                    <Box component="td" sx={{ ...tdBase, textAlign: 'right' }}>
                      <CardPaymentActions
                        p={p}
                        refreshing={refreshingId === p.id}
                        onDetails={onDetails}
                        onRefresh={onRefresh}
                      />
                    </Box>
                  </Box>
                ))}
            </Box>
          </Box>
        </Box>
        <TotalReceived minor={totalReceivedMinor} />
      </Box>

      <Pager page={page} totalPages={totalPages} onChange={setPage} />
    </>
  );
};

export default BookingPaymentsTab;
