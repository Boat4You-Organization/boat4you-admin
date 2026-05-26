import React from 'react';

import { Box, FormControl, FormLabel, Stack } from '@mui/material';
import { MobileTimePicker, MobileTimePickerProps, TimeView } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import { i18n } from '@/i18n';
import typography from '@/styles/themes/typography';

dayjs.extend(utc);
dayjs.extend(timezone);

interface TimePickerProps extends MobileTimePickerProps<TimeView, true> {
  formLabel?: string | React.ReactElement;
  formLabelAction?: React.ReactElement;
}

const TimePicker: React.FC<TimePickerProps> = ({ formLabel, formLabelAction, value, onChange, ...props }) => (
  <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={i18n.language}>
    <FormControl fullWidth>
      {formLabel && (
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <FormLabel sx={{ mb: 1, ...typography.body1, fontWeight: 600 }}>{formLabel}</FormLabel>
          {formLabelAction && <Box>{formLabelAction}</Box>}
        </Stack>
      )}
      <MobileTimePicker
        value={value}
        onChange={onChange}
        ampm={false}
        slotProps={{
          textField: {
            variant: 'outlined',
          },
        }}
        {...props}
      />
    </FormControl>
  </LocalizationProvider>
);

export default TimePicker;
