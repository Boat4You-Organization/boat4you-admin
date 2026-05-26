import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

import { CircularProgress, Stack, Typography } from '@mui/material';

import ModalRoot from '@/components/ModalRoot';
import BookingVector from '@/components/SvgIcons/Vector/BookingVector';
import ReservationsService from '@/services/reservations.service';
import colors from '@/styles/themes/colors';
import { getBookings, getSelectedBooking } from '@/valtio/bookings/bookings.actions';
import { useBookingsStore } from '@/valtio/bookings/bookings.store';
import { showToast } from '@/valtio/global/global.actions';
import useBookingsView from '@/views/Bookings/useBookingsView';

interface SyncBookingModalProps {
  isSinglePage?: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const SyncBookingModal = ({ isSinglePage = false, isOpen, onClose }: SyncBookingModalProps) => {
  const { selectedBooking } = useBookingsStore();
  const { closeBookingModal } = useBookingsView();
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const refreshView = () => {
    if (isSinglePage) {
      getSelectedBooking(Number(selectedBooking?.reservationId));

      return;
    }

    const page = Number(searchParams.get('page'));

    getBookings(page);
  };

  const handleClose = () => {
    onClose();

    if (!isSinglePage) {
      closeBookingModal();
    }
  };

  const handleConfirm = async (): Promise<void> => {
    if (!selectedBooking) {
      return;
    }

    try {
      setIsLoading(true);

      const { payload, message } = await ReservationsService.refreshReservation(selectedBooking.reservationId);

      await new Promise(resolve => {
        setTimeout(resolve, 1500);
      });

      showToast({
        status: payload ? 'success' : 'error',
        text: payload
          ? t('toast-messages.sync-booking-successfully')
          : message || t('toast-messages.sync-booking-failed'),
      });

      if (payload) {
        refreshView();
        handleClose();
      }
    } catch {
      showToast({
        status: 'error',
        text: t('toast-messages.sync-booking-failed'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <ModalRoot
        hideTitle
        open={isOpen}
        onClose={() => {}}
        hideCancelButton
        hideConfirmButton
        width={630}
        zIndex={1450}
      >
        <Stack alignItems="center" p={4} spacing={8}>
          <Stack position="relative">
            <CircularProgress size={32} sx={{ position: 'absolute', top: 12, left: 86 }} />
            <BookingVector />
          </Stack>
          <Stack maxWidth={300} textAlign="center" spacing={1}>
            <Typography
              component="p"
              variant="h1"
              dangerouslySetInnerHTML={{
                __html: t('booking.your-booking-is-sync'),
              }}
              sx={{
                '& strong': {
                  fontStyle: 'italic',
                  color: colors.blue500,
                },
              }}
            />
            <Typography variant="body2" color={colors.black400}>
              {t('booking.please-dont-close-window')}
            </Typography>
          </Stack>
        </Stack>
      </ModalRoot>
    );
  }

  return (
    <ModalRoot
      open={isOpen}
      onClose={handleClose}
      title={t('actions.sync-booking')}
      cancelBtnText={t('actions.cancel')}
      onConfirm={handleConfirm}
      onCancel={handleClose}
      width={480}
      zIndex={1400}
      ConfirmBtnProps={{
        color: 'primary',
      }}
      CancelBtnProps={{
        color: 'secondary',
      }}
    >
      <Typography
        variant="body1"
        dangerouslySetInnerHTML={{
          __html: t('booking.sync-booking-text', {
            value: `#${selectedBooking?.reservationNumber || selectedBooking?.reservationId || ''}`,
          }),
        }}
      />
    </ModalRoot>
  );
};

export default SyncBookingModal;
