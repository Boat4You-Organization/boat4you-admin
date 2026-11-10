import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Stack, Typography } from '@mui/material';

import ModalRoot from '@/components/ModalRoot';
import { MolliePaymentDetails, molliePaymentUrl } from '@/models/cardPayment.model';
import CardPaymentsService from '@/services/card-payments.service';
import { bbColors, bbOverlineSx, bbStatusPill } from '@/styles/bb';
import useBreakpoint from '@/utils/hooks/useBreakpoint';

import { formatDateTime, formatMoney, monoSx, mutedLineSx, tdBase, thBase } from './paymentsShared';

// Mollie's own statuses → the admin pill colours.
const MOLLIE_STATUS_PILL: Record<string, string> = {
  paid: 'paid',
  open: 'pending',
  pending: 'pending',
  authorized: 'pending',
  failed: 'overdue',
  expired: 'ended',
  canceled: 'ended',
};

const TIMESTAMPS = ['createdAt', 'paidAt', 'expiresAt', 'expiredAt', 'failedAt', 'canceledAt'] as const;

interface MolliePaymentDetailsModalProps {
  /** Mollie payment id (tr_…); null = closed. */
  paymentId: string | null;
  onClose: () => void;
}

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Stack direction="row" justifyContent="space-between" gap={2} sx={{ py: '5px', fontSize: 13 }}>
    <Box component="span" sx={{ color: bbColors.gray500, flex: 'none' }}>
      {label}
    </Box>
    <Box component="span" sx={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', minWidth: 0 }}>
      {children}
    </Box>
  </Stack>
);

const SmallTable = ({ head, rows }: { head: string[]; rows: (string | React.ReactNode)[][] }) => (
  <Box sx={{ overflowX: 'auto', border: `1px solid ${bbColors.gray200}`, borderRadius: '8px', mt: 0.5 }}>
    <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
      <Box component="thead">
        <Box component="tr">
          {head.map(h => (
            <Box component="th" key={h} sx={{ ...thBase, padding: '8px 10px' }}>
              {h}
            </Box>
          ))}
        </Box>
      </Box>
      <Box component="tbody">
        {rows.map((cells, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <Box component="tr" key={i}>
            {cells.map((c, j) => (
              // eslint-disable-next-line react/no-array-index-key
              <Box component="td" key={j} sx={{ ...tdBase, padding: '8px 10px' }}>
                {c}
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  </Box>
);

/** Live read of one Mollie payment: status, card, amounts, timestamps, refunds and chargebacks. */
const MolliePaymentDetailsModal = ({ paymentId, onClose }: MolliePaymentDetailsModalProps) => {
  const { t } = useTranslation('custom-payments');
  const { isMobile } = useBreakpoint();
  const [details, setDetails] = useState<MolliePaymentDetails | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!paymentId) return undefined;

    let cancelled = false;

    setDetails(null);
    setFailed(false);
    CardPaymentsService.getMolliePayment(paymentId).then(({ payload }) => {
      if (cancelled) return;

      setDetails(payload);
      setFailed(!payload);
    });

    return () => {
      cancelled = true;
    };
  }, [paymentId]);

  const d = details;
  const card = d && [d.cardLabel, d.cardLast4 ? `•••• ${d.cardLast4}` : null, d.cardCountryCode].filter(Boolean);
  const cardKind = d && [d.cardFunding, d.cardAudience].filter(Boolean).join(' · ');

  return (
    <ModalRoot
      open={!!paymentId}
      fullScreen={isMobile}
      onClose={onClose}
      onCancel={onClose}
      title={t('detailsTitle')}
      cancelBtnText={t('close')}
      hideConfirmButton
      width={620}
    >
      <Box sx={{ minWidth: { xs: 'auto', md: 540 }, fontSize: 13 }}>
        <Typography sx={{ ...monoSx, fontSize: 12, color: bbColors.gray500, mb: 1 }}>{paymentId}</Typography>

        {!d && !failed && <Typography sx={{ fontSize: 13, color: bbColors.gray500 }}>{t('loading')}</Typography>}
        {failed && <Typography sx={{ fontSize: 13, color: bbColors.red600 }}>{t('detailsFailed')}</Typography>}

        {d && (
          <>
            <Row label={t('mollie.status')}>
              <Stack direction="row" gap={1} alignItems="center" justifyContent="flex-end">
                {d.mode === 'test' && (
                  <Box component="span" sx={mutedLineSx}>
                    {t('mollie.testMode')}
                  </Box>
                )}
                <Box component="span" sx={bbStatusPill(MOLLIE_STATUS_PILL[d.status] ?? 'new').style}>
                  {d.status}
                </Box>
              </Stack>
            </Row>
            {d.description && <Row label={t('mollie.description')}>{d.description}</Row>}
            <Row label={t('mollie.method')}>{d.method ?? '—'}</Row>
            {card && card.length > 0 && (
              <Row label={t('mollie.card')}>
                {card.join(' · ')}
                {cardKind && <Box sx={mutedLineSx}>{cardKind}</Box>}
              </Row>
            )}
            {d.feeRegion && <Row label={t('mollie.feeRegion')}>{d.feeRegion}</Row>}
            <Row label={t('mollie.amount')}>
              <strong>{formatMoney(d.amountMinor, d.currency)}</strong>
            </Row>
            {d.refundedAmountMinor > 0 && (
              <Row label={t('refunded')}>{formatMoney(d.refundedAmountMinor, d.currency)}</Row>
            )}
            {d.chargedBackAmountMinor > 0 && (
              <Row label={t('chargeback')}>
                <Box component="span" sx={{ color: bbColors.red700 }}>
                  {formatMoney(d.chargedBackAmountMinor, d.currency)}
                </Box>
              </Row>
            )}
            {TIMESTAMPS.filter(k => d[k]).map(k => (
              <Row key={k} label={t(`mollie.${k}`)}>
                {formatDateTime(d[k])}
              </Row>
            ))}
            {(d.failureReason || d.failureMessage) && (
              <Row label={t('mollie.failure')}>
                <Box component="span" sx={{ color: bbColors.red700, whiteSpace: 'normal' }}>
                  {[d.failureReason, d.failureMessage].filter(Boolean).join(' · ')}
                </Box>
              </Row>
            )}

            {d.refunds.length > 0 && (
              <Box sx={{ mt: 1.5 }}>
                <Typography sx={bbOverlineSx}>{t('mollie.refunds')}</Typography>
                <SmallTable
                  head={[t('mollie.id'), t('columns.amount'), t('columns.status'), t('columns.date')]}
                  rows={d.refunds.map(r => [
                    <Box component="span" sx={monoSx} title={r.description ?? undefined}>
                      {r.id}
                    </Box>,
                    formatMoney(r.amountMinor, d.currency),
                    r.status,
                    formatDateTime(r.createdAt),
                  ])}
                />
              </Box>
            )}
            {d.chargebacks.length > 0 && (
              <Box sx={{ mt: 1.5 }}>
                <Typography sx={bbOverlineSx}>{t('mollie.chargebacks')}</Typography>
                <SmallTable
                  head={[t('mollie.id'), t('columns.amount'), t('mollie.reason'), t('columns.date')]}
                  rows={d.chargebacks.map(c => [
                    <Box component="span" sx={monoSx}>
                      {c.id}
                    </Box>,
                    formatMoney(c.amountMinor, d.currency),
                    c.reason ?? '—',
                    formatDateTime(c.createdAt),
                  ])}
                />
              </Box>
            )}
          </>
        )}

        {paymentId && (
          <Box sx={{ mt: 2, pt: 1.5, borderTop: `1px solid ${bbColors.gray100}` }}>
            <Typography sx={{ ...mutedLineSx, fontSize: 12 }}>{t('feeNote')}</Typography>
            <Box
              component="a"
              href={molliePaymentUrl(paymentId)}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ display: 'inline-block', mt: 0.75, fontSize: 12.5, fontWeight: 700, color: bbColors.navy700 }}
            >
              {`${t('openInMollie')} →`}
            </Box>
          </Box>
        )}
      </Box>
    </ModalRoot>
  );
};

export default MolliePaymentDetailsModal;
