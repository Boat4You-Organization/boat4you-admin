/* PR → Pregled: the counters from /overview, the follow-ups that may go today (SENT main pitches 5+ days old without
 * one) and the placements whose link check raised an alert. */
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Alert, Box, Button, Chip, CircularProgress, Stack, Typography } from '@mui/material';

import { CardHead, DeskCard, TableCard, TableMessageRow, Th, tdSx } from '@/components/Desk';
import PrService from '@/services/pr.service';
import { bbColors } from '@/styles/bb';
import { PrOverview, PrPitch, PrPlacement } from '@/types/pr.type';
import { followUpsDue, linkStateTone } from '@/utils/pr/format';

import { ExtLink, useDates, usePrError } from './ui';

const Kpi = ({ label, value, tone }: { label: string; value: number; tone?: 'warn' }) => (
  <DeskCard sx={{ flex: '1 1 150px', p: '14px 16px' }}>
    <Typography sx={{ fontSize: 12, fontWeight: 600, color: bbColors.gray500 }}>{label}</Typography>
    <Typography
      sx={{ fontSize: 26, fontWeight: 800, color: tone === 'warn' && value > 0 ? bbColors.red700 : bbColors.navy900 }}
    >
      {value}
    </Typography>
  </DeskCard>
);

const Overview = () => {
  const { t } = useTranslation('pr');
  const prError = usePrError();
  const dates = useDates();
  const navigate = useNavigate();
  const [data, setData] = useState<PrOverview | null>(null);
  const [due, setDue] = useState<PrPitch[]>([]);
  const [alerts, setAlerts] = useState<PrPlacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [overview, pitches, placements] = await Promise.all([
        PrService.overview(),
        PrService.pitches({}),
        PrService.placements({}),
      ]);

      setData(overview);
      setDue(followUpsDue(pitches, new Date().toISOString()));
      setAlerts(placements.filter(p => p.alert));
      setError(null);
    } catch (e) {
      setError(prError(e, t('ui.loadError')));
    } finally {
      setLoading(false);
    }
  }, [prError, t]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error || !data) return <Alert severity="error">{error ?? t('ui.loadError')}</Alert>;

  return (
    <Stack gap={1.5}>
      <Stack direction="row" flexWrap="wrap" gap={1.5}>
        <Kpi label={t('overview.liveFollow')} value={data.liveFollow} />
        <Kpi label={t('overview.liveNofollow')} value={data.liveNofollow} />
        <Kpi label={t('overview.alerts')} value={data.alerts} tone="warn" />
        <Kpi label={t('overview.followUpsDue')} value={data.followUpsDue} />
        <Kpi label={t('overview.mentionsNew')} value={data.mentionsNew} />
        <Kpi label={t('overview.mentionsUnlinked')} value={data.mentionsUnlinked} />
      </Stack>

      <TableCard minWidth={640}>
        <thead>
          <tr>
            <Th>{t('overview.study')}</Th>
            <Th align="right">{t('overview.sent')}</Th>
            <Th align="right">{t('overview.replied')}</Th>
            <Th align="right">{t('overview.published')}</Th>
            <Th align="right">{t('overview.placements')}</Th>
          </tr>
        </thead>
        <tbody>
          {data.perStudy.length === 0 && <TableMessageRow cols={5} title={t('overview.noStudies')} />}
          {data.perStudy.map(s => (
            <tr key={s.studyId}>
              <Box component="td" sx={{ ...tdSx, whiteSpace: 'normal', fontWeight: 600 }}>
                #{s.number} {s.title}
              </Box>
              <Box component="td" sx={{ ...tdSx, textAlign: 'right' }}>
                {s.sent}
              </Box>
              <Box component="td" sx={{ ...tdSx, textAlign: 'right' }}>
                {s.replied}
              </Box>
              <Box component="td" sx={{ ...tdSx, textAlign: 'right' }}>
                {s.published}
              </Box>
              <Box component="td" sx={{ ...tdSx, textAlign: 'right' }}>
                {s.placements}
              </Box>
            </tr>
          ))}
        </tbody>
      </TableCard>

      <DeskCard>
        <CardHead
          title={t('overview.followUpsTitle')}
          hint={t('overview.followUpsHint')}
          action={
            <Button size="small" variant="outlined" onClick={() => navigate('/pr/pitches')}>
              {t('overview.openPitches')}
            </Button>
          }
        />
        <Box sx={{ p: '8px 16px 14px' }}>
          {due.length === 0 && (
            <Typography sx={{ fontSize: 13, color: bbColors.gray500 }}>{t('overview.followUpsEmpty')}</Typography>
          )}
          {due.map(p => (
            <Box key={p.id} sx={{ py: '6px', fontSize: 13.5, borderBottom: `1px solid ${bbColors.gray100}` }}>
              <strong>{p.contactName || p.contactEmail}</strong>
              {p.outletName && ` · ${p.outletName}`} — {p.subject}
              <Box component="span" sx={{ display: 'block', fontSize: 12, color: bbColors.gray500 }}>
                {t('overview.sentOn', { date: dates.dateTime(p.sentAt) })}
              </Box>
            </Box>
          ))}
        </Box>
      </DeskCard>

      <DeskCard>
        <CardHead
          title={t('overview.alertsTitle')}
          action={
            <Button size="small" variant="outlined" onClick={() => navigate('/pr/placements')}>
              {t('overview.openPlacements')}
            </Button>
          }
        />
        <Box sx={{ p: '8px 16px 14px' }}>
          {alerts.length === 0 && (
            <Typography sx={{ fontSize: 13, color: bbColors.gray500 }}>{t('overview.alertsEmpty')}</Typography>
          )}
          {alerts.map(p => (
            <Stack
              key={p.id}
              direction="row"
              alignItems="center"
              flexWrap="wrap"
              gap={1}
              sx={{ py: '6px', fontSize: 13.5, borderBottom: `1px solid ${bbColors.gray100}` }}
            >
              <Chip size="small" color={linkStateTone(p.linkState)} label={t(`linkState.${p.linkState}`)} />
              <Box component="span" sx={{ fontWeight: 600 }}>
                {p.outletName ?? '—'}
              </Box>
              <ExtLink href={p.articleUrl} />
              {p.alertReason && (
                <Box component="span" sx={{ color: bbColors.red700, fontSize: 12.5 }}>
                  {p.alertReason}
                </Box>
              )}
            </Stack>
          ))}
        </Box>
      </DeskCard>
    </Stack>
  );
};

export default Overview;
