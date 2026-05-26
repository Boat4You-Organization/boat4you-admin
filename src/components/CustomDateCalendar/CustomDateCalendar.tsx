import { useTranslation } from 'react-i18next';

import { LocalizationProvider, DateCalendar as MuiDateCalendar } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Dayjs } from 'dayjs';
import 'dayjs/locale/de';
import 'dayjs/locale/en';
import 'dayjs/locale/es';
import 'dayjs/locale/fr';
import 'dayjs/locale/hr';

import CustomDay from '@/components/CustomDateCalendar/CustomDay';
import colors from '@/styles/themes/colors';
import typography from '@/styles/themes/typography';

interface CustomDateCalendarProps {
  currentMonth: Dayjs;
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  onDayClick: (date: Dayjs) => void;
  hoverDate: Dayjs | null;
  onDayHover: (date: Dayjs | null) => void;
}

const calendarStyles = {
  width: '100%',
  overflow: 'visible',
  height: 'fit-content',
  maxHeight: 'fit-content',
  minWidth: '336px',
  '& .MuiDayCalendar-header': {
    pb: '12px',
  },
  '& .MuiDayCalendar-header > *': {
    flex: 1,
    ...typography.body2,
    color: colors.black600,
    margin: 'auto',
    p: '6px',
    minWidth: '22px',
    minHeight: '22px',
    textTransform: 'capitalize',
  },
  '& .MuiPickersDay-hiddenDaySpacingFiller': {
    flex: 1,
    margin: 'auto',
    p: '6px',
    minWidth: '22px',
    minHeight: '22px',
  },
  '& .MuiDayCalendar-monthContainer': {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  '& .MuiDayCalendar-weekContainer': {
    margin: 0,
  },
  '& .MuiPickersSlideTransition-root': {
    height: 'auto',
    minHeight: '276px',
    overflow: 'visible',
  },
};

const headerStyles = {
  position: 'relative',
  padding: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  minHeight: 'auto',
  margin: 0,
  '& .MuiPickersCalendarHeader-labelContainer': {
    margin: 'auto',
    flexDirection: 'row',
    gap: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textTransform: 'capitalize',
  },
  '& .MuiPickersCalendarHeader-label': {
    ...typography.h4,
    whiteSpace: 'nowrap',
    color: colors.black950,
    margin: 0,
    cursor: 'default',
  },
  '& .MuiPickersArrowSwitcher-root': {
    display: 'none',
  },
};

const getAdapterLocale = (locale: string): string => {
  const localeMap: Record<string, string> = {
    en: 'en',
    'en-US': 'en',
    'en-GB': 'en-gb',
    es: 'es',
    'es-ES': 'es',
    fr: 'fr',
    'fr-FR': 'fr',
    de: 'de',
    'de-DE': 'de',
    hr: 'hr',
    'hr-HR': 'hr',
  };

  return localeMap[locale] || 'en';
};

const formatDayOfWeek = (date: Dayjs, locale: string): string => {
  let dayAbbr = date.format('ddd');

  dayAbbr = dayAbbr.replace(/\./g, '');

  if (locale.startsWith('hr')) {
    const croatianDays = ['Ned', 'Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub'];
    const dayIndex = date.day();

    dayAbbr = croatianDays[dayIndex];
  }

  return dayAbbr.charAt(0).toUpperCase() + dayAbbr.slice(1).toLowerCase();
};

const CustomDateCalendar = ({
  currentMonth,
  startDate,
  endDate,
  onDayClick,
  hoverDate,
  onDayHover,
}: CustomDateCalendarProps) => {
  const { i18n } = useTranslation();
  const currentLocale = getAdapterLocale(i18n.language);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={currentLocale}>
      <MuiDateCalendar
        key={currentMonth.format('YYYY-MM')}
        value={null}
        referenceDate={currentMonth}
        views={['day']}
        dayOfWeekFormatter={date => formatDayOfWeek(date, i18n.language)}
        disableHighlightToday
        sx={calendarStyles}
        slots={{
          leftArrowIcon: () => null,
          rightArrowIcon: () => null,
          // eslint-disable-next-line react/no-unstable-nested-components
          day: props => (
            <CustomDay
              {...props}
              startDate={startDate}
              endDate={endDate}
              onDayClick={onDayClick}
              hoverDate={hoverDate}
              onDayHover={onDayHover}
            />
          ),
        }}
        slotProps={{
          calendarHeader: {
            sx: headerStyles,
          },
        }}
      />
    </LocalizationProvider>
  );
};

export default CustomDateCalendar;
