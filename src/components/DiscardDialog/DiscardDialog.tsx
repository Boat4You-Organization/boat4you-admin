import { useTranslation } from 'react-i18next';

import { Typography } from '@mui/material';

import ModalRoot from '@/components/ModalRoot';
import colors from '@/styles/themes/colors';

interface DiscardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDiscard: () => void;
}

const DiscardDialog = ({ isOpen, onClose, onDiscard }: DiscardDialogProps) => {
  const { t } = useTranslation();

  const handleConfirm = () => {
    onClose();
    onDiscard();
  };

  return (
    <ModalRoot
      open={isOpen}
      onClose={onClose}
      title={t('actions.discard-changes')}
      confirmBtnText={t('actions.discard')}
      cancelBtnText={t('actions.cancel')}
      onConfirm={handleConfirm}
      onCancel={onClose}
      width={480}
    >
      <Typography variant="body1" color={colors.black}>
        {t('common.discard-changes-description')}
      </Typography>
    </ModalRoot>
  );
};

export default DiscardDialog;
