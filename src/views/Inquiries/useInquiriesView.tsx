import React, { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { ListItemIcon, MenuItem, MenuList, Typography } from '@mui/material';

import Mail from '@/components/SvgIcons/Mail';
import Sync from '@/components/SvgIcons/Sync';
import colors from '@/styles/themes/colors';
import { findInquiry, toggleChangeInquiryStatusModal } from '@/valtio/inquiries/inquiries.actions';
import { inquiriesStore } from '@/valtio/inquiries/inquiries.store';

interface UseInquiriesViewPayload {
  selectInquiry: (event: React.MouseEvent<HTMLElement>) => void;
  renderRowActions: (index: number) => React.ReactElement | false;
}

const useInquiriesView = (): UseInquiriesViewPayload => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const selectInquiry = (event: React.MouseEvent<HTMLElement>): void => {
    const {
      currentTarget: {
        dataset: { id },
      },
    } = event;

    if (!id) {
      return;
    }

    navigate(`/inquiries/${id}?${searchParams.toString()}`);
  };

  const handleSendOffer = (e: React.MouseEvent<HTMLLIElement>): void => {
    const {
      currentTarget: {
        dataset: { index },
      },
    } = e;

    if (!index) {
      return;
    }

    const { id, yachtId } = inquiriesStore.inquiries[+index];

    const externalUrl = `${import.meta.env.VITE_CUSTOMER_WEB_URL || 'http://localhost:3000'}/search?yid=${yachtId}&inquiryId=${id}`;

    window.open(externalUrl, '_blank', 'noopener,noreferrer');
  };

  const handleChangeStatus = (e: React.MouseEvent<HTMLLIElement>): void => {
    const {
      currentTarget: {
        dataset: { index },
      },
    } = e;

    if (!index) {
      return;
    }

    findInquiry(index);
    toggleChangeInquiryStatusModal(true);
  };

  const renderRowActions = (index: number): React.ReactElement | false => (
    <MenuList disablePadding sx={{ gap: 0.5 }}>
      <MenuItem data-index={index} onClick={handleSendOffer}>
        <ListItemIcon>
          <Mail size={20} fill={colors.blue300} />
        </ListItemIcon>
        <Typography variant="body2" color={colors.black950}>
          {t('actions.sendOffer')}
        </Typography>
      </MenuItem>
      <MenuItem data-index={index} onClick={handleChangeStatus}>
        <ListItemIcon>
          <Sync size={20} fill={colors.blue300} />
        </ListItemIcon>
        <Typography variant="body2" color={colors.black950}>
          {t('actions.changeStatus')}
        </Typography>
      </MenuItem>
    </MenuList>
  );

  return {
    selectInquiry,
    renderRowActions,
  };
};

export default useInquiriesView;
