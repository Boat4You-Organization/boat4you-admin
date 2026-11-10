import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box } from '@mui/material';

import { CardHead, DeskCard } from '@/components/Desk';
import { CardPaymentModel } from '@/models/cardPayment.model';
import CardPaymentsService from '@/services/card-payments.service';
import { bbColors } from '@/styles/bb';
import { showToast } from '@/valtio/global/global.actions';
import { AmountCell, CardPaymentActions } from '@/views/CustomPayments/partials/BookingPaymentsTab';
import CardPaymentStatusCell from '@/views/CustomPayments/partials/CardPaymentStatusCell';
import MolliePaymentDetailsModal from '@/views/CustomPayments/partials/MolliePaymentDetailsModal';
import { MollieLink, formatDateTime, mutedLineSx, tdBase } from '@/views/CustomPayments/partials/paymentsShared';

/**
 * Card payments (Mollie checkouts) of one booking. Renders nothing while loading, when there are none,
 * or when the request fails: the booking page must never break on it.
 */
const BookingCardPayments = ({ reservationId }: { reservationId: number }) => {
  const { t } = useTranslation('custom-payments');
  const [rows, setRows] = useState<CardPaymentModel[]>([]);
  const [refreshingId, setRefreshingId] = useState<number | null>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setRows([]);
    CardPaymentsService.getCardPayments({ page: 0, size: 50, reservationId }).then(({ payload }) => {
      if (!cancelled) setRows(payload?.content ?? []);
    });

    return () => {
      cancelled = true;
    };
  }, [reservationId]);

  const onRefresh = async (id: number) => {
    setRefreshingId(id);

    const { payload } = await CardPaymentsService.refresh(id);

    setRefreshingId(null);

    if (!payload) {
      showToast({ status: 'error', text: t('refreshFailed') });

      return;
    }

    setRows(prev => prev.map(r => (r.id === id ? payload : r)));
  };

  if (rows.length === 0) return null;

  return (
    <DeskCard>
      <MolliePaymentDetailsModal paymentId={detailsId} onClose={() => setDetailsId(null)} />
      <CardHead title={t('bookingCardPayments')} />
      <Box sx={{ overflowX: 'auto', p: '0 4px 8px' }}>
        <Box component="table" sx={{ width: '100%', minWidth: 720, borderCollapse: 'collapse' }}>
          <Box component="tbody">
            {rows.map(p => (
              <Box component="tr" key={p.id}>
                <Box component="td" sx={{ ...tdBase, fontVariantNumeric: 'tabular-nums' }}>
                  {formatDateTime(p.createdAt)}
                  {p.completedAt && <Box sx={mutedLineSx}>{t('paidOn', { date: formatDateTime(p.completedAt) })}</Box>}
                </Box>
                <Box component="td" sx={{ ...tdBase, fontVariantNumeric: 'tabular-nums' }}>
                  <AmountCell p={p} />
                </Box>
                <Box component="td" sx={tdBase}>
                  <CardPaymentStatusCell payment={p} />
                </Box>
                <Box component="td" sx={{ ...tdBase, color: bbColors.gray600 }}>
                  <MollieLink paymentId={p.providerOrderId} />
                </Box>
                <Box component="td" sx={{ ...tdBase, textAlign: 'right' }}>
                  <CardPaymentActions
                    p={p}
                    refreshing={refreshingId === p.id}
                    onDetails={setDetailsId}
                    onRefresh={onRefresh}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </DeskCard>
  );
};

export default BookingCardPayments;
