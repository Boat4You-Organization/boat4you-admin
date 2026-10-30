import { ElementType, ReactNode, isValidElement } from 'react';

import { Box, Typography } from '@mui/material';

import { bbColors } from '@/styles/bb';

interface BookingInfoItemProps {
  icon?: ElementType;
  label?: string;
  value: string | ReactNode;
  /** Label above the value instead of in the left column (e.g. inside a callout). */
  stacked?: boolean;
}

// Key/value row: 140px label column (or the icon), value on the right.
const BookingInfoItem = ({ icon: Icon, label, value, stacked }: BookingInfoItemProps) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: stacked ? '1fr' : '140px minmax(0, 1fr)',
      gap: stacked ? '4px' : '12px',
      alignItems: 'center',
      fontSize: 13,
    }}
  >
    {label ? (
      <Typography
        component="span"
        sx={{
          fontSize: stacked ? 12.5 : 13,
          fontWeight: stacked ? 600 : 400,
          color: stacked ? bbColors.amber800 : bbColors.gray500,
        }}
      >
        {label}
      </Typography>
    ) : (
      <Box sx={{ display: 'flex' }}>{Icon && <Icon fill={bbColors.gray400} size={20} />}</Box>
    )}
    {isValidElement(value) ? (
      value
    ) : (
      <Typography component="span" sx={{ fontSize: 13, fontWeight: 500 }}>
        {value}
      </Typography>
    )}
  </Box>
);

export default BookingInfoItem;
