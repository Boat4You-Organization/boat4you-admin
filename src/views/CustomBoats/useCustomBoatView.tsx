import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { ListItemIcon, MenuItem, MenuList, Typography } from '@mui/material';

import Edit from '@/components/SvgIcons/Edit';
import Trash from '@/components/SvgIcons/Trash';
import colors from '@/styles/themes/colors';
import {
  clearSelectedCustomYacht,
  findCustomYacht,
  findCustomYachtById,
  toggleDeleteCustomYachtModal,
  toggleUpdateCustomYachtModal,
} from '@/valtio/customYachts/customYachts.actions';

interface UseCustomBoatViewPayload {
  selectCustomYacht: (event: React.MouseEvent<HTMLElement>) => void;
  closeCustomYachtModal: () => void;
  renderRowActions: (index: number) => React.ReactElement | false;
}

const useCustomBoatView = (): UseCustomBoatViewPayload => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const selectCustomYacht = async (event: React.MouseEvent<HTMLElement>) => {
    const {
      currentTarget: {
        dataset: { id },
      },
    } = event;

    if (!id) {
      return;
    }

    const selectedCustomYacht = findCustomYachtById(Number(id));

    if (!selectedCustomYacht) {
      return;
    }

    const { slug, countryId, countryName } = selectedCustomYacht;

    const externalUrl = `${import.meta.env.VITE_CUSTOMER_WEB_URL || 'http://localhost:3000'}/boat/${slug}?destinations=${encodeURI(countryName)}&did=${countryId}`;

    window.open(externalUrl, '_blank', 'noopener,noreferrer');
  };

  const closeCustomYachtModal = (): void => {
    clearSelectedCustomYacht();
    navigate(`/custom-boats?${searchParams.toString()}`);
  };

  const handleUpdateClick = (e: React.MouseEvent<HTMLLIElement>): void => {
    const {
      currentTarget: {
        dataset: { index },
      },
    } = e;

    if (!index) {
      return;
    }

    findCustomYacht(index);
    toggleUpdateCustomYachtModal(true);
  };

  const handleDeleteClick = (e: React.MouseEvent<HTMLLIElement>): void => {
    const {
      currentTarget: {
        dataset: { index },
      },
    } = e;

    if (!index) {
      return;
    }

    findCustomYacht(index);
    toggleDeleteCustomYachtModal(true);
  };

  const renderRowActions = (index: number): React.ReactElement | false => (
    <MenuList disablePadding sx={{ gap: 0.5 }}>
      <MenuItem data-index={index} onClick={handleUpdateClick}>
        <ListItemIcon>
          <Edit size={20} fill={colors.blue300} />
        </ListItemIcon>
        <Typography variant="body2" color={colors.black950}>
          {t('actions.edit')}
        </Typography>
      </MenuItem>
      <MenuItem data-index={index} onClick={handleDeleteClick}>
        <ListItemIcon>
          <Trash size={20} fill={colors.red500} />
        </ListItemIcon>
        <Typography variant="body2" color={colors.black950}>
          {t('actions.delete')}
        </Typography>
      </MenuItem>
    </MenuList>
  );

  return {
    selectCustomYacht,
    closeCustomYachtModal,
    renderRowActions,
  };
};

export default useCustomBoatView;
