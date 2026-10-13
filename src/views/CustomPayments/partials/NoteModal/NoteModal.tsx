import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Stack } from '@mui/material';

import Form from '@/components/Forms/Form';
import FormInput from '@/components/Forms/FormInput';
import ModalRoot from '@/components/ModalRoot';
import CustomPaymentsService from '@/services/custom-payments.service';
import useBreakpoint from '@/utils/hooks/useBreakpoint';
import { setCustomPaymentNote } from '@/valtio/customPayments/customPayments.actions';
import { useCustomPaymentsStore } from '@/valtio/customPayments/customPayments.store';
import { showToast } from '@/valtio/global/global.actions';

const NOTE_FORM = 'custom-payment-note-form';

// custom_payment.admin_note is capped at 2000 characters in the database.
const NOTE_MAX_LENGTH = 2000;

interface NoteFormValues {
  note: string;
}

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NoteModal = ({ isOpen, onClose }: NoteModalProps) => {
  const { t } = useTranslation();
  const { t: tp } = useTranslation('custom-payments');
  const { isMobile } = useBreakpoint();
  const { selectedCustomPayment } = useCustomPaymentsStore();
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async ({ note }: NoteFormValues): Promise<void> => {
    if (!selectedCustomPayment) return;

    const value = note.trim();

    setIsSaving(true);

    const { payload, message } = await CustomPaymentsService.updateNote(selectedCustomPayment.id, value);

    setIsSaving(false);

    showToast({
      status: payload ? 'success' : 'error',
      text: payload ? tp('noteSaved') : message || tp('noteFailed'),
    });

    if (payload) {
      setCustomPaymentNote(selectedCustomPayment.id, value || null);
      onClose();
    }
  };

  return (
    <ModalRoot
      open={isOpen}
      fullScreen={isMobile}
      onClose={onClose}
      title={selectedCustomPayment ? `${tp('editNote')} · ${selectedCustomPayment.reference}` : tp('editNote')}
      onCancel={onClose}
      confirmBtnText={t('actions.save')}
      cancelBtnText={t('actions.cancel')}
      width={540}
      ConfirmBtnProps={{ form: NOTE_FORM, type: 'submit', disabled: isSaving }}
    >
      <Form
        key={selectedCustomPayment?.id}
        defaultValues={{ note: selectedCustomPayment?.adminNote ?? '' }}
        onSubmit={handleSubmit}
        id={NOTE_FORM}
      >
        <Stack sx={{ minWidth: { xs: 'auto', md: 480 } }}>
          <FormInput
            name="note"
            multiline
            minRows={6}
            maxRows={14}
            fullWidth
            autoFocus
            placeholder={tp('notePlaceholder')}
            slotProps={{ htmlInput: { maxLength: NOTE_MAX_LENGTH } }}
          />
        </Stack>
      </Form>
    </ModalRoot>
  );
};

export default NoteModal;
