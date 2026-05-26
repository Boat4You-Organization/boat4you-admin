import React from 'react';
import { useTranslation } from 'react-i18next';

import { Grid, Stack, Typography } from '@mui/material';

import colors from '@/styles/themes/colors';
import useBreakpoint from '@/utils/hooks/useBreakpoint';

interface ItemOption {
  label: string;
  value: string | number | null | undefined;
}

interface GridDisplayProps {
  columns: number;
  items: ItemOption[];
}

const GridDisplay: React.FC<GridDisplayProps> = ({ items, columns }) => {
  const { isMobile } = useBreakpoint();
  const { t } = useTranslation();

  return (
    <Grid container spacing={3}>
      {items.map((item, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <Grid key={index} container justifyContent="space-between" size={{ xs: isMobile ? 6 : 12 / columns }}>
          <Stack>
            <Typography variant="h4" fontWeight={700}>
              {t(item.label)}
            </Typography>
            <Typography variant="body1" color={colors.black} sx={{ wordBreak: 'break-word' }}>
              {item.value || '-'}
            </Typography>
          </Stack>
        </Grid>
      ))}
    </Grid>
  );
};

export default GridDisplay;
