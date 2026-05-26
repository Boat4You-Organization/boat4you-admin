import { useTranslation } from 'react-i18next';

import { Stack, Typography } from '@mui/material';

import GridDisplay from '@/components/GridDisplay';
import ModalRoot from '@/components/ModalRoot';
import { People } from '@/components/SvgIcons/BoatFeatures';
import { USER_ROLE_NAME_LABEL_MAP } from '@/models/user.model';
import useBreakpoint from '@/utils/hooks/useBreakpoint';
import { useUsersStore } from '@/valtio/users/users.store';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

const UserModal = ({ isOpen, onClose, onCancel, onConfirm }: UserModalProps) => {
  const { selectedUser } = useUsersStore();
  const { name, surname, email, phoneNumber, roles } = selectedUser || {};
  const { isMobile } = useBreakpoint();
  const { t } = useTranslation();

  return (
    <ModalRoot
      open={isOpen}
      fullScreen={isMobile}
      onClose={onClose}
      title={`${selectedUser?.name} ${selectedUser?.surname}`}
      cancelBtnText={t('actions.delete')}
      onCancel={onCancel}
      confirmBtnText={t('actions.edit')}
      onConfirm={onConfirm}
    >
      <Stack sx={{ minWidth: { xs: 'auto', md: 670 } }}>
        <Stack direction="row" alignItems="center" gap={1} pb={3}>
          <People size={32} variant="secondary" />
          <Typography variant="h3" fontWeight={700}>
            {t('common.general-info')}
          </Typography>
        </Stack>
        <GridDisplay
          columns={2}
          items={[
            { label: 'form.user.user-name', value: name },
            { label: 'form.user.surname', value: surname },
            { label: 'form.user.email', value: email },
            { label: 'form.user.phone', value: phoneNumber },
            { label: 'form.user.role', value: roles?.length && t(USER_ROLE_NAME_LABEL_MAP[roles[0].roleName]) },
          ]}
        />
      </Stack>
    </ModalRoot>
  );
};

export default UserModal;
