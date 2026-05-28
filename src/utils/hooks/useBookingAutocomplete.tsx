import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Autocomplete from '@/components/Autocomplete';
import { FormInputProps } from '@/components/Forms/FormInput';
import { ReservationModelShortInfo, ReservationSysStatus } from '@/models/booking.model';
import ReservationsService from '@/services/reservations.service';

interface UseBookingAutocompleteProps {
  byReservationFlowId?: boolean;
  disabled?: boolean;
  reservationId?: string;
}

const useBookingAutocomplete = ({
  byReservationFlowId = false,
  disabled,
  reservationId,
}: UseBookingAutocompleteProps) => {
  const [bookings, setBookings] = useState<ReservationModelShortInfo[]>([]);

  const { t } = useTranslation();

  useEffect(() => {
    (async (): Promise<void> => {
      const { content } = byReservationFlowId
        ? await ReservationsService.getReservations(0)
        : await ReservationsService.getReservations(
            0,
            '',
            'asc',
            ReservationSysStatus.RESERVATION,
            undefined,
            undefined,
            undefined,
            reservationId
          );

      setBookings(content);
    })();
  }, [byReservationFlowId, reservationId]);

  const renderBookingInput: FormInputProps['renderInput'] = ({ field, error }) => (
    <Autocomplete
      value={field.value}
      options={bookings.map(booking => {
        // Show the human-readable booking number (e.g. "100190/2026") that
        // matches the Bookings table — internal DB ids ("23") are
        // meaningless to the agent. Fall back to the DB id only if the
        // booking number is missing (legacy rows pre-V1_45). Yacht is
        // shown as "Model - Name" so it's clear which boat the booking
        // is for, mirroring the Bookings YACHT / BASE column.
        const bookingNumber = booking.reservationNumber ?? `#${booking.reservationId}`;
        const yacht = [booking.modelName, booking.yachtName].filter(Boolean).join(' - ');

        
return {
          id: byReservationFlowId ? booking.reservationFlowId.toString() : booking.reservationId.toString(),
          label: `${bookingNumber} - ${booking.endUser} - ${yacht}`,
        };
      })}
      onChange={field.onChange}
      label={t('form.booking.reservation')}
      TextFieldProps={{
        placeholder: t('form.booking.reservation'),
        error: !!error,
        helperText: error,
      }}
      disabled={disabled}
      clearable
    />
  );

  return renderBookingInput;
};

export default useBookingAutocomplete;
