import React, { Dispatch, SetStateAction, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Menu, SelectChangeEvent, Stack, Typography } from '@mui/material';
import { Dayjs } from 'dayjs';

import DatePicker from '@/components/DatePicker';
import Select from '@/components/Select';
import Filters from '@/components/SvgIcons/Filters';
import { RECIPIENT_TYPE_ARRAY, RECIPIENT_TYPE_ARRAY_VALUES, RECIPIENT_TYPE_LABEL_MAP } from '@/models/invoices.model';
import colors from '@/styles/themes/colors';
import { SearchParams } from '@/utils/hooks/useQueryParams';
import DateTime from '@/utils/static/DateTime';

import AgencyAutocomplete from './AgencyAutocomplete/AgencyAutocomplete';
import ReservationAutocomplete from './ReservationAutocomplete';

interface FilterMenuProps {
  reservation: string;
  recipientType: string;
  departureDate: Dayjs | null;
  agency: string;
  setReservation: Dispatch<SetStateAction<string>>;
  setRecipientType: Dispatch<SetStateAction<string>>;
  setDepartureDate: Dispatch<SetStateAction<Dayjs | null>>;
  setAgency: Dispatch<SetStateAction<string>>;
  handleParam: <K extends keyof SearchParams>(keyOrUpdates: K | Partial<SearchParams>, value?: SearchParams[K]) => void;
}

const FilterMenu = ({
  reservation,
  recipientType,
  departureDate,
  agency,
  setReservation,
  setRecipientType,
  setDepartureDate,
  setAgency,
  handleParam,
}: FilterMenuProps) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleReservationSelectChange = (value: string) => {
    setReservation(value);
    handleParam({
      invoiceReservation: value,
      page: 1,
    });
  };

  const handleRecipientTypeSelectChange = (event: SelectChangeEvent<string>) => {
    const { value } = event.target;
    const newRecipientType = value || 'all';

    setRecipientType(newRecipientType);
    handleParam({
      recipientType: newRecipientType === RECIPIENT_TYPE_ARRAY_VALUES[0] ? '' : newRecipientType,
      page: 1,
    });
    handleClose();
  };

  const handleDepartureDateSelectChange = (value: Dayjs | null) => {
    setDepartureDate(value);
    handleParam({
      departureDate: value ? DateTime.formatFull(value) : '',
      page: 1,
    });
  };

  const handleAgencySelectChange = (value: string) => {
    setAgency(value);
    handleParam({
      invoiceAgency: value,
      page: 1,
    });
  };

  return (
    <>
      <Button
        id="filter-button"
        aria-controls={open ? 'filter-button' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        color="secondary"
        startIcon={<Filters size={20} />}
        size="large"
        onClick={handleClick}
      >
        {t('actions.filter')}
      </Button>
      <Menu
        id="filter-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', md: 'fit-content' },
              background: colors.white,
              boxShadow: '0px 4px 17px 0px rgba(0, 0, 0, 0.10)',
              padding: 1.5,
            },
          },
          list: {
            sx: {
              padding: 0,
              gap: 1,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        sx={{
          marginTop: '12px',
        }}
      >
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} flexWrap="wrap">
          <Stack minWidth={{ xs: 'fit-content', md: 280 }} flex={1}>
            <ReservationAutocomplete
              value={reservation}
              onChange={handleReservationSelectChange}
              label={t('common.reservation')}
              placeholder={t('common.reservation')}
            />
          </Stack>
          <Stack minWidth={{ xs: 'fit-content', md: 208 }} flex={1}>
            <Typography variant="body1" fontWeight={600} mb={1}>
              {t('common.recipientType')}
            </Typography>
            <Select
              value={recipientType}
              onChange={handleRecipientTypeSelectChange}
              options={[
                { id: 'all', label: 'All' },
                ...RECIPIENT_TYPE_ARRAY.map(recipient => ({
                  id: recipient,
                  label: t(RECIPIENT_TYPE_LABEL_MAP[recipient]),
                })),
              ]}
              placeholder={t('common.recipientType')}
            />
          </Stack>
          <Stack minWidth={{ xs: 'fit-content', md: 260 }} flex={1}>
            <DatePicker
              value={departureDate}
              label={t('common.departureDate')}
              onChange={handleDepartureDateSelectChange}
            />
          </Stack>
          <Stack minWidth={{ xs: 'fit-content', md: 280 }} flex={1}>
            <AgencyAutocomplete
              value={agency}
              onChange={handleAgencySelectChange}
              label={t('common.agency')}
              placeholder={t('common.agency')}
            />
          </Stack>
        </Stack>
      </Menu>
    </>
  );
};

export default FilterMenu;
