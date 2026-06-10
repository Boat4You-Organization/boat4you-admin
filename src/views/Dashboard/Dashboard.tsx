/* eslint-disable @typescript-eslint/no-use-before-define, react/no-array-index-key, react/no-unescaped-entities */
import { useEffect, useState } from 'react';

import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import EuroOutlinedIcon from '@mui/icons-material/EuroOutlined';
import SailingOutlinedIcon from '@mui/icons-material/SailingOutlined';
import { Box, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import Layout from '@/components/Layout';
import { ReservationModelShortInfo, ReservationSysStatus } from '@/models/booking.model';
import ReservationsService, { DashboardMetricsDto } from '@/services/reservations.service';
import { bbCardSx, bbColors, bbFont, bbStatusPill } from '@/styles/bb';
import { useAuthStore } from '@/valtio/auth/auth.store';

/**
 * Broker Desk dashboard — KPI grid + weekly bookings chart + recent
 * bookings table. All data comes from `/admin/reservations/dashboard-metrics`
 * (aggregates) and `/admin/reservations?size=10&sort=reservationCreatedAt,desc`
 * (recent bookings list — same source as the /bookings page).
 *
 * Layout is responsive:
 *   - KPI grid: 4-col (≥lg) → 2-col (sm) → 1-col (xs)
 *   - Chart full-width
 *   - Recent bookings table: horizontal scroll on narrow screens
 */

// ─── HELPERS ──────────────────────────────────────────────────────────

// MMK uses the swagger-style `RESERVED` for confirmed; our backend exposes
// it as `RESERVATION` on the sys-status enum. Map both, plus OPTION + CANCELLED.
const sysStatusToPill = (s: ReservationSysStatus): string => {
  switch (s) {
    case ReservationSysStatus.RESERVATION:
      return 'confirmed';
    case ReservationSysStatus.OPTION:
    case ReservationSysStatus.OPTION_WAITING:
      return 'option';
    case ReservationSysStatus.CANCELLED:
      return 'cancelled';
    default:
      return 'option';
  }
};

const formatPeriod = (from: string, to: string): string => {
  const f = dayjs(from);
  const t = dayjs(to);
  const sameYear = f.year() === t.year();

  
return sameYear
    ? `${f.format('D')}–${t.format('D MMM YYYY')}`
    : `${f.format('D MMM YYYY')} – ${t.format('D MMM YYYY')}`;
};

const formatMoney = (n: number | string): string => {
  const num = typeof n === 'string' ? parseFloat(n) : n;

  if (!Number.isFinite(num)) return '€0';

  
return `€${Math.round(num).toLocaleString('en')}`;
};

// ─── SMALL UI HELPERS ─────────────────────────────────────────────────

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
      <Typography sx={{ fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: bbColors.gray500, fontWeight: 700, pt: '6px' }}>
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
    {foot && (
      <Typography sx={{ fontSize: 11, mt: 0.5, color: bbColors.gray500, lineHeight: 1.4 }}>{foot}</Typography>
    )}
  </Box>
);

const StatusPill = ({ variant }: { variant: string }) => {
  const p = bbStatusPill(variant);

  
return <Box component="span" sx={p.style}>{p.label}</Box>;
};

// ─── DASHBOARD ────────────────────────────────────────────────────────

const Dashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetricsDto | null>(null);
  const [recent, setRecent] = useState<ReservationModelShortInfo[]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [m, list] = await Promise.all([
        ReservationsService.getDashboardMetrics(),
        // Backend `@PageableDefault(sort=["reservationCreatedAt"], direction=DESC)`
        // already gives newest-first on page 0 — no sort param needed.
        ReservationsService.getReservations(0),
      ]);

      if (cancelled) return;

      setMetrics(m);
      setRecent(list.content.slice(0, 10));
    })();
    
return () => {
      cancelled = true;
    };
  }, []);

  const firstName = user?.name || 'there';
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const currentYear = today.getFullYear();

  const moneyGreen = { color: bbColors.green600, fontWeight: 800, fontVariantNumeric: 'tabular-nums' as const };

  // Bar heights normalized to the max in the window so the tallest bar fills the
  // chart area; fall back to 0% when all days are empty (avoids divide-by-zero).
  const weekly = metrics?.weeklyChart ?? [];
  const maxCount = Math.max(1, ...weekly.map(d => d.count));
  const todayIdx = weekly.length - 1; // backend pads to 7 days, last = today

  return (
    <Layout>
      <Box
        sx={{
          backgroundColor: bbColors.gray50,
          minHeight: '100vh',
          fontFamily: bbFont.stack,
          color: bbColors.navy900,
          // 54px nav clearance + 20px design page-top padding.
          pt: '74px',
          pb: 4,
          px: { xs: 2, sm: 3 },
        }}
      >
        {/* ─── Page head ─── */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'flex-end' }}
          justifyContent="space-between"
          gap={2}
          sx={{ mb: 2.5 }}
        >
          <Box>
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: 20, sm: 22 },
                fontWeight: 800,
                letterSpacing: '-0.01em',
                color: bbColors.navy900,
              }}
            >
              Good morning, {firstName} <Box component="span" sx={{ color: bbColors.yellow500 }}>☀</Box>
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: bbColors.gray500, mt: 0.5 }}>
              Here's what's moving today — {dateStr}
            </Typography>
          </Box>
        </Stack>

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
                <Typography sx={{ fontSize: 11, color: bbColors.gray500 }}>
                  Last 7 days · daily count
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 11, color: bbColors.gray500 }}>
                Total: <Box component="span" sx={{ fontWeight: 700, color: bbColors.navy900 }}>{metrics ? metrics.bookingsThisWeek : '—'}</Box>
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
                    <Typography key={i} sx={{ flex: 1, textAlign: 'center', fontSize: 10, color: bbColors.gray500, fontWeight: 600 }}>
                      {d}
                    </Typography>
                  ))
                : weekly.map(d => (
                    <Typography key={d.day} sx={{ flex: 1, textAlign: 'center', fontSize: 10, color: bbColors.gray500, fontWeight: 600 }}>
                      {dayjs(d.day).format('ddd')}
                    </Typography>
                  ))}
            </Stack>
          </Box>
        </Box>

        {/* ─── Recent bookings ─── */}
        <Box sx={{ ...bbCardSx, overflow: 'hidden' }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ p: '12px 16px', borderBottom: `1px solid ${bbColors.gray100}` }}
          >
            <Box>
              <Typography sx={{ fontSize: 13.5, fontWeight: 800 }}>Recent bookings</Typography>
              <Typography sx={{ fontSize: 11, color: bbColors.gray500 }}>Latest 10 — newest first</Typography>
            </Box>
            <Typography
              component="a"
              onClick={() => navigate('/bookings')}
              sx={{ color: bbColors.navy700, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
            >
              View bookings →
            </Typography>
          </Stack>
          <Box sx={{ overflowX: 'auto' }}>
            <Box component="table" sx={{ width: '100%', minWidth: 720, borderCollapse: 'collapse' }}>
              <Box component="thead">
                <Box component="tr">
                  {['Booking', 'Client', 'Yacht', 'Dates', 'Total', 'Status'].map((h, i) => (
                    <Box
                      component="th"
                      key={h}
                      sx={{
                        fontSize: 10,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: bbColors.gray500,
                        fontWeight: 700,
                        padding: '11px 16px',
                        textAlign: i === 4 ? 'right' : 'left',
                        backgroundColor: bbColors.gray75,
                        borderBottom: `1px solid ${bbColors.gray200}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {recent.length === 0 && (
                  <Box component="tr">
                    <Box
                      component="td"
                      colSpan={6}
                      sx={{ ...tdBase, textAlign: 'center', color: bbColors.gray500, fontStyle: 'italic' }}
                    >
                      No bookings yet
                    </Box>
                  </Box>
                )}
                {recent.map(b => {
                  const orderNo = b.reservationNumber?.replace('/', '-') ?? String(b.reservationId);

                  
return (
                    <Box
                      component="tr"
                      key={b.reservationId}
                      onClick={() => navigate(`/bookings/${orderNo}`)}
                      sx={{ cursor: 'pointer', '&:hover': { backgroundColor: bbColors.gray75 } }}
                    >
                      <Box component="td" sx={{ ...tdBase, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                        {b.reservationNumber || `#${b.reservationId}`}
                      </Box>
                      <Box component="td" sx={tdBase}>{b.endUser}</Box>
                      <Box component="td" sx={tdBase}>
                        {b.modelName ? `${b.modelName} · ${b.yachtName}` : b.yachtName}
                      </Box>
                      <Box component="td" sx={{ ...tdBase, fontVariantNumeric: 'tabular-nums' }}>
                        {formatPeriod(b.reservationDateFrom, b.reservationDateTo)}
                      </Box>
                      <Box component="td" sx={{ ...tdBase, textAlign: 'right', ...moneyGreen }}>
                        {formatMoney(b.reservationTotalPrice)}
                      </Box>
                      <Box component="td" sx={tdBase}>
                        <StatusPill variant={sysStatusToPill(b.reservationSysStatus)} />
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Layout>
  );
};

const tdBase = {
  padding: '14px 16px',
  fontSize: 13,
  borderBottom: `1px solid ${bbColors.gray100}`,
  color: '#2c3e56',
  whiteSpace: 'nowrap' as const,
};

export default Dashboard;
