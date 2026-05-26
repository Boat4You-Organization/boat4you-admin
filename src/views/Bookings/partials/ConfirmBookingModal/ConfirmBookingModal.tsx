import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

import Form from '@/components/Forms/Form';
import ModalRoot from '@/components/ModalRoot';
import { PaymentPhaseFormValues } from '@/config/forms/form-models.config';
import { CONFIRM_RESERVATION_FORM } from '@/config/forms/form-names.config';
import ReservationsService from '@/services/reservations.service';
import useBreakpoint from '@/utils/hooks/useBreakpoint';
import { getBookings, getSelectedBooking } from '@/valtio/bookings/bookings.actions';
import { useBookingsStore } from '@/valtio/bookings/bookings.store';
import { showToast } from '@/valtio/global/global.actions';
import useBookingsView from '@/views/Bookings/useBookingsView';

import ConfirmBookingForm from './ConfirmBookingForm';

interface ConfirmBookingModalProps {
  isSinglePage?: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const defaultValues: PaymentPhaseFormValues = {
  paymentPhaseIds: [],
};
const ConfirmBookingModal = ({ isSinglePage = false, isOpen, onClose }: ConfirmBookingModalProps) => {
  const { selectedBooking } = useBookingsStore();
  const { closeBookingModal } = useBookingsView();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { isMobile } = useBreakpoint();

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

  const handleSubmit = async (formValues: PaymentPhaseFormValues): Promise<void> => {
    if (!selectedBooking) {
      return;
    }

    const { payload, message } = await ReservationsService.confirmReservation(
      selectedBooking.reservationId,
      formValues.paymentPhaseIds
    );

    showToast({
      status: payload ? 'success' : 'error',
      text: payload
        ? t('toast-messages.confirm-booking-successfully')
        : message || t('toast-messages.confirm-booking-failed'),
    });

    if (payload) {
      refreshView();
      handleClose();
    }
  };

  return (
    <ModalRoot
      open={isOpen}
      fullScreen={isMobile}
      onClose={handleClose}
      title={t('actions.confirm-booking')}
      cancelBtnText={t('actions.cancel')}
      onCancel={handleClose}
      zIndex={1400}
      width={500}
      ConfirmBtnProps={{
        form: CONFIRM_RESERVATION_FORM,
        type: 'submit',
      }}
    >
      <Form defaultValues={defaultValues} onSubmit={handleSubmit} id={CONFIRM_RESERVATION_FORM} mode="onBlur">
        <ConfirmBookingForm selectedBooking={selectedBooking} />
      </Form>
    </ModalRoot>
  );
};

export default ConfirmBookingModal;
