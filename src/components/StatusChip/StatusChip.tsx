import { Box, ChipProps } from '@mui/material';

import { StatusTone, bbPillStyle } from '@/styles/bb';

// The one status pill (tinted background, dot, label). MUI colour names map onto the v2.2 tones.
const TONE: Record<string, StatusTone> = {
  success: 'success',
  error: 'danger',
  warning: 'warning',
  info: 'info',
  primary: 'progress',
  secondary: 'neutral',
  default: 'neutral',
};

const StatusChip = ({ color, label, sx }: ChipProps) => (
  <Box component="span" sx={[bbPillStyle(TONE[color ?? 'default'] ?? 'neutral'), ...(Array.isArray(sx) ? sx : [sx])]}>
    {label}
  </Box>
);

export default StatusChip;
