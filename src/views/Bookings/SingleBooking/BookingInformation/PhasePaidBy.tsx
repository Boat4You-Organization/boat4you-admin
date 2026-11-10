import { useTranslation } from 'react-i18next';

import { Typography } from '@mui/material';

import { ReservationPaymentPhase } from '@/models/booking.model';
import { MollieLink, monoSx, mutedLineSx } from '@/views/CustomPayments/partials/paymentsShared';

/** How a paid phase was paid: card through Mollie (with the payment link) or Stripe; nothing for a bank transfer. */
const PhasePaidBy = ({ phase }: { phase: ReservationPaymentPhase }) => {
  const { t } = useTranslation('custom-payments');

  if (phase.paymentProvider === 'MOLLIE') {
    return (
      <Typography sx={mutedLineSx}>
        {`${t('paidByMollie')} · `}
        <MollieLink paymentId={phase.providerPaymentId} />
      </Typography>
    );
  }

  if (phase.stripePaymentIntentId) {
    return (
      <Typography sx={mutedLineSx}>
        {`${t('paidByStripe')} · `}
        <span style={monoSx}>{phase.stripePaymentIntentId}</span>
      </Typography>
    );
  }

  return null;
};

export default PhasePaidBy;
