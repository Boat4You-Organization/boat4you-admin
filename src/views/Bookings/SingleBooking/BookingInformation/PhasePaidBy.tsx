import { useTranslation } from 'react-i18next';

import { Typography } from '@mui/material';

import { ReservationPaymentPhase } from '@/models/booking.model';
import { MollieLink, mutedLineSx } from '@/views/CustomPayments/partials/paymentsShared';

/** How a paid phase was paid: card through Mollie (with the payment link); nothing for a bank transfer. */
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

  return null;
};

export default PhasePaidBy;
