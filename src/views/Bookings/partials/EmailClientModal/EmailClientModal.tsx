import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Stack, TextField, Typography } from '@mui/material';

import ModalRoot from '@/components/ModalRoot';
import { ReservationModel } from '@/models/booking.model';
import ReservationsService from '@/services/reservations.service';
import useBreakpoint from '@/utils/hooks/useBreakpoint';
import { showToast } from '@/valtio/global/global.actions';

interface EmailClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: ReservationModel;
}

/* Broker answers the client straight from the booking page (Mario 20.7.2026:
 * special request arrived before payment). The mail goes out from
 * info@boat4you.com with the reservation card; the team mailbox gets a copy. */
const EmailClientModal = ({ isOpen, onClose, booking }: EmailClientModalProps) => {
  const { t } = useTranslation();
  const { isMobile } = useBreakpoint();

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Re-seed on every open so a previous booking's draft never leaks in.
  useEffect(() => {
    if (isOpen) {
      const ref = booking.reservationNumber ?? String(booking.reservationId);

      setSubject(`Your boat4you reservation ${ref}`);
      setMessage(`Dear ${booking.endUser},\n\n`);
    }
  }, [isOpen, booking.reservationId, booking.reservationNumber, booking.endUser]);

  const handleSend = async () => {
    if (isSending || !message.trim()) {
      return;
    }

    setIsSending(true);

    const { payload, message: errorMessage } = await ReservationsService.emailClient(
      booking.reservationId,
      subject.trim(),
      message.trim()
    );

    setIsSending(false);

    showToast({
      status: payload ? 'success' : 'error',
      text: payload
        ? t('booking.email-client-sent', 'Email sent to the client (copy in info@boat4you.com).')
        : errorMessage || t('booking.email-client-failed', 'Sending failed — please try again.'),
    });

    if (payload) {
      onClose();
    }
  };

  return (
    <ModalRoot
      open={isOpen}
      fullScreen={isMobile}
      onClose={onClose}
      title={t('booking.email-client-title', 'Email the client')}
      cancelBtnText={t('actions.cancel')}
      onCancel={onClose}
      confirmBtnText={t('booking.email-client-send', 'Send email')}
      onConfirm={handleSend}
      zIndex={1400}
      width={560}
      ConfirmBtnProps={{ disabled: isSending || !message.trim() }}
    >
      <Stack gap={1.5}>
        <Typography variant="body2" color="text.secondary">
          {t('booking.email-client-hint', 'Sent from info@boat4you.com to')} {booking.endUserEmail}.{' '}
          {t(
            'booking.email-client-hint2',
            'The email includes the reservation details card; a copy lands in info@boat4you.com.'
          )}
        </Typography>
        <TextField
          fullWidth
          label={t('booking.email-client-subject', 'Subject')}
          value={subject}
          onChange={e => setSubject(e.target.value)}
        />
        <TextField
          multiline
          minRows={8}
          maxRows={16}
          fullWidth
          label={t('booking.email-client-message', 'Message')}
          value={message}
          onChange={e => setMessage(e.target.value)}
          autoFocus
        />
      </Stack>
    </ModalRoot>
  );
};

export default EmailClientModal;
