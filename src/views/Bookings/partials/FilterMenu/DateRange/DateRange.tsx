'use client';

import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Close } from '@mui/icons-material';
import { Box, Button, FormLabel, IconButton, Menu, Stack, Theme, Typography, useMediaQuery } from '@mui/material';
import cx from 'clsx';
import dayjs, { Dayjs } from 'dayjs';

import CustomDateCalendar from '@/components/CustomDateCalendar';
import ModalRoot from '@/components/ModalRoot';
import Calendar from '@/components/SvgIcons/Calendar';
import ChevronLeft from '@/components/SvgIcons/ChevronLeft';
import ChevronRight from '@/components/SvgIcons/ChevronRight';
import colors from '@/styles/themes/colors';
import typography from '@/styles/themes/typography';
import useToggleState from '@/utils/hooks/useToggleState';
import DateTime from '@/utils/static/DateTime';

import styles from './DateRange.module.scss';

interface DateRangeValue {
  startDate: Dayjs | null;
  endDate: Dayjs | null;
}

interface DateRangeProps {
  formLabel?: string | React.ReactElement;
  formLabelAction?: React.ReactElement;
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  handleDateRange: (dateRange: DateRangeValue) => void;
}

const DateRange = ({ formLabel, formLabelAction, startDate, endDate, handleDateRange }: DateRangeProps) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [isModalOpen, toggleModal] = useToggleState();

  const open = Boolean(anchorEl);
  const customBreakpoint = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'));

  const isOpen = !customBreakpoint ? open : isModalOpen;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (customBreakpoint) {
      toggleModal();
    } else {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = useCallback(() => {
    setAnchorEl(null);
    toggleModal();
  }, [toggleModal]);

  const [localCurrentMonth, setLocalCurrentMonth] = useState<Dayjs>(dayjs());
  const [hoverDate, setHoverDate] = useState<Dayjs | null>(null);

  const currentMonth = localCurrentMonth;

  const handlePrevMonth = () => setLocalCurrentMonth(prev => prev.subtract(1, 'month'));
  const handleNextMonth = () => setLocalCurrentMonth(prev => prev.add(1, 'month'));

  const handleDayClick = useCallback(
    (date: Dayjs) => {
      if (!startDate || (startDate && endDate)) {
        handleDateRange({ startDate: date, endDate: null });
        setHoverDate(null);
      } else if (date.isBefore(startDate, 'day') || date.isSame(startDate, 'day')) {
        handleDateRange({ startDate: date, endDate: null });
        setHoverDate(null);
      } else {
        handleDateRange({ startDate, endDate: date });
        setHoverDate(null);

        if (!customBreakpoint) {
          handleClose();
        }
      }
    },
    [startDate, endDate, handleDateRange, customBreakpoint, handleClose]
  );

  const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleDateRange({ startDate: null, endDate: null });
  };

  const handleDayHover = useCallback((date: Dayjs | null) => {
    setHoverDate(date);
  }, []);

  const renderCalendarContent = () => (
    <Stack
      direction={customBreakpoint ? 'column' : 'row'}
      spacing={customBreakpoint ? 2 : 0}
      paddingBlock={customBreakpoint ? 0 : 2}
      paddingInline={customBreakpoint ? 0 : 4}
      width="100%"
      height="100%"
    >
      <Stack direction={customBreakpoint ? 'column' : 'row'} alignItems="center" height="100%" flex={1}>
        <Stack width="100%" position="relative" height="100%">
          <IconButton
            component="div"
            onClick={handlePrevMonth}
            sx={{ position: 'absolute', top: 0, left: customBreakpoint ? 24 : 0, zIndex: 1 }}
          >
            <ChevronLeft size={28} fill={colors.black400} />
          </IconButton>
          <IconButton
            component="div"
            onClick={handleNextMonth}
            sx={{ position: 'absolute', top: 0, right: customBreakpoint ? 24 : 0, zIndex: 1 }}
          >
            <ChevronRight size={28} fill={colors.black400} />
          </IconButton>
          <CustomDateCalendar
            currentMonth={currentMonth}
            startDate={startDate}
            endDate={endDate}
            onDayClick={handleDayClick}
            hoverDate={hoverDate}
            onDayHover={handleDayHover}
          />
        </Stack>
      </Stack>
    </Stack>
  );

  const renderButtonContent = () => {
    if (startDate && endDate) {
      return (
        <Typography
          variant="body1"
          color={colors.black950}
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {`${DateTime.formatWithoutYear(startDate)} - ${DateTime.formatWithoutYear(endDate)}`}
        </Typography>
      );
    }

    return (
      <Typography
        variant="body1"
        color={colors.black300}
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {t('common.dateRange')}
      </Typography>
    );
  };

  return (
    <>
      {formLabel && (
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <FormLabel sx={{ mb: 1, ...typography.body1, fontWeight: 600 }}>{formLabel}</FormLabel>
          {formLabelAction && <Box>{formLabelAction}</Box>}
        </Stack>
      )}
      <Button
        component="div"
        id="calendar-button"
        aria-controls={isOpen ? 'calendar-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={isOpen ? 'true' : undefined}
        onClick={handleClick}
        variant="text"
        startIcon={<Calendar fill={colors.black300} size={20} />}
        endIcon={
          startDate &&
          endDate && (
            <IconButton onClick={handleClear} className={styles.iconButton}>
              <Close color="secondary" fontSize="small" />
            </IconButton>
          )
        }
        size="large"
        classes={{ root: styles.rootButton }}
        className={cx(
          styles.customButton,
          { [styles.isButtonActive]: isOpen },
          { [styles.hasValue]: startDate && endDate }
        )}
        fullWidth
        sx={{
          '& .MuiButton-endIcon': {
            marginLeft: 'auto',
          },
        }}
      >
        {renderButtonContent()}
      </Button>
      {!customBreakpoint && (
        <Menu
          id="calendar-menu"
          aria-labelledby="calendar-button"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          sx={{
            marginTop: 1.5,
            '& .MuiMenu-list': {
              padding: 0,
            },
            '& .MuiPaper-root': {
              borderRadius: '10px',
              boxShadow: '0px 4px 14px 0px rgba(0, 0, 0, 0.15);',
            },
          }}
        >
          {renderCalendarContent()}
        </Menu>
      )}
      {customBreakpoint && (
        <ModalRoot
          title={t('form.custom-boat.chooseDate')}
          open={isModalOpen}
          onClose={toggleModal}
          hideCancelButton
          customButton={
            <Button variant="contained" size="large" onClick={toggleModal} fullWidth>
              {t('form.custom-boat.chooseDate')}
            </Button>
          }
        >
          {renderCalendarContent()}
        </ModalRoot>
      )}
    </>
  );
};

export default DateRange;
