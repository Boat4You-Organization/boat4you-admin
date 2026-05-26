import { Dispatch, SetStateAction, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Menu, SelectChangeEvent, Stack, Typography } from '@mui/material';

import Select from '@/components/Select';
import Filters from '@/components/SvgIcons/Filters';
import { COUNTRY_ARRAY, COUNTRY_NAME_MAP } from '@/config/countries.config';
import { AGENCY_PRIMARY_SOURCE_ARRAY, AGENCY_PRIMARY_SOURCE_LABEL_MAP } from '@/models/agencies.model';
import colors from '@/styles/themes/colors';
import { SearchParams } from '@/utils/hooks/useQueryParams';

interface FilterMenuProps {
  country: string;
  source: string;
  setCountry: Dispatch<SetStateAction<string>>;
  setSource: Dispatch<SetStateAction<string>>;
  handleParam: <K extends keyof SearchParams>(keyOrUpdates: K | Partial<SearchParams>, value?: SearchParams[K]) => void;
}

const FilterMenu = ({ country, source, setCountry, setSource, handleParam }: FilterMenuProps) => {
  const { t } = useTranslation();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCountrySelectChange = (event: SelectChangeEvent<string>) => {
    const { value } = event.target;
    const newCountry = value || 'all';

    setCountry(newCountry);
    handleParam({
      country: newCountry === 'all' ? '' : newCountry,
      page: 1,
    });
    handleClose();
  };

  const handleSourceSelectChange = (event: SelectChangeEvent<string>) => {
    const { value } = event.target;
    const newSource = value || 'all';

    setSource(newSource);
    handleParam({
      source: newSource === 'all' ? '' : newSource,
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
          <Stack minWidth={{ xs: 'fit-content', md: 202 }} flex={1}>
            <Typography variant="body1" fontWeight={600} mb={1}>
              {t('common.country')}
            </Typography>
            <Select
              value={country}
              onChange={handleCountrySelectChange}
              options={[
                { id: 'all', label: 'All' },
                ...COUNTRY_ARRAY.map(countryCode => ({
                  id: countryCode,
                  label: COUNTRY_NAME_MAP[countryCode],
                })),
              ]}
              placeholder={t('common.country')}
            />
          </Stack>
          <Stack minWidth={{ xs: 'fit-content', md: 202 }} flex={1}>
            <Typography variant="body1" fontWeight={600} mb={1}>
              {t('common.primary-source')}
            </Typography>
            <Select
              value={source}
              onChange={handleSourceSelectChange}
              options={[
                { id: 'all', label: 'All' },
                ...AGENCY_PRIMARY_SOURCE_ARRAY.map(status => ({
                  id: status,
                  label: t(AGENCY_PRIMARY_SOURCE_LABEL_MAP[status]),
                })),
              ]}
              placeholder={t('common.primary-source')}
            />
          </Stack>
        </Stack>
      </Menu>
    </>
  );
};

export default FilterMenu;
