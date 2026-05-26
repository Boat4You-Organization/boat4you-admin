import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

import Form from '@/components/Forms/Form';
import ModalRoot from '@/components/ModalRoot';
import { PaymentPhaseFormValues } from '@/config/forms/form-models.config';
import { MARK_PAID_RESERVATION_FORM } from '@/config/forms/form-names.config';
import ReservationsService from '@/services/reservations.service';
import useBreakpoint from '@/utils/hooks/useBreakpoint';
import { getBookings, getSelectedBooking } from '@/valtio/bookings/bookings.actions';
import { useBookingsStore } from '@/valtio/bookings/bookings.store';
import { showToast } from '@/valtio/global/global.actions';
import useBookingsView from '@/views/Bookings/useBookingsView';

import MarkAsPaidForm from './MarkAsPaidForm';

interface MarkAsPaidBookingModalProps {
  isSinglePage?: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const defaultValues: PaymentPhaseFormValues = {
  paymentPhaseIds: [],
};
const MarkAsPaidBookingModal = ({ isSinglePage = false, isOpen, onClose }: MarkAsPaidBookingModalProps) => {
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

    const { payload, message } = await ReservationsService.markAsPaidReservation(
      selectedBooking.reservationId,
      formValues.paymentPhaseIds
    );

    showToast({
      status: payload ? 'success' : 'error',
      text: payload
        ? t('toast-messages.mark-paid-booking-successfully')
        : message || t('toast-messages.mark-paid-booking-failed'),
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
      title={t('actions.mark-as-paid')}
      cancelBtnText={t('actions.cancel')}
      onCancel={handleClose}
      zIndex={1400}
      width={500}
      ConfirmBtnProps={{
        form: MARK_PAID_RESERVATION_FORM,
        type: 'submit',
      }}
    >
      <Form defaultValues={defaultValues} onSubmit={handleSubmit} id={MARK_PAID_RESERVATION_FORM} mode="onBlur">
        <MarkAsPaidForm selectedBooking={selectedBooking} />
      </Form>
    </ModalRoot>
  );
};

export default MarkAsPaidBookingModal;
