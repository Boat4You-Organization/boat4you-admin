import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

import { Stack, TextField, Typography } from '@mui/material';

import ModalRoot from '@/components/ModalRoot';
import ReservationsService from '@/services/reservations.service';
import useBreakpoint from '@/utils/hooks/useBreakpoint';
import { getBookings, getSelectedBooking } from '@/valtio/bookings/bookings.actions';
import { useBookingsStore } from '@/valtio/bookings/bookings.store';
import { showToast } from '@/valtio/global/global.actions';
import useBookingsView from '@/views/Bookings/useBookingsView';

interface EditNotesModalProps {
  isSinglePage?: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const EditNotesModal = ({ isSinglePage = false, isOpen, onClose }: EditNotesModalProps) => {
  const { selectedBooking } = useBookingsStore();
  const { closeBookingModal } = useBookingsView();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { isMobile } = useBreakpoint();

  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Seed textarea from the currently selected booking each time the modal
  // opens, so we never show stale text from a previous booking.
  useEffect(() => {
    if (isOpen) {
      setNotes(selectedBooking?.adminNotes ?? '');
    }
  }, [isOpen, selectedBooking?.reservationId, selectedBooking?.adminNotes]);

  const refreshView = () => {
    if (isSinglePage) {
      if (selectedBooking?.reservationId != null) {
        getSelectedBooking(Number(selectedBooking.reservationId));
      }

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

  const handleSave = async () => {
    if (!selectedBooking) {
      return;
    }

    setIsSaving(true);

    const { payload, message } = await ReservationsService.updateAdminNotes(
      selectedBooking.reservationId,
      notes.trim()
    );

    setIsSaving(false);

    showToast({
      status: payload ? 'success' : 'error',
      text: payload
        ? t('toast-messages.save-notes-successfully')
        : message || t('toast-messages.save-notes-failed'),
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
      title={t('actions.edit-notes')}
      cancelBtnText={t('actions.cancel')}
      onCancel={handleClose}
      confirmBtnText={t('actions.save')}
      onConfirm={handleSave}
      zIndex={1400}
      width={540}
      ConfirmBtnProps={{ disabled: isSaving }}
    >
      <Stack gap={1.5}>
        <Typography variant="body2" color="text.secondary">
          {t('booking.admin-notes-hint')}
        </Typography>
        <TextField
          multiline
          minRows={6}
          maxRows={14}
          fullWidth
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder={t('booking.admin-notes-placeholder')}
          autoFocus
        />
      </Stack>
    </ModalRoot>
  );
};

export default EditNotesModal;
