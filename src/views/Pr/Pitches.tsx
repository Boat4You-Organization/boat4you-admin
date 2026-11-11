/* PR → Pitchevi: drafts (mostly written by Claude sessions) and sent pitches, by study and status, each with its send
 * decision. The list is loaded per study and filtered by status here, so "has a follow-up" is always known; one pitch
 * opens in PitchDetail, the only place with "Pošalji". */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Button, Chip, MenuItem, Stack, TextField } from '@mui/material';

import { FilterBar, SkeletonRows, TableCard, TableMessageRow, Th, cellSubSx, rowSx, tdSx } from '@/components/Desk';
import PrService from '@/services/pr.service';
import { bbColors } from '@/styles/bb';
import { PrPitch, PrPitchStatus, PrStudy } from '@/types/pr.type';
import { decisionLabelKey, pitchActions, pitchesWithFollowUp } from '@/utils/pr/format';
import { showToast } from '@/valtio/global/global.actions';

import PitchDetail from './PitchDetail';
import PitchDraftDialog from './PitchDraftDialog';
import { PITCH_TONES, Pill, useDates, usePrError } from './ui';

const STATUSES: PrPitchStatus[] = ['DRAFT', 'SENDING', 'SENT', 'REPLIED', 'DECLINED', 'PUBLISHED', 'BOUNCED', 'FAILED'];

const Pitches = () => {
  const { t } = useTranslation('pr');
  const prError = usePrError();
  const dates = useDates();
  const [studies, setStudies] = useState<PrStudy[]>([]);
  const [studyId, setStudyId] = useState('');
  const [status, setStatus] = useState<PrPitchStatus | ''>('');
  const [pitches, setPitches] = useState<PrPitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [draftOpen, setDraftOpen] = useState(false);

  useEffect(() => {
    PrService.studies()
      .then(setStudies)
      .catch(e => showToast({ status: 'error', text: prError(e, t('ui.loadError')) }));
  }, [prError, t]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPitches(await PrService.pitches({ studyId: studyId ? Number(studyId) : null }));
      setError(null);
    } catch (e) {
      setError(prError(e, t('ui.loadError')));
    } finally {
      setLoading(false);
    }
  }, [studyId, prError, t]);

  useEffect(() => {
    load();
  }, [load]);

  const withFollowUp = useMemo(() => pitchesWithFollowUp(pitches), [pitches]);
  const now = new Date().toISOString();
  const shown = status ? pitches.filter(p => p.status === status) : pitches;
  const open = openId != null ? pitches.find(p => p.id === openId) : undefined;
  const studyOf = (id: number | null) => studies.find(s => s.id === id);

  const changed = (p?: PrPitch) => {
    if (p) setPitches(list => list.map(x => (x.id === p.id ? p : x)));

    load();
  };

  return (
    <Stack gap={1.5}>
      <FilterBar>
        <TextField
          select
          size="small"
          label={t('pitches.study')}
          value={studyId}
          onChange={e => setStudyId(e.target.value)}
          SelectProps={{ displayEmpty: true }}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 240 }}
        >
          <MenuItem value="">{t('ui.all')}</MenuItem>
          {studies.map(s => (
            <MenuItem key={s.id} value={String(s.id)}>
              #{s.number} {s.title}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label={t('pitches.status')}
          value={status}
          onChange={e => setStatus(e.target.value as PrPitchStatus | '')}
          SelectProps={{ displayEmpty: true }}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 170 }}
        >
          <MenuItem value="">{t('ui.all')}</MenuItem>
          {STATUSES.map(s => (
            <MenuItem key={s} value={s}>
              {t(`status.${s}`)}
            </MenuItem>
          ))}
        </TextField>
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" onClick={load}>
          {t('ui.refresh')}
        </Button>
        <Button variant="contained" onClick={() => setDraftOpen(true)}>
          {t('pitches.newDraft')}
        </Button>
      </FilterBar>

      <TableCard minWidth={980}>
        <thead>
          <tr>
            <Th>{t('pitches.recipient')}</Th>
            <Th>{t('pitches.subject')}</Th>
            <Th>{t('pitches.study')}</Th>
            <Th>{t('pitches.status')}</Th>
            <Th>{t('pitches.decision')}</Th>
            <Th>{t('pitches.sentCol')}</Th>
          </tr>
        </thead>
        <tbody>
          {loading && pitches.length === 0 && <SkeletonRows cols={6} />}
          {error && <TableMessageRow cols={6} tone="error" title={error} />}
          {!loading && !error && shown.length === 0 && <TableMessageRow cols={6} title={t('pitches.empty')} />}
          {shown.map(p => {
            const s = studyOf(p.studyId);
            const a = pitchActions(p, withFollowUp.has(p.id), now);

            return (
              <Box component="tr" key={p.id} sx={rowSx()} onClick={() => setOpenId(p.id)}>
                <Box component="td" sx={{ ...tdSx, fontWeight: 600 }}>
                  {p.contactName || p.contactEmail}
                  <Box component="span" sx={cellSubSx}>
                    {p.outletName ?? p.contactEmail}
                  </Box>
                </Box>
                <Box component="td" sx={{ ...tdSx, whiteSpace: 'normal', minWidth: 260 }}>
                  {p.subject}
                  <Box component="span" sx={cellSubSx}>
                    {t(`template.${p.template}`)}
                  </Box>
                </Box>
                <Box component="td" sx={tdSx}>
                  {s ? `#${s.number}` : '—'}
                </Box>
                <Box component="td" sx={tdSx}>
                  <Pill tone={PITCH_TONES[p.status]}>{t(`status.${p.status}`)}</Pill>
                </Box>
                <Box component="td" sx={tdSx}>
                  {p.status === 'DRAFT' && (
                    <Chip
                      size="small"
                      color={p.decision === 'ALLOWED' ? 'success' : 'warning'}
                      label={t(decisionLabelKey(p.decision))}
                    />
                  )}
                  {p.status === 'FAILED' && (
                    <Box component="span" sx={{ color: bbColors.red700, fontSize: 12.5 }}>
                      {t('pitches.failedShort')}
                    </Box>
                  )}
                </Box>
                <Box component="td" sx={tdSx}>
                  {p.sentAt ? dates.dateTime(p.sentAt) : '—'}
                  {a.followUp !== 'hidden' && (
                    <Box
                      component="span"
                      sx={{ ...cellSubSx, color: a.followUp === 'ready' ? bbColors.amber800 : cellSubSx.color }}
                    >
                      {t('pitches.followUpFrom', { date: dates.day(a.followUpOn) })}
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })}
        </tbody>
      </TableCard>

      {open && (
        <PitchDetail
          pitch={open}
          hasFollowUp={withFollowUp.has(open.id)}
          onClose={() => setOpenId(null)}
          onChanged={changed}
        />
      )}
      <PitchDraftDialog
        open={draftOpen}
        studies={studies}
        studyId={studyId ? Number(studyId) : null}
        onClose={() => setDraftOpen(false)}
        onCreated={p => {
          setDraftOpen(false);
          load();
          setOpenId(p.id);
        }}
      />
    </Stack>
  );
};

export default Pitches;
