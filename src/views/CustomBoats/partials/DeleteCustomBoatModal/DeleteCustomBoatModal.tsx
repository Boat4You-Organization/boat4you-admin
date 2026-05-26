import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Typography } from '@mui/material';

import ModalRoot from '@/components/ModalRoot';
import CustomYachtService from '@/services/custom-yacht.service';
import { clearSelectedCustomYacht, getCustomYachts } from '@/valtio/customYachts/customYachts.actions';
import { useCustomYachtsStore } from '@/valtio/customYachts/customYachts.store';
import { showToast } from '@/valtio/global/global.actions';
import useCustomBoatView from '@/views/CustomBoats/useCustomBoatView';

interface DeleteCustomBoatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeleteCustomBoatModal = ({ isOpen, onClose }: DeleteCustomBoatModalProps) => {
  const { selectedCustomYacht } = useCustomYachtsStore();
  const { closeCustomYachtModal } = useCustomBoatView();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const refreshView = () => {
    const page = Number(searchParams.get('page'));

    getCustomYachts(page);
  };

  const handleConfirm = async (): Promise<void> => {
    if (!selectedCustomYacht) {
      return;
    }

    const { payload, message } = await CustomYachtService.deleteCustomYacht(selectedCustomYacht.id);

    showToast({
      status: payload ? 'success' : 'error',
      text: payload
        ? t('toast-messages.delete-custom-boat-successfully')
        : message || t('toast-messages.delete-custom-boat-failed'),
    });

    if (payload) {
      onClose();
      refreshView();
      closeCustomYachtModal();
    }
  };

  const handleClose = () => {
    onClose();
    clearSelectedCustomYacht();
    navigate(`/custom-boats?${searchParams.toString()}`);
  };

  return (
    <ModalRoot
      open={isOpen}
      onClose={handleClose}
      title={t('actions.delete-custom-boat')}
      confirmBtnText={t('actions.delete')}
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
    >
      <Typography
        variant="body1"
        dangerouslySetInnerHTML={{
          __html: t('common.delete-confirmation-text-bulk', {
            value: `${selectedCustomYacht?.name}`,
          }),
        }}
      />
    </ModalRoot>
  );
};

export default DeleteCustomBoatModal;
