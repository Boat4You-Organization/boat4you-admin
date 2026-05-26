import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Typography } from '@mui/material';

import ModalRoot from '@/components/ModalRoot';
import UsersService from '@/services/users.service';
import { showToast } from '@/valtio/global/global.actions';
import { clearSelectedUser, getUsers } from '@/valtio/users/users.actions';
import { useUsersStore } from '@/valtio/users/users.store';
import useUsersView from '@/views/Users/useUsersView';

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeleteUserModal = ({ isOpen, onClose }: DeleteUserModalProps) => {
  const { selectedUser } = useUsersStore();
  const { closeUserModal } = useUsersView();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const refreshView = () => {
    const page = Number(searchParams.get('page'));

    getUsers(page);
  };

  const handleConfirm = async (): Promise<void> => {
    if (!selectedUser) {
      return;
    }

    const { payload, message } = await UsersService.deleteUser(selectedUser.id);

    showToast({
      status: payload ? 'success' : 'error',
      text: payload ? t('toast-messages.delete-user-successfully') : message || t('toast-messages.delete-user-failed'),
    });

    if (payload) {
      onClose();
      refreshView();
      closeUserModal();
    }
  };

  const handleClose = () => {
    onClose();
    clearSelectedUser();
    navigate(`/users?${searchParams.toString()}`);
  };

  return (
    <ModalRoot
      open={isOpen}
      onClose={handleClose}
      title={t('actions.deleteUser')}
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
            value: `${selectedUser?.name} ${selectedUser?.surname}`,
          }),
        }}
      />
    </ModalRoot>
  );
};

export default DeleteUserModal;
