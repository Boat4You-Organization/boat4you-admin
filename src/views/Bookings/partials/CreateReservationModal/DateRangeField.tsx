import { useEffect, useState } from 'react';

import Calendar from '@mui/icons-material/CalendarMonthOutlined';
import { Box, Button, IconButton, Popover, Stack, Typography } from '@mui/material';
import { DateCalendar, LocalizationProvider, PickersDay, PickersDayProps } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';

import colors from '@/styles/themes/colors';

/**
 * Single-field date range picker that mirrors the customer homepage UX —
 * click opens a calendar popover, first click = start date, second click =
 * end date, popover closes and commits. Days between start and end are
 * highlighted in blue so the selected range reads at a glance.
 *
 * Built on MUI X `DateCalendar` (free tier) + a custom `PickersDay` that
 * paints the in-range styling. No Pro components required.
 */

interface DateRangeFieldProps {
  startDate: Dayjs;
  endDate: Dayjs;
  onChange: (start: Dayjs, end: Dayjs) => void;
  label?: string;
  minDate?: Dayjs; // defaults to today
  // When true, the caption ("Dates") above the value line is suppressed so
  // the parent's own section label doesn't double up with it. Used by the
  // Offers workspace where every field already sits under an UPPERCASE
  // section header.
  hideLabel?: boolean;
}

interface RangeDayProps extends PickersDayProps<Dayjs> {
  rangeStart: Dayjs | null;
  rangeEnd: Dayjs | null;
}

// Individual day renderer — paints background for start / end / in-between
// states. Everything else falls through to MUI default behaviour.
const RangeDay = ({ day, rangeStart, rangeEnd, ...other }: RangeDayProps) => {
  const isStart = rangeStart && day.isSame(rangeStart, 'day');
  const isEnd = rangeEnd && day.isSame(rangeEnd, 'day');
  const inBetween =
    rangeStart && rangeEnd && day.isAfter(rangeStart, 'day') && day.isBefore(rangeEnd, 'day');

  const endpointSx = {
    backgroundColor: colors.blue500,
    color: colors.white,
    '&:hover': { backgroundColor: colors.blue500 },
    '&:focus': { backgroundColor: colors.blue500 },
  };
  const betweenSx = {
    backgroundColor: colors.blue50,
    borderRadius: 0,
    color: colors.black950,
  };

  return (
    <PickersDay
      {...other}
      day={day}
      sx={
        isStart || isEnd
          ? endpointSx
          : inBetween
            ? betweenSx
            : undefined
      }
    />
  );
};

const DateRangeField = ({
  startDate,
  endDate,
  onChange,
  label = 'Dates',
  minDate,
  hideLabel = false,
}: DateRangeFieldProps) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  // Draft state while the popover is open — committed via `onChange` only
  // when both endpoints are picked (or when the user clicks Done).
  const [draftStart, setDraftStart] = useState<Dayjs | null>(startDate);
  const [draftEnd, setDraftEnd] = useState<Dayjs | null>(endDate);

  // Sync draft with external value changes (e.g. parent reset).
  useEffect(() => {
    if (!anchor) {
      setDraftStart(startDate);
      setDraftEnd(endDate);
    }
  }, [startDate, endDate, anchor]);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    // Reset selection on every open so the admin can quickly change range
    // without needing to clear first.
    setDraftStart(null);
    setDraftEnd(null);
    setAnchor(e.currentTarget);
  };

  const handleClose = () => {
    setAnchor(null);
    // If admin closed without finishing the range, revert to committed value.
    if (!draftStart || !draftEnd) {
      setDraftStart(startDate);
      setDraftEnd(endDate);
    }
  };

  const handleDayPick = (value: Dayjs | null) => {
    if (!value) return;
    if (!draftStart) {
      setDraftStart(value);
      return;
    }
    if (draftStart && !draftEnd) {
      if (value.isBefore(draftStart, 'day')) {
        // User picked a day earlier than current start — treat as new start.
        setDraftStart(value);
        return;
      }
      if (value.isSame(draftStart, 'day')) {
        // Same-day click = single-day range; common case "just picked start,
        // want to pick end elsewhere" — keep start, wait for real end.
        return;
      }
      setDraftEnd(value);
      onChange(draftStart, value);
      setAnchor(null);
      return;
    }
    // Both already set — restart with new start.
    setDraftStart(value);
    setDraftEnd(null);
  };

  const displayText = `${startDate.format('DD MMM')} → ${endDate.format('DD MMM YYYY')}`;

  return (
    <>
      <Button
        onClick={handleOpen}
        variant="outlined"
        startIcon={<Calendar />}
        fullWidth
        sx={{
          justifyContent: 'flex-start',
          textTransform: 'none',
          borderColor: colors.black200,
          color: colors.black950,
          px: 1.5,
          py: hideLabel ? 0.75 : 1.05,
          minWidth: 260,
          '&:hover': { borderColor: colors.blue500 },
        }}
      >
        {hideLabel ? (
          <Typography variant="body2" fontWeight={600}>
            {displayText}
          </Typography>
        ) : (
          <Stack alignItems="flex-start" spacing={0}>
            <Typography variant="caption" color={colors.black500}>
              {label}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {displayText}
            </Typography>
          </Stack>
        )}
      </Button>
      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { mt: 1 } } }}
      >
        <Box sx={{ p: 1.5, minWidth: 340 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1} px={1}>
            <Typography variant="caption" color={colors.black500}>
              {!draftStart
                ? 'Click a date to set start'
                : !draftEnd
                  ? `Start: ${draftStart.format('DD MMM YYYY')} — now click end`
                  : `${draftStart.format('DD MMM')} → ${draftEnd.format('DD MMM YYYY')}`}
            </Typography>
            {(draftStart || draftEnd) && (
              <IconButton
                size="small"
                onClick={() => {
                  setDraftStart(null);
                  setDraftEnd(null);
                }}
                sx={{ fontSize: 12 }}
              >
                Reset
              </IconButton>
            )}
          </Stack>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateCalendar
              value={null}
              onChange={handleDayPick}
              minDate={minDate ?? dayjs()}
              slots={{ day: RangeDay as any }}
              slotProps={{
                day: { rangeStart: draftStart, rangeEnd: draftEnd } as any,
              }}
            />
          </LocalizationProvider>
        </Box>
      </Popover>
    </>
  );
};

export default DateRangeField;
