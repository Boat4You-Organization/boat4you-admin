/* Objave → AI dnevne objave: per site, whether the AI makes a daily post, when, in which language, on which of the
 * site's channels, whether it waits for our approval and whether Higgsfield makes a video; "Napravi sada" runs today's
 * post at once. Below, the latest runs with their topic and post. Backend: /admin/social/ai (SocialAiService). */
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';

import { CardHead, DeskCard, TableCard, TableMessageRow, Th, tdSx } from '@/components/Desk';
import SocialService from '@/services/social.service';
import { errorMessage } from '@/services/yacht-media.api';
import { StatusTone, bbColors, bbPillStyle } from '@/styles/bb';
import { SocialAiOverview, SocialAiRunStatus, SocialAiSetting } from '@/types/social.type';
import { siteLabel } from '@/utils/contactCenter/safeLink';
import { showToast } from '@/valtio/global/global.actions';

import { AccountsState, PlatformBadge, textAreaSx, useDateFormat } from './ui';

const LANGUAGES: Array<[string, string]> = [
  ['en', 'English'],
  ['hr', 'Hrvatski'],
  ['de', 'Deutsch'],
  ['it', 'Italiano'],
  ['fr', 'Français'],
  ['es', 'Español'],
  ['pl', 'Polski'],
  ['nl', 'Nederlands'],
];

const RUN_TONES: Record<SocialAiRunStatus, StatusTone> = {
  RUNNING: 'progress',
  WAITING_VIDEO: 'info',
  DONE: 'success',
  SKIPPED: 'neutral',
  FAILED: 'danger',
};

const SiteCard = ({
  initial,
  accounts,
  higgsfield,
  aiReady,
  onSaved,
}: {
  initial: SocialAiSetting;
  accounts: AccountsState;
  higgsfield: boolean;
  aiReady: boolean;
  onSaved(): void;
}) => {
  const { t } = useTranslation('social');
  const [s, setS] = useState(initial);
  const [busy, setBusy] = useState<'save' | 'run' | null>(null);

  useEffect(() => setS(initial), [initial]);

  const channels = accounts.list.filter(a => a.site === s.site || a.site == null);
  const patch = (p: Partial<SocialAiSetting>) => setS(prev => ({ ...prev, ...p }));

  const save = async () => {
    setBusy('save');
    try {
      setS(await SocialService.saveAi(s));
      showToast({ status: 'success', text: t('ai.saved') });
      onSaved();
    } catch (e) {
      showToast({ status: 'error', text: errorMessage(e, t('ai.saveError')) });
    } finally {
      setBusy(null);
    }
  };

  const run = async () => {
    setBusy('run');
    try {
      const r = await SocialService.runAi(s.site);

      // The backend answers at once with the RUNNING run and makes the post in the background.
      if (r.status === 'RUNNING') {
        showToast({ status: 'info', text: t('ai.started') });
      } else {
        showToast({
          status: r.status === 'FAILED' ? 'error' : 'success',
          text: r.error
            ? `${t(`ai.runStatus.${r.status}`)}: ${r.error}`
            : t('ai.ran', { status: t(`ai.runStatus.${r.status}`) }),
        });
      }

      onSaved();
    } catch (e) {
      showToast({ status: 'error', text: errorMessage(e, t('ai.runError')) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <DeskCard>
      <CardHead
        title={siteLabel(s.site)}
        action={
          <FormControlLabel
            control={<Switch checked={s.enabled} onChange={e => patch({ enabled: e.target.checked })} />}
            label={<Typography sx={{ fontSize: 13, fontWeight: 600 }}>{t('ai.enabled')}</Typography>}
          />
        }
      />
      <Stack gap={1.5} sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5}>
          <TextField
            type="time"
            size="small"
            label={t('ai.time')}
            value={s.publishTime}
            onChange={e => patch({ publishTime: e.target.value })}
            InputLabelProps={{ shrink: true }}
            helperText={t('ai.timeHint')}
            sx={{ minWidth: 160 }}
          />
          <TextField
            select
            size="small"
            label={t('ai.language')}
            value={s.language}
            onChange={e => patch({ language: e.target.value })}
            sx={{ minWidth: 160 }}
          >
            {LANGUAGES.map(([code, name]) => (
              <MenuItem key={code} value={code}>
                {name}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: bbColors.gray600, mb: 0.5 }}>
            {t('ai.channels')}
          </Typography>
          {channels.length === 0 && (
            <Typography sx={{ fontSize: 12.5, color: bbColors.gray450 }}>{t('ai.noChannels')}</Typography>
          )}
          <Stack direction="row" gap={0.5} flexWrap="wrap">
            {channels.map(a => (
              <FormControlLabel
                key={a.id}
                control={
                  <Checkbox
                    size="small"
                    checked={s.accountIds.includes(a.id)}
                    onChange={e =>
                      patch({
                        accountIds: e.target.checked ? [...s.accountIds, a.id] : s.accountIds.filter(id => id !== a.id),
                      })
                    }
                  />
                }
                label={
                  <Stack direction="row" alignItems="center" gap={0.5} component="span">
                    <PlatformBadge platform={a.platform} size={18} />
                    <Box component="span" sx={{ fontSize: 13 }}>
                      {a.name}
                    </Box>
                  </Stack>
                }
              />
            ))}
          </Stack>
        </Box>
        <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5}>
          <Box sx={{ flex: 1 }}>
            <FormControlLabel
              control={
                <Switch checked={s.requireApproval} onChange={e => patch({ requireApproval: e.target.checked })} />
              }
              label={<Typography sx={{ fontSize: 13 }}>{t('ai.approval')}</Typography>}
            />
            <Typography sx={{ fontSize: 12, color: bbColors.gray500, ml: '46px', mt: -0.5 }}>
              {t('ai.approvalHint')}
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={s.useVideo}
                  disabled={!higgsfield}
                  onChange={e => patch({ useVideo: e.target.checked })}
                />
              }
              label={<Typography sx={{ fontSize: 13 }}>{t('ai.video')}</Typography>}
            />
            <Typography sx={{ fontSize: 12, color: bbColors.gray500, ml: '46px', mt: -0.5 }}>
              {t('ai.videoHint')}
            </Typography>
          </Box>
        </Stack>
        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: bbColors.gray600, mb: 0.5 }}>
            {t('ai.guidance')}
          </Typography>
          <Box
            component="textarea"
            aria-label={t('ai.guidance')}
            placeholder={t('ai.guidancePlaceholder')}
            value={s.guidance ?? ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => patch({ guidance: e.target.value })}
            sx={{ ...textAreaSx, minHeight: 70 }}
          />
        </Box>
        <Stack direction="row" gap={1} justifyContent="flex-end" flexWrap="wrap">
          <Button variant="outlined" disabled={!!busy || !aiReady} onClick={run}>
            {busy === 'run' ? <CircularProgress size={18} /> : t('ai.runNow')}
          </Button>
          <Button variant="contained" disabled={!!busy} onClick={save}>
            {busy === 'save' ? <CircularProgress size={18} /> : t('ai.save')}
          </Button>
        </Stack>
      </Stack>
    </DeskCard>
  );
};

const AiTab = ({ accounts }: { accounts: AccountsState }) => {
  const { t } = useTranslation('social');
  const fmt = useDateFormat();
  const navigate = useNavigate();
  const [data, setData] = useState<SocialAiOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await SocialService.ai());
      setError(null);
    } catch (e) {
      setError(errorMessage(e, t('ai.loadError')));
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  // A run the AI is still making (started with "Napravi sada"): look again every 10 s until it is done.
  const running = data?.runs.some(r => r.status === 'RUNNING') ?? false;

  useEffect(() => {
    if (!running) return undefined;

    const id = window.setTimeout(load, 10_000);

    return () => window.clearTimeout(id);
  }, [running, data, load]);

  if (error) return <Alert severity="error">{error}</Alert>;

  if (!data) {
    return (
      <Stack alignItems="center" sx={{ py: 6 }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  return (
    <Stack gap={1.5}>
      <Alert severity="info">{t('ai.intro')}</Alert>
      {!data.aiConfigured && <Alert severity="warning">{t('ai.noAi')}</Alert>}
      {!data.higgsfieldConfigured && <Alert severity="info">{t('ai.noHiggsfield')}</Alert>}
      <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' } }}>
        {data.settings.map(s => (
          <SiteCard
            key={s.site}
            initial={s}
            accounts={accounts}
            higgsfield={data.higgsfieldConfigured}
            aiReady={data.aiConfigured}
            onSaved={load}
          />
        ))}
      </Box>
      <TableCard minWidth={720}>
        <thead>
          <tr>
            <Th>{t('ai.date')}</Th>
            <Th>{t('sites.site')}</Th>
            <Th>{t('ai.status')}</Th>
            <Th>{t('ai.topic')}</Th>
            <Th align="right">{t('ai.post')}</Th>
          </tr>
        </thead>
        <tbody>
          {data.runs.length === 0 && <TableMessageRow cols={5} title={t('ai.noRuns')} />}
          {data.runs.map(r => (
            <tr key={r.id}>
              <Box component="td" sx={tdSx}>
                {fmt.dateTime(r.createdAt)}
              </Box>
              <Box component="td" sx={tdSx}>
                {siteLabel(r.site)}
              </Box>
              <Box component="td" sx={tdSx}>
                <Box component="span" sx={bbPillStyle(RUN_TONES[r.status])}>
                  {t(`ai.runStatus.${r.status}`)}
                </Box>
              </Box>
              <Box component="td" sx={{ ...tdSx, whiteSpace: 'normal', maxWidth: 420 }}>
                {r.topic?.replace(/^yacht:\d+\s*/, '')}
                {r.error && (
                  <Typography sx={{ fontSize: 12, color: bbColors.red700 }} component="span" display="block">
                    {r.error}
                  </Typography>
                )}
              </Box>
              <Box component="td" sx={{ ...tdSx, textAlign: 'right' }}>
                {r.postId && (
                  <Button size="small" variant="text" onClick={() => navigate(`/social?post=${r.postId}`)}>
                    {t('ai.open')}
                  </Button>
                )}
              </Box>
            </tr>
          ))}
        </tbody>
      </TableCard>
    </Stack>
  );
};

export default AiTab;
