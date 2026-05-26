import React, { Dispatch, SetStateAction, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Menu, Stack } from '@mui/material';
import { Dayjs } from 'dayjs';

import Filters from '@/components/SvgIcons/Filters';
import colors from '@/styles/themes/colors';
import { SearchParams } from '@/utils/hooks/useQueryParams';
import DateTime from '@/utils/static/DateTime';

import DateRange from './DateRange';
import UserAutocomplete from './UserAutocomplete';

interface DateRangeValue {
  startDate: Dayjs | null;
  endDate: Dayjs | null;
}

interface FilterMenuProps {
  customer: string;
  dateRange: [Dayjs | null, Dayjs | null];
  setCustomer: Dispatch<SetStateAction<string>>;
  setDateRange: Dispatch<SetStateAction<[Dayjs | null, Dayjs | null]>>;
  handleParam: <K extends keyof SearchParams>(keyOrUpdates: K | Partial<SearchParams>, value?: SearchParams[K]) => void;
}

const FilterMenu = ({ customer, dateRange, setCustomer, setDateRange, handleParam }: FilterMenuProps) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCustomerSelectChange = (value: string) => {
    setCustomer(value);
    handleParam({
      customer: value,
      page: 1,
    });
  };

  const handleDateSelectChange = (dateRangeValue: DateRangeValue) => {
    const newDateRange: [Dayjs | null, Dayjs | null] = [dateRangeValue.startDate, dateRangeValue.endDate];

    setDateRange(newDateRange);
    handleParam({
      startDate: newDateRange[0] ? DateTime.formatFull(newDateRange[0]) : '',
      endDate: newDateRange[1] ? DateTime.formatFull(newDateRange[1]) : '',
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
            <UserAutocomplete
              value={customer}
              onChange={handleCustomerSelectChange}
              label={t('common.customer')}
              placeholder={t('common.customer')}
            />
          </Stack>
          <Stack minWidth={{ xs: '50%', md: 280 }} flex={1}>
            <DateRange
              startDate={dateRange[0]}
              endDate={dateRange[1]}
              handleDateRange={handleDateSelectChange}
              formLabel={t('common.dateRange')}
            />
          </Stack>
        </Stack>
      </Menu>
    </>
  );
};

export default FilterMenu;
