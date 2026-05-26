import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { ListItemIcon, MenuItem, MenuList, Typography } from '@mui/material';

import Close from '@/components/SvgIcons/Close';
import Edit from '@/components/SvgIcons/Edit';
import colors from '@/styles/themes/colors';
import {
  clearSelectedUser,
  findUser,
  toggleDeleteUserModal,
  toggleUpdateUserModal,
} from '@/valtio/users/users.actions';

interface UseUsersViewPayload {
  selectUser: (event: React.MouseEvent<HTMLElement>) => void;
  closeUserModal: () => void;
  renderRowActions: (index: number) => React.ReactElement | false;
}

const useUsersView = (): UseUsersViewPayload => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const selectUser = (event: React.MouseEvent<HTMLElement>): void => {
    const {
      currentTarget: {
        dataset: { id },
      },
    } = event;

    if (!id) {
      return;
    }

    navigate(`/users/${id}?${searchParams.toString()}`);
  };

  const closeUserModal = (): void => {
    clearSelectedUser();
    navigate(`/users?${searchParams.toString()}`);
  };

  const handleUpdateUser = (e: React.MouseEvent<HTMLLIElement>): void => {
    const {
      currentTarget: {
        dataset: { index },
      },
    } = e;

    if (!index) {
      return;
    }

    findUser(index);
    toggleUpdateUserModal(true);
  };

  const handleDeleteUser = (e: React.MouseEvent<HTMLLIElement>): void => {
    const {
      currentTarget: {
        dataset: { index },
      },
    } = e;

    if (!index) {
      return;
    }

    findUser(index);
    toggleDeleteUserModal(true);
  };

  const renderRowActions = (index: number): React.ReactElement | false => (
    <MenuList disablePadding sx={{ gap: 0.5 }}>
      <MenuItem data-index={index} onClick={handleUpdateUser}>
        <ListItemIcon>
          <Edit size={20} fill={colors.blue300} />
        </ListItemIcon>
        <Typography variant="body2" color={colors.black950}>
          {t('actions.editUser')}
        </Typography>
      </MenuItem>
      <MenuItem data-index={index} onClick={handleDeleteUser}>
        <ListItemIcon>
          <Close size={20} fill={colors.red500} />
        </ListItemIcon>
        <Typography variant="body2" color={colors.black950}>
          {t('actions.deleteUser')}
        </Typography>
      </MenuItem>
    </MenuList>
  );

  return {
    selectUser,
    closeUserModal,
    renderRowActions,
  };
};

export default useUsersView;
