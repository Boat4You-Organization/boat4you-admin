import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Box, Checkbox, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';

import { ReservationModel } from '@/models/booking.model';
import colors from '@/styles/themes/colors';
import DateTime from '@/utils/static/DateTime';
import { formatPrice } from '@/utils/static/formatNumber';

interface ConfirmBookingFormProps {
  selectedBooking: ReservationModel | undefined;
}

const ConfirmBookingForm = ({ selectedBooking }: ConfirmBookingFormProps) => {
  const { t } = useTranslation('booking');
  const { setValue } = useFormContext();
  const paymentPhaseIds = useWatch({ name: 'paymentPhaseIds' });

  if (!selectedBooking) {
    return null;
  }

  const handleCheckboxChange = (id: number, checked: boolean) => {
    let updatedIds = [...(paymentPhaseIds || [])];

    if (checked) {
      if (!updatedIds.includes(id)) {
        updatedIds.push(id);
      }
    } else {
      updatedIds = updatedIds.filter(phaseId => phaseId !== id);
    }

    setValue('paymentPhaseIds', updatedIds);
  };

  const isPhaseChecked = (id: number) => paymentPhaseIds?.includes(id) || false;

  return (
    <Stack spacing={1.5}>
      {selectedBooking.reservationPaymentPhases.map(({ id, deadline, amount }, index) => {
        const isChecked = isPhaseChecked(id);

        return (
          <Box
            key={id}
            onClick={() => handleCheckboxChange(id, !isChecked)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: '12px 16px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              borderRadius: 3,
              backgroundColor: isChecked ? colors.blue50 : 'transparent',
              border: isChecked ? `1px solid ${colors.blue500}` : '1px solid transparent',
              '&:hover': {
                backgroundColor: colors.blue50,
                border: `1px solid ${colors.blue500}`,
              },
            }}
          >
            <Checkbox
              checked={isChecked}
              onChange={e => {
                e.stopPropagation();
                handleCheckboxChange(id, e.target.checked);
              }}
            />

            <Stack direction="row" justifyContent="space-between" width="100%" sx={{ userSelect: 'none' }}>
              <Stack>
                <Typography component="p" variant="h4" color={colors.black950}>
                  {t('phase')} {index + 1}
                </Typography>
                <Typography variant="body2" color={colors.black500}>
                  {DateTime.formatHR(dayjs(deadline))}
                </Typography>
              </Stack>
              <Typography component="p" variant="h3" fontWeight={700} color={colors.green500}>
                {`${formatPrice(amount || 0)} €`}
              </Typography>
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
};

export default ConfirmBookingForm;
