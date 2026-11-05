/* PR → Objave i linkovi: articles that used one of our studies and the state of their link to us (checked weekly by
 * the backend; "Provjeri sad" fetches the page now). BLOCKED_UNKNOWN means the site refused our bot, not that the link
 * is gone. An alert stays until "Ukloni upozorenje". */
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';

import { FilterBar, SkeletonRows, TableCard, TableMessageRow, Th, cellSubSx, tdSx } from '@/components/Desk';
import PrService from '@/services/pr.service';
import { bbColors } from '@/styles/bb';
import { PrOutlet, PrPlacement, PrPlacementRequest, PrStudy } from '@/types/pr.type';
import { linkStateTone } from '@/utils/pr/format';
import { showToast } from '@/valtio/global/global.actions';

import { ExtLink, useDates, usePrError } from './ui';

const EMPTY = { articleUrl: '', studyId: '', outletId: '', publishedOn: '', targetUrl: '', anchorText: '' };

const AddPlacement = ({
  open,
  studies,
  outlets,
  onClose,
  onSaved,
}: {
  open: boolean;
  studies: PrStudy[];
  outlets: PrOutlet[];
  onClose(): void;
  onSaved(): void;
}) => {
  const { t } = useTranslation('pr');
  const prError = usePrError();
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setForm(EMPTY);
  }, [open]);

  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setForm(f => ({ ...f, [k]: e.target.value }));
  const valid = /^https?:\/\/\S+$/i.test(form.articleUrl.trim());

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    if (!valid || busy) return;

    const body: PrPlacementRequest = {
      articleUrl: form.articleUrl.trim(),
      studyId: form.studyId ? Number(form.studyId) : null,
      outletId: form.outletId ? Number(form.outletId) : null,
      publishedOn: form.publishedOn || null,
      targetUrl: form.targetUrl.trim() || null,
      anchorText: form.anchorText.trim() || null,
    };

    setBusy(true);
    try {
      await PrService.createPlacement(body);
      showToast({ status: 'success', text: t('placements.saved') });
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
        <DialogTitle>{t('placements.newTitle')}</DialogTitle>
        <DialogContent>
          <Stack gap={1.5} sx={{ pt: 1 }}>
            <TextField
              size="small"
              required
              label={t('placements.articleUrl')}
              placeholder="https://"
              value={form.articleUrl}
              onChange={set('articleUrl')}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5}>
              <TextField
                select
                size="small"
                fullWidth
                label={t('placements.study')}
                value={form.studyId}
                onChange={set('studyId')}
                SelectProps={{ displayEmpty: true }}
                InputLabelProps={{ shrink: true }}
              >
                <MenuItem value="">—</MenuItem>
                {studies.map(s => (
                  <MenuItem key={s.id} value={String(s.id)}>
                    #{s.number} {s.title}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                fullWidth
                label={t('placements.outlet')}
                value={form.outletId}
                onChange={set('outletId')}
                SelectProps={{ displayEmpty: true }}
                InputLabelProps={{ shrink: true }}
              >
                <MenuItem value="">—</MenuItem>
                {outlets.map(o => (
                  <MenuItem key={o.id} value={String(o.id)}>
                    {o.name} ({o.market})
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <TextField
              size="small"
              type="date"
              label={t('placements.publishedOn')}
              value={form.publishedOn}
              onChange={set('publishedOn')}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              size="small"
              label={t('placements.targetUrl')}
              placeholder="https://www.boat4you.com/…"
              value={form.targetUrl}
              onChange={set('targetUrl')}
              helperText={t('placements.targetHint')}
            />
            <TextField
              size="small"
              label={t('placements.anchorText')}
              value={form.anchorText}
              onChange={set('anchorText')}
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

const Placements = () => {
  const { t } = useTranslation('pr');
  const prError = usePrError();
  const dates = useDates();
  const [studies, setStudies] = useState<PrStudy[]>([]);
  const [outlets, setOutlets] = useState<PrOutlet[]>([]);
  const [studyId, setStudyId] = useState('');
  const [rows, setRows] = useState<PrPlacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set());
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    Promise.all([PrService.studies(), PrService.outlets()])
      .then(([s, o]) => {
        setStudies(s);
        setOutlets(o);
      })
      .catch(e => showToast({ status: 'error', text: prError(e, t('ui.loadError')) }));
  }, [prError, t]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await PrService.placements({ studyId: studyId ? Number(studyId) : null }));
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

  /** One call per row at a time ("Provjeri sad" takes up to ~15 s). */
  const act = async (p: PrPlacement, call: () => Promise<PrPlacement>, done: string) => {
    if (busyIds.has(p.id)) return;

    setBusyIds(s => new Set(s).add(p.id));
    try {
      const updated = await call();

      setRows(list => list.map(x => (x.id === updated.id ? updated : x)));
      showToast({ status: 'success', text: done });
    } catch (e) {
      showToast({ status: 'error', text: prError(e) });
    } finally {
      setBusyIds(s => {
        const n = new Set(s);

        n.delete(p.id);

        return n;
      });
    }
  };

  return (
    <Stack gap={1.5}>
      <FilterBar>
        <TextField
          select
          size="small"
          label={t('placements.study')}
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
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" onClick={() => setAddOpen(true)}>
          {t('placements.new')}
        </Button>
      </FilterBar>

      <TableCard minWidth={1040}>
        <thead>
          <tr>
            <Th>{t('placements.article')}</Th>
            <Th>{t('placements.state')}</Th>
            <Th>{t('placements.lastGood')}</Th>
            <Th>{t('placements.checked')}</Th>
            <Th align="right">{t('placements.rank')}</Th>
            <Th align="right"> </Th>
          </tr>
        </thead>
        <tbody>
          {loading && rows.length === 0 && <SkeletonRows cols={6} />}
          {error && <TableMessageRow cols={6} tone="error" title={error} />}
          {!loading && !error && rows.length === 0 && <TableMessageRow cols={6} title={t('placements.empty')} />}
          {rows.map(p => {
            const busy = busyIds.has(p.id);

            return (
              <tr key={p.id}>
                <Box component="td" sx={{ ...tdSx, whiteSpace: 'normal', maxWidth: 380 }}>
                  <Box sx={{ fontWeight: 600 }}>{p.outletName ?? '—'}</Box>
                  <ExtLink href={p.articleUrl} />
                  {p.publishedOn && (
                    <Box component="span" sx={cellSubSx}>
                      {dates.day(p.publishedOn)}
                    </Box>
                  )}
                </Box>
                <Box component="td" sx={{ ...tdSx, whiteSpace: 'normal' }}>
                  <Chip size="small" color={linkStateTone(p.linkState)} label={t(`linkState.${p.linkState}`)} />
                  {p.alert && (
                    <Box component="span" sx={{ ...cellSubSx, color: bbColors.red700, fontWeight: 600 }}>
                      {t('placements.alert')}
                      {p.alertReason && `: ${p.alertReason}`}
                    </Box>
                  )}
                </Box>
                <Box component="td" sx={tdSx}>
                  {p.lastGoodState ? t(`linkState.${p.lastGoodState}`) : '—'}
                </Box>
                <Box component="td" sx={tdSx}>
                  {dates.dateTime(p.lastCheckedAt)}
                  {p.lastHttpStatus != null && p.lastHttpStatus >= 0 && (
                    <Box component="span" sx={cellSubSx}>
                      HTTP {p.lastHttpStatus}
                    </Box>
                  )}
                </Box>
                <Box component="td" sx={{ ...tdSx, textAlign: 'right' }}>
                  {p.domainRank ?? '—'}
                </Box>
                <Box component="td" sx={{ ...tdSx, textAlign: 'right' }}>
                  <Button
                    size="small"
                    variant="text"
                    disabled={busy}
                    onClick={() => act(p, () => PrService.checkPlacement(p.id), t('placements.checkedNow'))}
                  >
                    {busy ? <CircularProgress size={16} /> : t('placements.checkNow')}
                  </Button>
                  {p.alert && (
                    <Button
                      size="small"
                      variant="text"
                      disabled={busy}
                      onClick={() => act(p, () => PrService.clearPlacementAlert(p.id), t('placements.alertCleared'))}
                    >
                      {t('placements.clearAlert')}
                    </Button>
                  )}
                </Box>
              </tr>
            );
          })}
        </tbody>
      </TableCard>

      <AddPlacement
        open={addOpen}
        studies={studies}
        outlets={outlets}
        onClose={() => setAddOpen(false)}
        onSaved={() => {
          setAddOpen(false);
          load();
        }}
      />
    </Stack>
  );
};

export default Placements;
