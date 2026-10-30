/* Basic Contact Center statistics (design 2.5, basic part). Visitor numbers cover only visitors who consented and are
 * not comparable with GA4; spam and suspicious conversations are not counted (backend StatsQuery). */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, LinearProgress, MenuItem, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import dayjs from 'dayjs';

import ContactCenterService from '@/services/contactCenter.service';
import { bbColors } from '@/styles/bb';
import { CcStats, Count } from '@/types/contactCenter.type';
import { formatDuration } from '@/utils/contactCenter/display';
import { SITE_IDS, siteLabel } from '@/utils/contactCenter/safeLink';

type Range = 'today' | '7d' | '30d' | 'custom';

const startOf = (range: Range, fromDay: string) => {
  if (range === 'today') return dayjs().startOf('day');

  if (range === '7d') return dayjs().subtract(7, 'day');

  if (range === '30d') return dayjs().subtract(30, 'day');

  return dayjs(fromDay).startOf('day');
};

const card = { bgcolor: '#fff', border: `1px solid ${bbColors.gray100}`, borderRadius: 2, p: 1.5 };

const Metric = ({ label, value }: { label: string; value: string | number }) => (
  <Box sx={{ ...card, minWidth: 140, flex: '1 1 140px' }}>
    <Typography sx={{ fontSize: 12, color: bbColors.gray500 }}>{label}</Typography>
    <Typography sx={{ fontSize: 22, fontWeight: 800, color: bbColors.navy900 }}>{value}</Typography>
  </Box>
);

const Bars = ({ title, rows, label }: { title: string; rows: Count[]; label?(key: string): string }) => {
  const max = Math.max(1, ...rows.map(r => r.value));

  return (
    <Box sx={{ ...card, flex: '1 1 300px' }}>
      <Typography sx={{ fontSize: 13, fontWeight: 800, mb: 1 }}>{title}</Typography>
      {!rows.length && <Typography sx={{ fontSize: 12, color: bbColors.gray500 }}>—</Typography>}
      {rows.map(r => (
        <Box key={r.key} sx={{ mb: 0.75 }}>
          <Box sx={{ display: 'flex', fontSize: 12 }}>
            <span>{label ? label(r.key) : r.key}</span>
            <Box component="span" sx={{ ml: 'auto', fontWeight: 700 }}>
              {r.value}
            </Box>
          </Box>
          <LinearProgress variant="determinate" value={(r.value / max) * 100} sx={{ height: 6, borderRadius: 3 }} />
        </Box>
      ))}
    </Box>
  );
};

const Stats = () => {
  const { t } = useTranslation('contactCenter');
  const [range, setRange] = useState<Range>('30d');
  const [fromDay, setFromDay] = useState(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [toDay, setToDay] = useState(dayjs().format('YYYY-MM-DD'));
  const [siteId, setSiteId] = useState('');
  const [stats, setStats] = useState<CcStats | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const end = range === 'custom' ? dayjs(toDay).add(1, 'day').startOf('day') : dayjs();
    const start = startOf(range, fromDay);

    // A cleared date input is no date: no request (an invalid date would throw in toISOString).
    if (!start.isValid() || !end.isValid() || !start.isBefore(end)) return undefined;

    let current = true;

    ContactCenterService.stats({ from: start.toISOString(), to: end.toISOString(), siteId: siteId || undefined })
      .then(({ data }) => {
        if (!current) return;

        setStats(data);
        setFailed(false);
      })
      .catch(() => current && setFailed(true));

    return () => {
      current = false;
    };
  }, [range, fromDay, toDay, siteId]);

  const channel = (k: string) => t(`channel.${k}`, { defaultValue: k });

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 1 }}>
        <ToggleButtonGroup size="small" exclusive value={range} onChange={(_, v) => v && setRange(v)}>
          <ToggleButton value="today">{t('range.today')}</ToggleButton>
          <ToggleButton value="7d">{t('range.7d')}</ToggleButton>
          <ToggleButton value="30d">{t('range.30d')}</ToggleButton>
          <ToggleButton value="custom">{t('range.custom')}</ToggleButton>
        </ToggleButtonGroup>
        {range === 'custom' && (
          <>
            <TextField size="small" type="date" value={fromDay} onChange={e => setFromDay(e.target.value)} />
            <TextField size="small" type="date" value={toDay} onChange={e => setToDay(e.target.value)} />
          </>
        )}
        <TextField
          select
          size="small"
          label={t('filter.site')}
          value={siteId}
          onChange={e => setSiteId(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">{t('filter.all')}</MenuItem>
          {SITE_IDS.map(id => (
            <MenuItem key={id} value={id}>
              {siteLabel(id)}
            </MenuItem>
          ))}
        </TextField>
      </Box>
      <Typography sx={{ fontSize: 12, color: bbColors.gray600, mb: 1.5 }}>{t('statsNote')}</Typography>
      {failed && <Typography sx={{ fontSize: 13, color: bbColors.red600 }}>{t('loadFailed')}</Typography>}
      {stats && (
        <Box sx={{ display: 'grid', gap: 1.5 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 800 }}>{t('stats.chat')}</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Metric label={t('stats.started')} value={stats.chat.started} />
            <Metric label={t('stats.startedByTeam')} value={stats.chat.startedByTeam} />
            <Metric label={t('stats.aiOnly')} value={stats.chat.aiOnly} />
            <Metric label={t('stats.takenOver')} value={stats.chat.takenOver} />
            <Metric label={t('stats.missed')} value={stats.chat.missed} />
            <Metric
              label={t('stats.medianFirstResponse')}
              value={formatDuration(stats.chat.medianFirstResponseSeconds)}
            />
            <Metric label={t('stats.contactsCollected')} value={stats.chat.contactsCollected} />
          </Box>
          <Typography sx={{ fontSize: 15, fontWeight: 800 }}>{t('stats.visitors')}</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Metric label={t('stats.visits')} value={stats.visitors.visits} />
            <Metric label={t('stats.visitorCount')} value={stats.visitors.visitors} />
            <Metric label={t('stats.newVisitors')} value={stats.visitors.newVisitors} />
            <Metric label={t('stats.returningVisitors')} value={stats.visitors.returningVisitors} />
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Bars title={t('stats.bySite')} rows={stats.visitors.bySite} label={siteLabel} />
            <Bars title={t('stats.byChannel')} rows={stats.visitors.byChannel} label={channel} />
            <Bars title={t('stats.byCountry')} rows={stats.visitors.byCountry} />
            <Bars title={t('stats.sisterToBoat4you')} rows={stats.visitors.sisterToBoat4you} label={siteLabel} />
          </Box>
          <Typography sx={{ fontSize: 15, fontWeight: 800 }}>
            {t('stats.searches')} ({stats.searches.total})
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Bars title={t('stats.topLocations')} rows={stats.searches.topLocations} />
            <Bars title={t('stats.topCountries')} rows={stats.searches.topCountries} />
            <Bars title={t('stats.byMonth')} rows={stats.searches.byMonth} />
            <Bars title={t('stats.persons')} rows={stats.searches.personsBuckets} />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Stats;
