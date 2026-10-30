/* eslint-disable react/no-array-index-key, no-nested-ternary */
import { useEffect, useState } from 'react';

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

// Line icons of the v2.2 KPI chips (18px, 1.9 stroke), one per card.
const KpiIcon = ({ kind }: { kind: 'week' | 'month' | 'confirmed' | 'revenue' }) => {
  const stroke = { week: '#1A4FA8', month: '#0B6E66', confirmed: '#7A5600', revenue: '#0F7A54' }[kind];

  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {kind === 'week' && (
        <>
          <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
          <path d="M3.5 10h17M8 3v4M16 3v4" />
        </>
      )}
      {kind === 'month' && <path d="m3.5 16.5 5.5-5.5 4 4 7.5-7.5M15 7.5h5.5V13" />}
      {kind === 'confirmed' && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12.4 2.8 2.8L16.2 9.8" />
        </>
      )}
      {kind === 'revenue' && <path d="M17.5 6.5A7 7 0 1 0 17.5 17.5M4.5 10h9M4.5 14h9" />}
    </svg>
  );
};

const KpiCard = ({
  label,
  value,
  foot,
  valueColor,
  icon,
  chipBg,
}: {
  label: string;
  value: string;
  foot?: React.ReactNode;
  valueColor?: string;
  icon: React.ReactNode;
  chipBg: string;
}) => (
  <Box
    sx={{
      ...bbCardSx,
      p: { xs: '8px 10px', sm: '12px 14px' },
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      minWidth: 0,
    }}
  >
    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
      <Typography sx={{ fontSize: { xs: 11, sm: 12 }, fontWeight: 600, color: bbColors.gray600, lineHeight: 1.35 }}>
        {label}
      </Typography>
      <Box
        sx={{
          display: { xs: 'none', sm: 'flex' },
          width: 30,
          height: 30,
          borderRadius: '9px',
          backgroundColor: chipBg,
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
        fontSize: { xs: 18, sm: 24 },
        fontWeight: 800,
        letterSpacing: '-0.01em',
        color: valueColor || bbColors.navy900,
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1.15,
      }}
    >
      {value}
    </Typography>
    {foot && (
      <Typography
        sx={{ display: { xs: 'none', sm: 'block' }, fontSize: 11.5, color: bbColors.gray500, lineHeight: 1.4 }}
      >
        {foot}
      </Typography>
    )}
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
    <Box component="section" sx={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'stretch', mb: 1.5 }}>
      {/* ─── KPI grid ─── */}
      <Box
        sx={{
          flex: '999 1 720px',
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
          gap: { xs: 1, sm: '10px' },
        }}
      >
        <KpiCard
          label="Bookings · this week"
          value={metrics ? String(metrics.bookingsThisWeek) : '—'}
          foot={`Mon → Sun, ${dayjs().format('D MMM')}`}
          icon={<KpiIcon kind="week" />}
          chipBg={bbColors.info100}
        />
        <KpiCard
          label="Bookings · this month"
          value={metrics ? String(metrics.bookingsThisMonth) : '—'}
          foot={dayjs().format('MMMM YYYY')}
          icon={<KpiIcon kind="month" />}
          chipBg="#e1f5ee"
        />
        <KpiCard
          label="Confirmed reservations"
          value={metrics ? String(metrics.confirmedReservations) : '—'}
          foot="All time"
          icon={<KpiIcon kind="confirmed" />}
          chipBg={bbColors.amber100}
        />
        <KpiCard
          label={`Revenue · YTD ${currentYear}`}
          value={metrics ? formatMoney(metrics.revenueYearToDate) : '—'}
          valueColor={bbColors.green700}
          foot="Commission accumulated"
          icon={<KpiIcon kind="revenue" />}
          chipBg={bbColors.green100}
        />
      </Box>

      {/* ─── Chart ─── */}
      <Box sx={{ ...bbCardSx, flex: '1 1 320px', p: '12px 14px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Stack direction="row" alignItems="baseline" gap={1}>
          <Typography sx={{ fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap' }}>Bookings this week</Typography>
          <Typography
            sx={{
              fontSize: 11.5,
              color: bbColors.gray500,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            Last 7 days · daily count
          </Typography>
          <Typography sx={{ ml: 'auto', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
            Total: {metrics ? metrics.bookingsThisWeek : '—'}
          </Typography>
        </Stack>

        {/* Bars grow upward from the baseline; count above, weekday below. Today is yellow. */}
        <Box
          sx={{
            height: 74,
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            gap: 1,
            alignItems: 'end',
            mt: 'auto',
          }}
        >
          {(weekly.length === 0 ? Array.from({ length: 7 }, () => null) : weekly).map((d, i) => {
            const isToday = !!d && i === todayIdx;
            const barHeight = d && d.count > 0 ? Math.max(4, Math.round((d.count / maxCount) * 44)) : 4;

            return (
              <Box
                key={d ? d.day : i}
                title={d ? `${d.day} · ${d.count}` : undefined}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '3px',
                  height: '100%',
                }}
              >
                <Box
                  component="span"
                  sx={{
                    fontSize: 10.5,
                    fontWeight: isToday ? 800 : 500,
                    color: isToday ? bbColors.navy900 : bbColors.gray500,
                  }}
                >
                  {d ? d.count : ''}
                </Box>
                <Box
                  sx={{
                    width: '100%',
                    maxWidth: 26,
                    height: barHeight,
                    borderRadius: '5px 5px 2px 2px',
                    backgroundColor:
                      !d || d.count === 0 ? bbColors.gray200 : isToday ? bbColors.yellow500 : bbColors.navy700,
                  }}
                />
                <Box component="span" sx={{ fontSize: 10.5, color: bbColors.gray500 }}>
                  {d ? dayjs(d.day).format('ddd') : '—'}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default BookingsOverview;
