import { FormControl, FormLabel, Stack } from '@mui/material';
import {
  LocalizationProvider,
  DatePicker as MuiDatePicker,
  DatePickerProps as MuiDatePickerProps,
} from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import DatePickerActions from '@/components/DatePickerActions';
import Calendar from '@/components/SvgIcons/Calendar';
import { DATE_FORMAT_HR } from '@/config/date-time.config';
import { i18n } from '@/i18n';
import typography from '@/styles/themes/typography';

dayjs.extend(utc);
dayjs.extend(timezone);

const DatePicker: React.FC<MuiDatePickerProps> = ({ value, onChange, label, ...props }) => (
  <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={i18n.language}>
    <FormControl fullWidth>
      {label && (
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <FormLabel sx={{ mb: 1, ...typography.body1, fontWeight: 600 }}>{label}</FormLabel>
        </Stack>
      )}
      <MuiDatePicker
        format={DATE_FORMAT_HR}
        value={value}
        onChange={onChange}
        slots={{
          openPickerIcon: Calendar,
          actionBar: DatePickerActions,
        }}
        slotProps={{
          mobilePaper: { sx: { margin: 0 } },
          actionBar: {
            actions: ['cancel', 'accept'],
          },
          field: {
            clearable: true,
          },
        }}
        {...props}
      />
    </FormControl>
  </LocalizationProvider>
);

export default DatePicker;
