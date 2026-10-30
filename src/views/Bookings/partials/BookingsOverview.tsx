/* eslint-disable react/no-array-index-key */
import { useEffect, useState } from 'react';

import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import EuroOutlinedIcon from '@mui/icons-material/EuroOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import SailingOutlinedIcon from '@mui/icons-material/SailingOutlined';
import { Box, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';

import ReservationsService, { DashboardMetricsDto } from '@/services/reservations.service';
import { bbCardSx, bbColors } from '@/styles/bb';

/**
 * KPI grid + weekly bookings chart on top of the Bookings page. Moved here from
 * the Dashboard, which Mario removed on 30.10.2026 ("the dashboard shows the
 * same as Bookings, only with these numbers"). Data: /admin/reservations/dashboard-metrics.
 */

const formatMoney = (n: number | string): string => {
  const num = typeof n === 'string' ? parseFloat(n) : n;

  if (!Number.isFinite(num)) return '€0';

  return `€${Math.round(num).toLocaleString('en')}`;
};

const KpiCard = ({
  label,
  value,
  foot,
  valueColor,
  icon,
  chipBg,
  chipFg,
}: {
  label: string;
  value: string;
  foot?: React.ReactNode;
  valueColor?: string;
  icon: React.ReactNode;
  chipBg: string;
  chipFg: string;
}) => (
  <Box sx={{ ...bbCardSx, p: '16px 18px' }}>
    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
      <Typography
        sx={{
          fontSize: 10.5,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: bbColors.gray500,
          fontWeight: 700,
          pt: '6px',
        }}
      >
        {label}
      </Typography>
      <Box
        sx={{
          width: 30,
          height: 30,
          borderRadius: '9px',
          backgroundColor: chipBg,
          color: chipFg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
    </Stack>
    <Typography
      sx={{
        fontSize: 28,
        fontWeight: 800,
        letterSpacing: '-0.02em',
        mt: 0.25,
        color: valueColor || bbColors.navy900,
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1.2,
      }}
    >
      {value}
    </Typography>
    {foot && <Typography sx={{ fontSize: 11, mt: 0.5, color: bbColors.gray500, lineHeight: 1.4 }}>{foot}</Typography>}
  </Box>
);

const BookingsOverview = () => {
  const [metrics, setMetrics] = useState<DashboardMetricsDto | null>(null);

  useEffect(() => {
    let cancelled = false;

    ReservationsService.getDashboardMetrics().then(m => {
      if (!cancelled) setMetrics(m);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const currentYear = new Date().getFullYear();
  // Bar heights normalized to the max in the window so the tallest bar fills the
  // chart area; fall back to 0% when all days are empty (avoids divide-by-zero).
  const weekly = metrics?.weeklyChart ?? [];
  const maxCount = Math.max(1, ...weekly.map(d => d.count));
  const todayIdx = weekly.length - 1; // backend pads to 7 days, last = today

  return (
    <>
      {/* ─── KPI grid ─── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 1.5,
          mb: 2,
        }}
      >
        <KpiCard
          label="Bookings · this week"
          value={metrics ? String(metrics.bookingsThisWeek) : '—'}
          foot={`Mon → Sun, ${dayjs().format('D MMM')}`}
          icon={<EventAvailableOutlinedIcon sx={{ fontSize: 17 }} />}
          chipBg="#e8f0fb"
          chipFg="#1a4fa8"
        />
        <KpiCard
          label="Bookings · this month"
          value={metrics ? String(metrics.bookingsThisMonth) : '—'}
          foot={dayjs().format('MMMM YYYY')}
          icon={<CalendarMonthOutlinedIcon sx={{ fontSize: 17 }} />}
          chipBg="#e1f5ee"
          chipFg="#0f6e56"
        />
        <KpiCard
          label="Confirmed reservations"
          value={metrics ? String(metrics.confirmedReservations) : '—'}
          foot="All time"
          icon={<SailingOutlinedIcon sx={{ fontSize: 17 }} />}
          chipBg="#fef7e0"
          chipFg="#8a6d00"
        />
        <KpiCard
          label={`Revenue · YTD ${currentYear}`}
          value={metrics ? formatMoney(metrics.revenueYearToDate) : '—'}
          valueColor={bbColors.green600}
          foot="Commission accumulated"
          icon={<EuroOutlinedIcon sx={{ fontSize: 17 }} />}
          chipBg="#d1fae5"
          chipFg="#047857"
        />
      </Box>

      {/* ─── Chart ─── */}
      <Box sx={{ mb: 1.75 }}>
        <Box sx={{ ...bbCardSx, p: 2.25 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="baseline" flexWrap="wrap" gap={1}>
            <Box>
              <Typography sx={{ fontSize: 13.5, fontWeight: 800 }}>Bookings this week</Typography>
              <Typography sx={{ fontSize: 11, color: bbColors.gray500 }}>Last 7 days · daily count</Typography>
            </Box>
            <Typography sx={{ fontSize: 11, color: bbColors.gray500 }}>
              Total:{' '}
              <Box component="span" sx={{ fontWeight: 700, color: bbColors.navy900 }}>
                {metrics ? metrics.bookingsThisWeek : '—'}
              </Box>
            </Typography>
          </Stack>

          {/* Bar row — flex-end keeps bars growing upward from baseline */}
          <Stack direction="row" alignItems="flex-end" gap={0.75} sx={{ height: 128, mt: 2 }}>
            {weekly.length === 0
              ? Array.from({ length: 7 }).map((_, i) => (
                  <Box key={i} sx={{ flex: 1, height: '4%', backgroundColor: bbColors.gray200, borderRadius: '6px' }} />
                ))
              : weekly.map((d, i) => {
                  const pct = Math.max(4, (d.count / maxCount) * 100);
                  const isToday = i === todayIdx;

                  return (
                    <Box
                      key={d.day}
                      title={`${d.day} · ${d.count}`}
                      sx={{
                        flex: 1,
                        height: `${pct}%`,
                        backgroundColor: isToday ? bbColors.yellow500 : bbColors.navy700,
                        borderRadius: '6px',
                      }}
                    />
                  );
                })}
          </Stack>
          <Stack direction="row" gap={0.75} sx={{ mt: 1 }}>
            {weekly.length === 0
              ? ['—', '—', '—', '—', '—', '—', '—'].map((d, i) => (
                  <Typography
                    key={i}
                    sx={{ flex: 1, textAlign: 'center', fontSize: 10, color: bbColors.gray500, fontWeight: 600 }}
                  >
                    {d}
                  </Typography>
                ))
              : weekly.map(d => (
                  <Typography
                    key={d.day}
                    sx={{ flex: 1, textAlign: 'center', fontSize: 10, color: bbColors.gray500, fontWeight: 600 }}
                  >
                    {dayjs(d.day).format('ddd')}
                  </Typography>
                ))}
          </Stack>
        </Box>
      </Box>
    </>
  );
};

export default BookingsOverview;
