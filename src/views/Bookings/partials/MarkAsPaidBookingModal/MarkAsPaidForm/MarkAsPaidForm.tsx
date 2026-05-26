import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Box, Checkbox, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';

import { ReservationModel } from '@/models/booking.model';
import colors from '@/styles/themes/colors';
import DateTime from '@/utils/static/DateTime';
import { formatPrice } from '@/utils/static/formatNumber';

interface MarkAsPaidFormProps {
  selectedBooking: ReservationModel | undefined;
}

const MarkAsPaidForm = ({ selectedBooking }: MarkAsPaidFormProps) => {
  const { t } = useTranslation('booking');
  const { setValue } = useFormContext();
  const paymentPhaseIds = useWatch({ name: 'paymentPhaseIds' });

  if (!selectedBooking) {
    return null;
  }

  const handleCheckboxChange = (id: number, checked: boolean, isPaid: boolean) => {
    if (isPaid) return;

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

  const isPhaseChecked = (id: number, isPaid: boolean) => {
    if (isPaid) return true;

    return paymentPhaseIds?.includes(id) || false;
  };

  return (
    <Stack spacing={1.5}>
      {selectedBooking.reservationPaymentPhases.map(({ id, paidOn, amount, deadline }, index) => {
        const isPaid = !!paidOn;
        const isDisabled = isPaid;
        const isChecked = isPhaseChecked(id, isPaid);

        return (
          <Box
            key={id}
            onClick={() => !isDisabled && handleCheckboxChange(id, !isChecked, isPaid)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: '12px 16px',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              borderRadius: 3,
              backgroundColor: isChecked && !isDisabled ? colors.blue50 : 'transparent',
              border: isChecked && !isDisabled ? `1px solid ${colors.blue500}` : '1px solid transparent',
              '&:hover': {
                backgroundColor: !isDisabled ? colors.blue50 : 'transparent',
                border: !isDisabled ? `1px solid ${colors.blue500}` : '1px solid transparent',
              },
            }}
          >
            <Checkbox
              checked={isChecked}
              disabled={isDisabled}
              onChange={e => {
                e.stopPropagation();
                handleCheckboxChange(id, e.target.checked, isPaid);
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

export default MarkAsPaidForm;
