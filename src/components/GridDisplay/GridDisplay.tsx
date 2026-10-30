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
    <Grid container spacing={2}>
      {items.map((item, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <Grid key={index} container justifyContent="space-between" size={{ xs: isMobile ? 6 : 12 / columns }}>
          <Stack>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: colors.black600 }}>{t(item.label)}</Typography>
            <Typography sx={{ fontSize: 13.5, fontWeight: 500, color: colors.black, wordBreak: 'break-word' }}>
              {item.value || '-'}
            </Typography>
          </Stack>
        </Grid>
      ))}
    </Grid>
  );
};

export default GridDisplay;
