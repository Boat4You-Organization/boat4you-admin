import { Dispatch, SetStateAction, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Menu, SelectChangeEvent, Typography } from '@mui/material';

import Select from '@/components/Select';
import Filters from '@/components/SvgIcons/Filters';
import { INQUIRIES_STATUS_ARRAY, INQUIRIES_STATUS_LABEL_MAP, InquiriesStatus } from '@/models/inquiries.model';
import colors from '@/styles/themes/colors';
import { SearchParams } from '@/utils/hooks/useQueryParams';

interface StatusFilterProps {
  inquiryStatus: string;
  setInquiryStatus: Dispatch<SetStateAction<string>>;
  handleParam: <K extends keyof SearchParams>(keyOrUpdates: K | Partial<SearchParams>, value?: SearchParams[K]) => void;
}

const StatusFilter = ({ inquiryStatus, setInquiryStatus, handleParam }: StatusFilterProps) => {
  const { t } = useTranslation();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const { value } = event.target;
    const newStatus = value ? (value as InquiriesStatus) : 'all';

    setInquiryStatus(newStatus);
    handleParam({
      inquiryStatus: newStatus === INQUIRIES_STATUS_ARRAY[0] ? '' : newStatus,
      page: 1,
    });
    handleClose();
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
          {t('common.inquiries-status')}
        </Typography>
        <Select
          value={inquiryStatus}
          onChange={handleSelectChange}
          options={INQUIRIES_STATUS_ARRAY.map(inquiry => ({
            id: inquiry,
            label: t(INQUIRIES_STATUS_LABEL_MAP[inquiry]),
          }))}
          placeholder={t('common.inquiries-status')}
        />
      </Menu>
    </>
  );
};

export default StatusFilter;
