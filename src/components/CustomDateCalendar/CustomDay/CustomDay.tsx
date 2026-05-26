'use client';

import { Stack, useMediaQuery } from '@mui/material';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

import colors from '@/styles/themes/colors';
import typography from '@/styles/themes/typography';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

interface CustomDayProps extends PickersDayProps {
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  onDayClick: (date: Dayjs) => void;
  hoverDate: Dayjs | null;
  onDayHover: (date: Dayjs | null) => void;
}

const CustomDay = ({
  day,
  outsideCurrentMonth,
  startDate,
  endDate,
  onDayClick,
  hoverDate,
  onDayHover,

  ...other
}: CustomDayProps) => {
  const supportsHover = useMediaQuery('(hover: hover) and (pointer: fine)');

  const isDisabled = outsideCurrentMonth;

  const isStart = startDate?.isSame(day, 'day');
  const isEnd = endDate?.isSame(day, 'day');
  const isHoverEnd = !endDate && hoverDate?.isSame(day, 'day');

  const isInActualRange =
    startDate && endDate && day.isSameOrAfter(startDate, 'day') && day.isSameOrBefore(endDate, 'day');

  const isInHoverRange =
    startDate &&
    !endDate &&
    hoverDate &&
    !hoverDate.isSame(startDate, 'day') &&
    hoverDate.isAfter(startDate) &&
    day.isAfter(startDate) &&
    day.isSameOrBefore(hoverDate);

  const isBackwardHover =
    startDate && !endDate && hoverDate && hoverDate.isBefore(startDate) && day.isSame(hoverDate, 'day');

  const isInRange = isInActualRange || isInHoverRange;
  const isSelected = isStart || isEnd || isInRange;

  const handleClick = () => {
    if (!isDisabled) onDayClick(day);
  };

  const handleMouseEnter = () => {
    if (!supportsHover) {
      return;
    }

    if (!isDisabled && !isStart && !isEnd && !(startDate && endDate)) {
      onDayHover(day);
    }
  };

  const handleMouseLeave = () => {
    if (!supportsHover) {
      return;
    }

    if (!isStart && !isEnd && !isDisabled && !(startDate && endDate)) {
      onDayHover(null);
    }
  };

  const getBackgroundColor = () => {
    if (isBackwardHover) return 'transparent';

    if (!startDate && isHoverEnd) return 'transparent';

    if (isStart || isEnd || (isHoverEnd && startDate)) return colors.blue500;

    if (isInRange) return colors.black100;

    return 'transparent';
  };

  const getBorderRadius = () => {
    if (!startDate && isHoverEnd) return '100%';

    if (isStart || isEnd || (isHoverEnd && startDate)) return '100%';

    if (isInRange || isInHoverRange) return '0px';

    return '100%';
  };

  const getTextColor = () => {
    if (isDisabled && !outsideCurrentMonth) {
      return colors.black300;
    }

    if (!startDate && isHoverEnd) return colors.black950;

    if (isStart || isEnd || (isHoverEnd && startDate)) return colors.white;

    if (isInRange) return colors.black950;

    return colors.black950;
  };

  const showRangeBg =
    startDate && (isInRange || (isHoverEnd && startDate && !isBackwardHover)) && !outsideCurrentMonth && !isStart;

  const rangeStyles = showRangeBg
    ? {
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: isStart ? '50%' : '-50%',
          height: '100%',
          width: '100%',
          backgroundColor: colors.black100,
          zIndex: 0,
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
        },
      }
    : undefined;

  const shouldShowHover =
    !isStart && !isEnd && (!isHoverEnd || !startDate || isBackwardHover) && !isDisabled && !(startDate && endDate);

  const dayComponent = (
    <Stack flex={1} position="relative" justifyContent="center" alignItems="center" sx={rangeStyles}>
      <PickersDay
        {...other}
        day={day}
        outsideCurrentMonth={outsideCurrentMonth}
        selected={!!isSelected}
        disabled={isDisabled}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        sx={{
          position: 'relative',
          zIndex: 2,
          margin: 'auto',
          p: '6px',
          minWidth: '36px',
          minHeight: '36px',
          backgroundColor: getBackgroundColor(),
          color: getTextColor(),
          borderRadius: getBorderRadius(),
          ...typography.body2,
          fontSize: '13px',
          fontWeight: 700,

          '&:hover': shouldShowHover
            ? {
                backgroundColor: colors.blue50,
                color: colors.blue900,
              }
            : {},
          '&.Mui-selected': {
            backgroundColor: getBackgroundColor(),
            color: getTextColor(),
            borderRadius: getBorderRadius(),
            fontWeight: 700,
            '&:hover': shouldShowHover
              ? {
                  backgroundColor: colors.blue50,
                  color: colors.blue900,
                }
              : {
                  backgroundColor: getBackgroundColor(),
                  color: getTextColor(),
                },
            '&.Mui-disabled': {
              backgroundColor: getBackgroundColor(),
              color: colors.black950,
              fontWeight: 700,
              opacity: '1 !important',
              cursor: 'not-allowed',
              textDecoration: 'none',
            },
          },
          '&.Mui-selected.MuiPickersDay-dayOutsideMonth': {
            backgroundColor: 'transparent',
            color: colors.black200,
            pointerEvents: 'none',
          },
        }}
      />
    </Stack>
  );

  return dayComponent;
};

export default CustomDay;
