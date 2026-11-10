import { useTranslation } from 'react-i18next';

import { Box, Stack } from '@mui/material';

import { CARD_PAYMENT_STATUS_PILL, CardPaymentModel, CardPaymentStatus } from '@/models/cardPayment.model';
import { bbStatusPill, bbTagStyles, bbTones } from '@/styles/bb';

import { formatMoney } from './paymentsShared';

const badgeSx = (tone: 'neutral' | 'danger') => ({
  ...bbTagStyles.base,
  background: bbTones[tone].bg,
  color: bbTones[tone].fg,
  width: 'fit-content',
});

/** Status pill of a booking card payment, with refund / chargeback / confirmation / review badges under it. */
const CardPaymentStatusCell = ({ payment }: { payment: CardPaymentModel }) => {
  const { t } = useTranslation('custom-payments');
  const pill = bbStatusPill(CARD_PAYMENT_STATUS_PILL[payment.status] ?? payment.status);

  return (
    <Stack gap={0.5} alignItems="flex-start">
      <Box component="span" sx={pill.style}>
        {t(`cardStatus.${payment.status}`, { defaultValue: payment.status })}
      </Box>
      {payment.refundedAmountMinor > 0 && (
        <Box component="span" sx={badgeSx('neutral')}>
          {`${t('refunded')} ${formatMoney(payment.refundedAmountMinor, payment.currency)}`}
        </Box>
      )}
      {payment.chargedBackAmountMinor > 0 && (
        <Box component="span" sx={badgeSx('danger')}>
          {`${t('chargeback')} ${formatMoney(payment.chargedBackAmountMinor, payment.currency)}`}
        </Box>
      )}
      {payment.promoteState === 'FAILED' && (
        <Box component="span" sx={badgeSx('danger')} title={t('bookingNotConfirmedHint')}>
          {t('bookingNotConfirmed')}
        </Box>
      )}
      {payment.status === CardPaymentStatus.NEEDS_REVIEW && payment.reviewReason && (
        <Box
          component="span"
          title={payment.reviewReason}
          sx={{ fontSize: 11, color: bbTones.danger.fg, whiteSpace: 'normal', maxWidth: 260 }}
        >
          {payment.reviewReason}
        </Box>
      )}
    </Stack>
  );
};

export default CardPaymentStatusCell;
