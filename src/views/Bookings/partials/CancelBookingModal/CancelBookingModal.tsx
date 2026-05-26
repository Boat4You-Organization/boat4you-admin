import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Alert, Stack, TextField, Typography } from '@mui/material';

import ModalRoot from '@/components/ModalRoot';
import { ReservationSysStatus } from '@/models/booking.model';
import ReservationsService from '@/services/reservations.service';
import { clearSelectedBooking, getBookings } from '@/valtio/bookings/bookings.actions';
import { useBookingsStore } from '@/valtio/bookings/bookings.store';
import { showToast } from '@/valtio/global/global.actions';
import useBookingsView from '@/views/Bookings/useBookingsView';

interface CancelBookingModalProps {
  isSinglePage?: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const CancelBookingModal = ({ isSinglePage = false, isOpen, onClose }: CancelBookingModalProps) => {
  const { selectedBooking } = useBookingsStore();
  const { closeBookingModal } = useBookingsView();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [reason, setReason] = useState('');

  // Reset the reason textarea each time the modal is opened, so a stale
  // draft from a previous cancel attempt doesn't carry over to a new one.
  useEffect(() => {
    if (isOpen) setReason('');
  }, [isOpen]);

  const refreshView = () => {
    const page = Number(searchParams.get('page'));

    getBookings(page);
  };

  const handleConfirm = async (): Promise<void> => {
    if (!selectedBooking) {
      return;
    }

    const { payload, message } = await ReservationsService.deleteReservation(selectedBooking.reservationId, reason);

    showToast({
      status: payload ? 'success' : 'error',
      text: payload
        ? t('toast-messages.delete-booking-successfully')
        : message || t('toast-messages.delete-booking-failed'),
    });

    if (payload) {
      onClose();

      if (!isSinglePage) {
        closeBookingModal();
        refreshView();
      }
    }
  };

  const handleClose = () => {
    onClose();

    if (!isSinglePage) {
      navigate(`/bookings?${searchParams.toString()}`);
      clearSelectedBooking();
    }
  };

  return (
    <ModalRoot
      open={isOpen}
      onClose={handleClose}
      title={t('actions.delete-booking')}
      cancelBtnText={t('actions.cancel')}
      onConfirm={handleConfirm}
      onCancel={handleClose}
      width={480}
      ConfirmBtnProps={{
        color: 'error',
      }}
      CancelBtnProps={{
        color: 'info',
      }}
      zIndex={1400}
    >
      <Stack spacing={2}>
        <Typography
          variant="body1"
          dangerouslySetInnerHTML={{
            __html: t('common.delete-confirmation-text-bulk', {
              value: `#${selectedBooking?.reservationNumber || selectedBooking?.reservationId}`,
            }),
          }}
        />
        {selectedBooking?.reservationSysStatus === ReservationSysStatus.RESERVATION && (
          <Alert severity="warning">
            This booking is a <strong>confirmed reservation</strong>. Any payment the client has already
            made must be refunded <strong>manually outside the app</strong>. The system will not trigger
            a Stripe/bank refund automatically. Please contact the client and arrange the refund before
            or after cancelling here.
          </Alert>
        )}
        <TextField
          label="Reason (shown to the customer)"
          placeholder="e.g. Overbooking — the yacht is no longer available for these dates. Refund will be processed within 5–7 working days."
          multiline
          minRows={3}
          fullWidth
          value={reason}
          onChange={e => setReason(e.target.value)}
          helperText="Optional. The customer will see this message on their /my-bookings page next to the cancelled chip."
        />
      </Stack>
    </ModalRoot>
  );
};

export default CancelBookingModal;
