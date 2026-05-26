import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { ListItemIcon, MenuItem, MenuList, Typography } from '@mui/material';

import Edit from '@/components/SvgIcons/Edit';
import colors from '@/styles/themes/colors';
import { clearSelectedAgency, findAgency, toggleUpdateAgencyModal } from '@/valtio/agencies/agencies.actions';

interface UseAgenciesViewPayload {
  selectAgency: (event: React.MouseEvent<HTMLElement>) => void;
  closeAgencyModal: () => void;
  renderRowActions: (index: number) => React.ReactElement | false;
}

const useAgenciesView = (): UseAgenciesViewPayload => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const selectAgency = (event: React.MouseEvent<HTMLElement>): void => {
    const {
      currentTarget: {
        dataset: { id },
      },
    } = event;

    if (!id) {
      return;
    }

    navigate(`/agencies/${id}?${searchParams.toString()}`);
  };

  const closeAgencyModal = (): void => {
    clearSelectedAgency();
    navigate(`/agencies?${searchParams.toString()}`);
  };

  const handleUpdateAgency = (e: React.MouseEvent<HTMLLIElement>): void => {
    const {
      currentTarget: {
        dataset: { index },
      },
    } = e;

    if (!index) {
      return;
    }

    findAgency(index);
    toggleUpdateAgencyModal(true);
  };

  const renderRowActions = (index: number): React.ReactElement | false => (
    <MenuList disablePadding sx={{ gap: 0.5 }}>
      <MenuItem data-index={index} onClick={handleUpdateAgency}>
        <ListItemIcon>
          <Edit size={20} fill={colors.blue300} />
        </ListItemIcon>
        <Typography variant="body2" color={colors.black950}>
          {t('actions.edit')}
        </Typography>
      </MenuItem>
    </MenuList>
  );

  return {
    selectAgency,
    closeAgencyModal,
    renderRowActions,
  };
};

export default useAgenciesView;
