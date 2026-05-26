import React, { useEffect, useState } from 'react';

import Autocomplete from '@/components/Autocomplete';
import { ReservationModelShortInfo, ReservationSysStatus } from '@/models/booking.model';
import ReservationsService from '@/services/reservations.service';

interface ReservationAutocompleteProps {
  value?: string;
  onChange: (selectedOption: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string | boolean;
  helperText?: string;
  required?: boolean;
}

const ReservationAutocomplete: React.FC<ReservationAutocompleteProps> = ({
  value,
  onChange,
  label,
  placeholder,
  disabled = false,
  error = false,
  helperText,
  required = false,
}) => {
  const [reservations, setReservations] = useState<ReservationModelShortInfo[]>([]);

  useEffect(() => {
    (async (): Promise<void> => {
      const { content } = await ReservationsService.getReservations(0, '', 'asc', ReservationSysStatus.RESERVATION);

      setReservations(content);
    })();
  }, []);

  const handleChange = (selectedOption: string) => {
    onChange(selectedOption);
  };

  return (
    <Autocomplete
      value={value || ''}
      options={reservations.map(reservation => ({
        id: reservation.reservationId.toString(),
        label: reservation.reservationNumber.toString(),
      }))}
      onChange={handleChange}
      label={label}
      disabled={disabled}
      clearable
      TextFieldProps={{
        placeholder,
        error: !!error,
        helperText: helperText || (error && typeof error === 'string' ? error : undefined),
        required,
      }}
    />
  );
};

export default ReservationAutocomplete;
