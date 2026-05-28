import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Alert, Button, Stack, TextField, Typography } from '@mui/material';

import ModalRoot from '@/components/ModalRoot';
import ReservationsService from '@/services/reservations.service';
import { reloadSelectedBooking } from '@/valtio/bookings/bookings.actions';
import { useBookingsStore } from '@/valtio/bookings/bookings.store';
import { showToast } from '@/valtio/global/global.actions';

interface CancellationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** True when this modal is rendered from the standalone booking detail
   *  page; controls navigation/refresh behaviour after submit. False on
   *  the bookings-list page where a list refresh is expected. */
  isSinglePage?: boolean;
}

/**
 * Unified admin modal for resolving a customer cancellation request:
 * either reject it (booking stays active, customer notified) or confirm
 * the cancellation (booking → CANCELLED, customer notified). One textarea
 * for the explanation, used either as the rejection reason or as the
 * agent's confirmation note depending on which button the admin clicks.
 *
 * Replaces two separate buttons ("Reject cancellation request" + "Cancel
 * booking") on the booking detail page when a customer has actually filed
 * a request — too many destructive buttons in the same column was hard to
 * read. Admin-initiated cancellations (no customer request) still go
 * through the standalone CancelBookingModal.
 */
const CancellationRequestModal = ({
  isOpen,
  onClose,
  isSinglePage = false,
}: CancellationRequestModalProps) => {
  const { selectedBooking } = useBookingsStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset textarea each time the modal is opened so a stale draft from a
  // previous session doesn't carry over.
  useEffect(() => {
    if (isOpen) setReason('');
  }, [isOpen]);

  const customerReason = selectedBooking?.cancellationRequest?.replace(/^\[(AGENT|ADMIN)\]\s*/, '') ?? '';

  const requireReason = (): boolean => {
    const trimmed = reason.trim();

    if (trimmed.length === 0) {
      showToast({
        status: 'warning',
        text: t(
          'booking.cancellation-request-reason-required',
          'Please add an explanation — the customer sees this verbatim in their email.',
        ),
      });
      
return false;
    }

    
return true;
  };

  const afterMutation = (success: boolean, successText: string, failText: string, message?: string) => {
    showToast({
      status: success ? 'success' : 'error',
      text: success ? successText : message || failText,
    });

    if (success) {
      onClose();
      // eslint-disable-next-line no-void
      void reloadSelectedBooking();

      // List view callers also pull a fresh page so the row's status pill
      // updates without a full reload. SinglePage owners reload through
      // `reloadSelectedBooking` above and don't need a navigate.
      if (!isSinglePage) {
        navigate(`/bookings?${searchParams.toString()}`);
      }
    }
  };

  const handleReject = async () => {
    if (!selectedBooking || submitting) return;

    if (!requireReason()) return;

    setSubmitting(true);

    const { payload, message } = await ReservationsService.rejectCancellationRequest(
      selectedBooking.reservationId,
      reason.trim(),
    );

    setSubmitting(false);
    afterMutation(
      payload,
      t(
        'booking.cancellation-rejected-success',
        'Cancellation request rejected. The customer has been notified by email.',
      ),
      t('booking.cancellation-rejected-failed', 'Could not reject the cancellation. Try again.'),
      message,
    );
  };

  const handleConfirm = async () => {
    if (!selectedBooking || submitting) return;

    if (!requireReason()) return;

    setSubmitting(true);

    const { payload, message } = await ReservationsService.deleteReservation(
      selectedBooking.reservationId,
      reason.trim(),
    );

    setSubmitting(false);
    afterMutation(
      payload,
      t(
        'booking.cancellation-confirmed-success',
        'Booking cancelled. The customer has been notified by email.',
      ),
      t('booking.cancellation-confirmed-failed', 'Could not confirm the cancellation. Try again.'),
      message,
    );
  };

  return (
    <ModalRoot
      open={isOpen}
      onClose={onClose}
      title={t('booking.cancellation-request', 'Cancellation request')}
      width={560}
      // Hide ModalRoot's default Confirm/Cancel pair — we render 3 custom
      // buttons inside the body so admin sees Reject / Confirm / Close
      // side-by-side instead of stacked.
      hideConfirmButton
      hideCancelButton
      zIndex={1400}
    >
      <Stack spacing={2}>
        <Alert severity="info">
          {t(
            'booking.cancellation-request-explanation',
            'The customer asked to cancel this booking. Choose: Reject (booking stays active) or Confirm cancellation (booking → CANCELLED). Your explanation goes to the customer in either case.',
          )}
        </Alert>

        {customerReason && (
          <Stack spacing={0.5}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {t('booking.customer-reason', "Customer's reason")}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ whiteSpace: 'pre-wrap', backgroundColor: '#f6f7f9', p: 1.5, borderRadius: 1 }}
            >
              {customerReason}
            </Typography>
          </Stack>
        )}

        <TextField
          autoFocus
          label={t('booking.your-explanation', 'Your explanation (shown to the customer)')}
          placeholder={
            t(
              'booking.cancellation-request-placeholder',
              'e.g. The charter agency does not allow cancellation under their policy.\n— or —\nApproved. Refund will be processed within 5–7 working days.',
            ) as string
          }
          multiline
          minRows={4}
          fullWidth
          value={reason}
          onChange={e => setReason(e.target.value)}
          disabled={submitting}
          helperText={t(
            'booking.cancellation-request-help',
            'Required. Same field is used for both Reject and Confirm — the customer reads it verbatim in their email.',
          )}
        />

        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ pt: 1 }}>
          <Button onClick={onClose} disabled={submitting} color="info" variant="text">
            {t('actions.close', 'Close')}
          </Button>
          <Button
            onClick={handleReject}
            disabled={submitting}
            color="warning"
            variant="outlined"
            sx={{ fontWeight: 700, textTransform: 'none' }}
          >
            {submitting
              ? t('actions.submitting', 'Submitting…')
              : t('booking.cancellation-reject', 'Reject')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={submitting}
            color="error"
            variant="contained"
            sx={{ fontWeight: 700, textTransform: 'none' }}
          >
            {submitting
              ? t('actions.submitting', 'Submitting…')
              : t('booking.cancellation-confirm', 'Confirm cancellation')}
          </Button>
        </Stack>
      </Stack>
    </ModalRoot>
  );
};

export default CancellationRequestModal;
