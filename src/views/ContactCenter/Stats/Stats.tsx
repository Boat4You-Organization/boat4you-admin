/* Basic Contact Center statistics (design 2.5, basic part). Visitor numbers cover only visitors who consented and are
 * not comparable with GA4; spam and suspicious conversations are not counted (backend StatsQuery). */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box } from '@mui/material';
import dayjs from 'dayjs';

import ContactCenterService from '@/services/contactCenter.service';
import { CcStats, Count } from '@/types/contactCenter.type';
import { formatDuration } from '@/utils/contactCenter/display';
import { SITE_IDS, siteLabel } from '@/utils/contactCenter/safeLink';
import { InfoIcon, LoadAlert, SectionLabel, Segmented, cc, fieldSx } from '@/views/ContactCenter/ui';

type Range = 'today' | '7d' | '30d' | 'custom';

const startOf = (range: Range, fromDay: string) => {
  if (range === 'today') return dayjs().startOf('day');

  if (range === '7d') return dayjs().subtract(7, 'day');

  if (range === '30d') return dayjs().subtract(30, 'day');

  return dayjs(fromDay).startOf('day');
};

const cardSx = {
  bgcolor: '#FFFFFF',
  border: `1px solid ${cc.border}`,
  borderRadius: '12px',
  p: '14px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  minWidth: 0,
} as const;

const Metric = ({ label, value, color = cc.ink }: { label: string; value: string | number; color?: string }) => (
  <Box sx={cardSx}>
    <Box component="span" sx={{ fontSize: 12.5, color: cc.text2 }}>
      {label}
    </Box>
    <Box
      component="span"
      sx={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums', color }}
    >
      {value}
    </Box>
  </Box>
);

const Bars = ({
  title,
  rows,
  label,
  color = cc.ink,
}: {
  title: string;
  rows: Count[];
  label?(key: string): string;
  color?: string;
}) => {
  const max = Math.max(1, ...rows.map(r => r.value));

  return (
    <Box sx={{ ...cardSx, gap: '10px' }}>
      <Box component="h3" sx={{ m: 0, fontSize: 14, fontWeight: 700, color: cc.ink }}>
        {title}
      </Box>
      {!rows.length && <Box sx={{ fontSize: 12.5, color: cc.muted }}>—</Box>}
      {rows.map(r => (
        <Box
          key={r.key}
          sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 44px', gap: '4px 10px', alignItems: 'center' }}
        >
          <Box
            component="span"
            sx={{ fontSize: 12.5, color: cc.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {label ? label(r.key) : r.key}
          </Box>
          <Box
            component="span"
            sx={{ textAlign: 'right', fontSize: 12.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
          >
            {r.value}
          </Box>
          <Box sx={{ gridColumn: '1 / -1', height: 8, borderRadius: '4px', bgcolor: cc.hover }}>
            <Box sx={{ height: 8, borderRadius: '4px', bgcolor: color, width: `${(r.value / max) * 100}%` }} />
          </Box>
        </Box>
      ))}
    </Box>
  );
};

const kpiGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '12px' } as const;
const barGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))',
  gap: '12px',
} as const;

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
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 14px', mb: '12px' }}>
        <Segmented<Range>
          label={t('rangeLabel')}
          value={range}
          onChange={setRange}
          sx={{ bgcolor: cc.seg }}
          options={[
            { value: 'today', label: t('range.today') },
            { value: '7d', label: t('range.7d') },
            { value: '30d', label: t('range.30d') },
            { value: 'custom', label: t('range.custom') },
          ]}
        />
        {range === 'custom' && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Box
              component="input"
              type="date"
              aria-label={t('filter.from')}
              value={fromDay}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFromDay(e.target.value)}
              sx={{ ...fieldSx, width: 'auto' }}
            />
            <Box component="span" sx={{ color: cc.muted }}>
              –
            </Box>
            <Box
              component="input"
              type="date"
              aria-label={t('filter.to')}
              value={toDay}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToDay(e.target.value)}
              sx={{ ...fieldSx, width: 'auto' }}
            />
          </Box>
        )}
        <Box
          component="select"
          aria-label={t('filter.site')}
          value={siteId}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSiteId(e.target.value)}
          sx={{ ...fieldSx, width: 'auto', minWidth: 180 }}
        >
          <option value="">{t('siteAll')}</option>
          {SITE_IDS.map(id => (
            <option key={id} value={id}>
              {siteLabel(id)}
            </option>
          ))}
        </Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-start',
          p: '10px 14px',
          mb: '22px',
          borderRadius: '10px',
          bgcolor: cc.note,
          color: cc.text,
          fontSize: 13,
          lineHeight: 1.5,
        }}
      >
        <Box component="span" sx={{ mt: '2px', display: 'flex' }}>
          <InfoIcon />
        </Box>
        <span>{t('statsNote')}</span>
      </Box>
      {failed && (
        <Box sx={{ mb: 2 }}>
          <LoadAlert text={t('loadFailed')} />
        </Box>
      )}
      {stats && (
        <>
          <SectionLabel sx={{ mb: '10px' }}>{t('stats.chat')}</SectionLabel>
          <Box sx={{ ...kpiGrid, mb: '26px' }}>
            <Metric label={t('stats.started')} value={stats.chat.started} />
            <Metric label={t('stats.startedByTeam')} value={stats.chat.startedByTeam} />
            <Metric label={t('stats.aiOnly')} value={stats.chat.aiOnly} />
            <Metric label={t('stats.takenOver')} value={stats.chat.takenOver} />
            <Metric label={t('stats.missed')} value={stats.chat.missed} color={stats.chat.missed ? cc.red : cc.ink} />
            <Metric
              label={t('stats.medianFirstResponse')}
              value={formatDuration(stats.chat.medianFirstResponseSeconds)}
            />
            <Metric label={t('stats.contactsCollected')} value={stats.chat.contactsCollected} color={cc.greenKpi} />
          </Box>
          <SectionLabel sx={{ mb: '10px' }}>{t('stats.visitors')}</SectionLabel>
          <Box sx={{ ...kpiGrid, mb: '18px' }}>
            <Metric label={t('stats.visits')} value={stats.visitors.visits} />
            <Metric label={t('stats.visitorCount')} value={stats.visitors.visitors} />
            <Metric label={t('stats.newVisitors')} value={stats.visitors.newVisitors} />
            <Metric label={t('stats.returningVisitors')} value={stats.visitors.returningVisitors} />
          </Box>
          <Box sx={{ ...barGrid, mb: '26px' }}>
            <Bars title={t('stats.bySite')} rows={stats.visitors.bySite} label={siteLabel} />
            <Bars title={t('stats.byChannel')} rows={stats.visitors.byChannel} label={channel} />
            <Bars title={t('stats.byCountry')} rows={stats.visitors.byCountry} />
            <Bars title={t('stats.sisterToBoat4you')} rows={stats.visitors.sisterToBoat4you} label={siteLabel} />
          </Box>
          <SectionLabel sx={{ mb: '10px' }}>{`${t('stats.searches')} (${stats.searches.total})`}</SectionLabel>
          <Box sx={barGrid}>
            <Bars title={t('stats.topLocations')} rows={stats.searches.topLocations} color={cc.searchBar} />
            <Bars title={t('stats.topCountries')} rows={stats.searches.topCountries} color={cc.searchBar} />
            <Bars title={t('stats.byMonth')} rows={stats.searches.byMonth} color={cc.searchBar} />
            <Bars title={t('stats.persons')} rows={stats.searches.personsBuckets} color={cc.searchBar} />
          </Box>
        </>
      )}
    </Box>
  );
};

export default Stats;
