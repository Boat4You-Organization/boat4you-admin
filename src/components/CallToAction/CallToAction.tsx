import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Stack, Typography } from '@mui/material';

import Search from '@/components/Search';
import Plus from '@/components/SvgIcons/Plus';
import colors from '@/styles/themes/colors';

interface CallToActionProps {
  label: string;
  totalCount: number;
  searchString?: string;
  createLabel?: string;
  createCallback?: () => void;
  createIcon?: ReactNode;
  filterContent?: ReactNode;
  searchCallback?: (value: string) => void;
}

const CallToAction = ({
  label,
  totalCount,
  searchString,
  createLabel,
  createCallback,
  createIcon,
  filterContent,
  searchCallback,
}: CallToActionProps) => {
  const { t } = useTranslation();

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'start', md: 'center' }}
      mb={2}
    >
      <Stack
        direction="row"
        width="100%"
        justifyContent="space-between"
        spacing={1}
        alignItems={{ xs: 'start', md: 'center' }}
      >
        <Stack gap={0.5}>
          <Typography variant="h1" fontWeight={700}>
            {label}
          </Typography>
          <Typography variant="body1" color={colors.black500}>
            {totalCount > 1
              ? t('common.result_other', { count: totalCount })
              : t('common.result_one', { count: totalCount })}
          </Typography>
        </Stack>
        <Stack direction="row" gap={2}>
          {createCallback && (
            <Button startIcon={createIcon || <Plus size={24} />} size="large" onClick={createCallback}>
              {t(createLabel || 'actions.create')}
            </Button>
          )}
          <Stack direction="row" gap={2} sx={{ display: { xs: 'none', md: 'flex' } }}>
            {filterContent && filterContent}
            {searchString !== undefined && searchCallback && (
              <Search placeholder={t('actions.search')} onChange={searchCallback} value={searchString} />
            )}
          </Stack>
        </Stack>
      </Stack>
      <Stack
        mt={3}
        width="100%"
        direction="row"
        gap={2}
        justifyContent="space-between"
        sx={{ display: { xs: 'flex', md: 'none' } }}
      >
        {searchString !== undefined && searchCallback && (
          <Search placeholder={t('actions.search')} fullWidth onChange={searchCallback} value={searchString} />
        )}
        {filterContent && filterContent}
      </Stack>
    </Stack>
  );
};

export default CallToAction;
