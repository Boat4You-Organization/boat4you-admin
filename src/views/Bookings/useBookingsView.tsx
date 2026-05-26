import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { ListItemIcon, MenuItem, MenuList, Typography } from '@mui/material';

import Close from '@/components/SvgIcons/Close';
import Edit from '@/components/SvgIcons/Edit';
import Sync from '@/components/SvgIcons/Sync';
import colors from '@/styles/themes/colors';
import {
  clearSelectedBooking,
  findBooking,
  isBookingCancellable,
  isBookingEditable,
  toggleCancelBookingModal,
  toggleEditNotesModal,
  toggleSyncBookingModal,
} from '@/valtio/bookings/bookings.actions';

interface UseBookingsViewPayload {
  selectBooking: (event: React.MouseEvent<HTMLElement>) => void;
  closeBookingModal: () => void;
  renderRowActions: (index: number) => React.ReactElement | false;
}

const useBookingsView = (): UseBookingsViewPayload => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const selectBooking = (event: React.MouseEvent<HTMLElement>): void => {
    const {
      currentTarget: {
        dataset: { id },
      },
    } = event;

    if (!id) {
      return;
    }

    navigate(`/bookings/${id}?${searchParams.toString()}`);
  };

  const closeBookingModal = (): void => {
    clearSelectedBooking();
    navigate(`/bookings?${searchParams.toString()}`);
  };

  const handleSyncReservation = (e: React.MouseEvent<HTMLLIElement>): void => {
    const {
      currentTarget: {
        dataset: { index },
      },
    } = e;

    if (!index) {
      return;
    }

    findBooking(index);
    toggleSyncBookingModal(true);
  };

  const handleCancelReservation = (e: React.MouseEvent<HTMLLIElement>): void => {
    const {
      currentTarget: {
        dataset: { index },
      },
    } = e;

    if (!index) {
      return;
    }

    findBooking(index);
    toggleCancelBookingModal(true);
  };

  const handleEditNotes = (e: React.MouseEvent<HTMLLIElement>): void => {
    const {
      currentTarget: {
        dataset: { index },
      },
    } = e;

    if (!index) {
      return;
    }

    findBooking(index);
    toggleEditNotesModal(true);
  };

  const renderRowActions = (index: number): React.ReactElement | false => (
    <MenuList disablePadding sx={{ gap: 0.5 }}>
      <MenuItem data-index={index} onClick={handleEditNotes}>
        <ListItemIcon>
          <Edit size={20} fill={colors.blue300} />
        </ListItemIcon>
        <Typography variant="body2" color={colors.black950}>
          {t('actions.edit-notes')}
        </Typography>
      </MenuItem>
      <MenuItem data-index={index} onClick={handleSyncReservation}>
        <ListItemIcon>
          <Sync size={20} fill={colors.blue300} />
        </ListItemIcon>
        <Typography variant="body2" color={colors.black950}>
          {t('booking.sync-booking')}
        </Typography>
      </MenuItem>
      <MenuItem data-index={index} onClick={handleCancelReservation} disabled={!isBookingCancellable(index)}>
        <ListItemIcon>
          <Close size={20} fill={colors.red500} />
        </ListItemIcon>
        <Typography variant="body2" color={colors.black950}>
          {t('actions.cancelBooking')}
        </Typography>
      </MenuItem>
    </MenuList>
  );

  return {
    selectBooking,
    closeBookingModal,
    renderRowActions,
  };
};

export default useBookingsView;
