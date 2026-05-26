import { Dispatch, SetStateAction, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Menu, SelectChangeEvent, Typography } from '@mui/material';

import Select from '@/components/Select';
import Filters from '@/components/SvgIcons/Filters';
import { USER_STATUS_ARRAY, USER_STATUS_LABEL_MAP, USER_STATUS_VALUES } from '@/models/user.model';
import colors from '@/styles/themes/colors';
import { SearchParams } from '@/utils/hooks/useQueryParams';

interface FilterContentProps {
  userStatus: string;
  setUserStatus: Dispatch<SetStateAction<string>>;
  handleParam: <K extends keyof SearchParams>(keyOrUpdates: K | Partial<SearchParams>, value?: SearchParams[K]) => void;
}

const FilterContent = ({ userStatus, setUserStatus, handleParam }: FilterContentProps) => {
  const { t } = useTranslation();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleUserStatusChange = (event: SelectChangeEvent<string>) => {
    setUserStatus(event.target.value);
    handleParam({
      userStatus: event.target.value === USER_STATUS_VALUES[0] ? '' : event.target.value,
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
              width: { xs: '100%', md: 300 },
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
        <Typography variant="body1" fontWeight={600}>
          {t('common.user-status')}
        </Typography>
        <Select
          value={userStatus}
          onChange={handleUserStatusChange}
          options={[
            { id: 'all', label: 'All' },
            ...USER_STATUS_ARRAY.map(status => ({
              id: status,
              label: t(USER_STATUS_LABEL_MAP[status]),
            })),
          ]}
          placeholder={t('common.user-status')}
        />
      </Menu>
    </>
  );
};

export default FilterContent;
