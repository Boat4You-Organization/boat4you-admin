/* PR → Istraživanja: our own-data studies (number, site, title, page), the thing every pitch and placement points to. */
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';

import { SkeletonRows, TableCard, TableMessageRow, Th, tdSx } from '@/components/Desk';
import PrService from '@/services/pr.service';
import { StatusTone, bbColors } from '@/styles/bb';
import { PrStudy, PrStudyRequest, PrStudyStatus } from '@/types/pr.type';
import { SITE_IDS, siteLabel } from '@/utils/contactCenter/safeLink';
import { showToast } from '@/valtio/global/global.actions';

import { ExtLink, Pill, useDates, usePrError } from './ui';

const STATUSES: PrStudyStatus[] = ['DRAFT', 'LIVE', 'ARCHIVED'];

const TONES: Record<PrStudyStatus, StatusTone> = { DRAFT: 'neutral', LIVE: 'success', ARCHIVED: 'neutral' };

interface Form {
  number: string;
  siteId: string;
  title: string;
  pageUrl: string;
  status: PrStudyStatus;
  publishedOn: string;
  notes: string;
}

const formOf = (s: PrStudy | null, next: number): Form => ({
  number: String(s?.number ?? next),
  siteId: s?.siteId ?? 'boat4you',
  title: s?.title ?? '',
  pageUrl: s?.pageUrl ?? '',
  status: s?.status ?? 'DRAFT',
  publishedOn: s?.publishedOn ?? '',
  notes: s?.notes ?? '',
});

const StudyDialog = ({
  open,
  study,
  next,
  onClose,
  onSaved,
}: {
  open: boolean;
  study: PrStudy | null;
  next: number;
  onClose(): void;
  onSaved(): void;
}) => {
  const { t } = useTranslation('pr');
  const prError = usePrError();
  const [form, setForm] = useState<Form>(formOf(study, next));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setForm(formOf(study, next));
  }, [open, study, next]);

  const set = (k: keyof Form) => (e: { target: { value: string } }) => setForm(f => ({ ...f, [k]: e.target.value }));
  const valid = Number(form.number) >= 1 && !!form.title.trim() && !!form.siteId;

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    if (!valid || busy) return;

    const body: PrStudyRequest = {
      number: Number(form.number),
      siteId: form.siteId,
      title: form.title.trim(),
      pageUrl: form.pageUrl.trim(),
      status: form.status,
      publishedOn: form.publishedOn || null,
      notes: form.notes,
    };

    setBusy(true);
    try {
      if (study) await PrService.updateStudy(study.id, body);
      else await PrService.createStudy(body);

      showToast({ status: 'success', text: t('studies.saved') });
      onSaved();
    } catch (x) {
      showToast({ status: 'error', text: prError(x) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
      <Box component="form" onSubmit={submit}>
        <DialogTitle>{study ? t('studies.editTitle') : t('studies.newTitle')}</DialogTitle>
        <DialogContent>
          <Stack gap={1.5} sx={{ pt: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5}>
              <TextField
                size="small"
                type="number"
                required
                label={t('studies.number')}
                value={form.number}
                onChange={set('number')}
                inputProps={{ min: 1 }}
                sx={{ width: { sm: 120 } }}
              />
              <TextField
                select
                size="small"
                fullWidth
                label={t('studies.site')}
                value={form.siteId}
                onChange={set('siteId')}
              >
                {SITE_IDS.map(id => (
                  <MenuItem key={id} value={id}>
                    {siteLabel(id)}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <TextField size="small" required label={t('studies.title')} value={form.title} onChange={set('title')} />
            <TextField
              size="small"
              label={t('studies.pageUrl')}
              placeholder="https://"
              value={form.pageUrl}
              onChange={set('pageUrl')}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5}>
              <TextField
                select
                size="small"
                fullWidth
                label={t('studies.status')}
                value={form.status}
                onChange={set('status')}
              >
                {STATUSES.map(s => (
                  <MenuItem key={s} value={s}>
                    {t(`studyStatus.${s}`)}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                size="small"
                type="date"
                fullWidth
                label={t('studies.publishedOn')}
                value={form.publishedOn}
                onChange={set('publishedOn')}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
            <TextField
              size="small"
              multiline
              minRows={2}
              label={t('studies.notes')}
              value={form.notes}
              onChange={set('notes')}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={onClose} disabled={busy}>
            {t('ui.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={busy || !valid}>
            {busy ? <CircularProgress size={18} /> : t('ui.save')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

const Studies = () => {
  const { t } = useTranslation('pr');
  const prError = usePrError();
  const dates = useDates();
  const [studies, setStudies] = useState<PrStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<PrStudy | null | undefined>(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setStudies(await PrService.studies());
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

  const next = studies.reduce((max, s) => Math.max(max, s.number), 0) + 1;

  return (
    <Stack gap={1.5}>
      <TableCard
        minWidth={760}
        footer={
          <Stack
            direction="row"
            justifyContent="flex-end"
            sx={{ p: '10px 14px', borderTop: `1px solid ${bbColors.gray100}` }}
          >
            <Button variant="contained" onClick={() => setEditing(null)}>
              {t('studies.new')}
            </Button>
          </Stack>
        }
      >
        <thead>
          <tr>
            <Th>{t('studies.number')}</Th>
            <Th>{t('studies.title')}</Th>
            <Th>{t('studies.site')}</Th>
            <Th>{t('studies.status')}</Th>
            <Th>{t('studies.publishedOn')}</Th>
            <Th>{t('studies.pageUrl')}</Th>
            <Th align="right"> </Th>
          </tr>
        </thead>
        <tbody>
          {loading && studies.length === 0 && <SkeletonRows cols={7} />}
          {error && <TableMessageRow cols={7} tone="error" title={error} />}
          {!loading && !error && studies.length === 0 && <TableMessageRow cols={7} title={t('studies.empty')} />}
          {studies.map(s => (
            <tr key={s.id}>
              <Box component="td" sx={{ ...tdSx, fontWeight: 700 }}>
                #{s.number}
              </Box>
              <Box component="td" sx={{ ...tdSx, whiteSpace: 'normal', fontWeight: 600 }}>
                {s.title}
              </Box>
              <Box component="td" sx={tdSx}>
                {siteLabel(s.siteId)}
              </Box>
              <Box component="td" sx={tdSx}>
                <Pill tone={TONES[s.status]}>{t(`studyStatus.${s.status}`)}</Pill>
              </Box>
              <Box component="td" sx={tdSx}>
                {dates.day(s.publishedOn)}
              </Box>
              <Box component="td" sx={{ ...tdSx, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <ExtLink href={s.pageUrl} />
              </Box>
              <Box component="td" sx={{ ...tdSx, textAlign: 'right' }}>
                <Button size="small" variant="text" onClick={() => setEditing(s)}>
                  {t('ui.edit')}
                </Button>
              </Box>
            </tr>
          ))}
        </tbody>
      </TableCard>

      <StudyDialog
        open={editing !== undefined}
        study={editing ?? null}
        next={next}
        onClose={() => setEditing(undefined)}
        onSaved={() => {
          setEditing(undefined);
          load();
        }}
      />
    </Stack>
  );
};

export default Studies;
