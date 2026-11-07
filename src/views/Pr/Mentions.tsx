/* PR → Spominjanja: pages that name us, found in the alert feeds (Google Alerts, Talkwalker, RSS; read every 6 h).
 * "Bez linka" lists the ones that do not link to us: candidates to ask for a link. Below, the feeds themselves. */
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
} from '@mui/material';

import {
  CardHead,
  DeskCard,
  FilterBar,
  Pager,
  SkeletonRows,
  TableCard,
  TableMessageRow,
  Th,
  cellSubSx,
  tdSx,
} from '@/components/Desk';
import PrService from '@/services/pr.service';
import { bbColors } from '@/styles/bb';
import { PrAlertFeed, PrMention, PrMentionStatus } from '@/types/pr.type';
import { showToast } from '@/valtio/global/global.actions';

import { ExtLink, useDates, usePrError } from './ui';

const STATUSES: PrMentionStatus[] = ['NEW', 'ASK_FOR_LINK', 'ASKED', 'LINKED', 'IGNORED'];

const PAGE_SIZE = 50;

const Feeds = () => {
  const { t } = useTranslation('pr');
  const prError = usePrError();
  const dates = useDates();
  const [feeds, setFeeds] = useState<PrAlertFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setFeeds(await PrService.feeds());
    } catch (e) {
      showToast({ status: 'error', text: prError(e, t('ui.loadError')) });
    } finally {
      setLoading(false);
    }
  }, [prError, t]);

  useEffect(() => {
    load();
  }, [load]);

  const valid = !!name.trim() && /^https?:\/\/\S+$/i.test(url.trim());

  const add = async (e: FormEvent) => {
    e.preventDefault();

    if (!valid || busy) return;

    setBusy(true);
    try {
      const f = await PrService.createFeed({ name: name.trim(), url: url.trim() });

      setFeeds(list => [...list, f]);
      setName('');
      setUrl('');
      showToast({ status: 'success', text: t('mentions.feedAdded') });
    } catch (x) {
      showToast({ status: 'error', text: prError(x) });
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (f: PrAlertFeed) => {
    try {
      const u = await PrService.updateFeed(f.id, { enabled: !f.enabled });

      setFeeds(list => list.map(x => (x.id === u.id ? u : x)));
    } catch (e) {
      showToast({ status: 'error', text: prError(e) });
    }
  };

  return (
    <DeskCard>
      <CardHead title={t('mentions.feedsTitle')} hint={t('mentions.feedsHint')} />
      <Box sx={{ overflowX: 'auto' }}>
        <Box component="table" sx={{ width: '100%', minWidth: 720, borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <Th>{t('mentions.feedName')}</Th>
              <Th>{t('mentions.feedUrl')}</Th>
              <Th>{t('mentions.lastFetched')}</Th>
              <Th>{t('mentions.enabled')}</Th>
            </tr>
          </thead>
          <tbody>
            {loading && <SkeletonRows cols={4} rows={2} />}
            {!loading && feeds.length === 0 && <TableMessageRow cols={4} title={t('mentions.noFeeds')} />}
            {feeds.map(f => (
              <tr key={f.id}>
                <Box component="td" sx={{ ...tdSx, fontWeight: 600 }}>
                  {f.name}
                </Box>
                <Box component="td" sx={{ ...tdSx, maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {f.url}
                </Box>
                <Box component="td" sx={{ ...tdSx, whiteSpace: 'normal' }}>
                  {dates.dateTime(f.lastFetchedAt)}
                  {f.lastError && (
                    <Box component="span" sx={{ ...cellSubSx, color: bbColors.red700 }}>
                      {f.lastError}
                    </Box>
                  )}
                </Box>
                <Box component="td" sx={tdSx}>
                  <Switch
                    checked={f.enabled}
                    onChange={() => toggle(f)}
                    inputProps={{ 'aria-label': t('mentions.enabled') }}
                  />
                </Box>
              </tr>
            ))}
          </tbody>
        </Box>
      </Box>
      <Stack
        component="form"
        onSubmit={add}
        direction={{ xs: 'column', sm: 'row' }}
        gap={1}
        sx={{ p: '12px 16px', borderTop: `1px solid ${bbColors.gray100}` }}
      >
        <TextField size="small" label={t('mentions.feedName')} value={name} onChange={e => setName(e.target.value)} />
        <TextField
          size="small"
          fullWidth
          label={t('mentions.feedUrl')}
          placeholder="https://www.google.com/alerts/feeds/…"
          value={url}
          onChange={e => setUrl(e.target.value)}
        />
        <Button type="submit" variant="contained" disabled={busy || !valid} sx={{ flexShrink: 0 }}>
          {busy ? <CircularProgress size={18} /> : t('mentions.addFeed')}
        </Button>
      </Stack>
    </DeskCard>
  );
};

const Mentions = () => {
  const { t } = useTranslation('pr');
  const prError = usePrError();
  const dates = useDates();
  const [status, setStatus] = useState<PrMentionStatus | ''>('');
  const [unlinked, setUnlinked] = useState(false);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<PrMention[]>([]);
  const [total, setTotal] = useState({ elements: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await PrService.mentions({
        status: status || null,
        linksToUs: unlinked ? false : null,
        page,
        size: PAGE_SIZE,
      });

      setRows(res.content);
      setTotal({ elements: res.page.totalElements, pages: Math.max(1, res.page.totalPages) });
      setError(null);
    } catch (e) {
      setError(prError(e, t('ui.loadError')));
    } finally {
      setLoading(false);
    }
  }, [status, unlinked, page, prError, t]);

  useEffect(() => {
    load();
  }, [load]);

  const setMentionStatus = async (m: PrMention, next: PrMentionStatus) => {
    try {
      const u = await PrService.setMentionStatus(m.id, { status: next });

      setRows(list => list.map(x => (x.id === u.id ? u : x)));
    } catch (e) {
      showToast({ status: 'error', text: prError(e) });
    }
  };

  const linkText = (v: boolean | null) => {
    if (v === null) return t('mentions.linkUnknown');

    return v ? t('ui.yes') : t('ui.no');
  };

  return (
    <Stack gap={1.5}>
      <FilterBar>
        <TextField
          select
          size="small"
          label={t('mentions.status')}
          value={status}
          onChange={e => {
            setStatus(e.target.value as PrMentionStatus | '');
            setPage(0);
          }}
          SelectProps={{ displayEmpty: true }}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 170 }}
        >
          <MenuItem value="">{t('ui.all')}</MenuItem>
          {STATUSES.map(s => (
            <MenuItem key={s} value={s}>
              {t(`mentionStatus.${s}`)}
            </MenuItem>
          ))}
        </TextField>
        <FormControlLabel
          control={
            <Checkbox
              checked={unlinked}
              onChange={e => {
                setUnlinked(e.target.checked);
                setPage(0);
              }}
            />
          }
          label={t('mentions.unlinkedOnly')}
        />
      </FilterBar>

      <TableCard
        minWidth={900}
        footer={
          <Pager
            page={page + 1}
            totalPages={total.pages}
            onChange={p => setPage(p - 1)}
            range={t('mentions.total', { count: total.elements })}
            prevLabel={t('ui.prev')}
            nextLabel={t('ui.next')}
            pageLabel={t('ui.page', { page: page + 1, total: total.pages })}
          />
        }
      >
        <thead>
          <tr>
            <Th>{t('mentions.page')}</Th>
            <Th>{t('mentions.source')}</Th>
            <Th>{t('mentions.linksToUs')}</Th>
            <Th>{t('mentions.foundAt')}</Th>
            <Th>{t('mentions.status')}</Th>
          </tr>
        </thead>
        <tbody>
          {loading && rows.length === 0 && <SkeletonRows cols={5} />}
          {error && <TableMessageRow cols={5} tone="error" title={error} />}
          {!loading && !error && rows.length === 0 && <TableMessageRow cols={5} title={t('mentions.empty')} />}
          {rows.map(m => (
            <tr key={m.id}>
              <Box component="td" sx={{ ...tdSx, whiteSpace: 'normal', maxWidth: 440 }}>
                <Box sx={{ fontWeight: 600 }}>{m.title || '—'}</Box>
                <ExtLink href={m.url} />
              </Box>
              <Box component="td" sx={tdSx}>
                {m.feedName ?? m.source}
                {m.feedName && (
                  <Box component="span" sx={cellSubSx}>
                    {m.source}
                  </Box>
                )}
              </Box>
              <Box
                component="td"
                sx={{ ...tdSx, color: m.linksToUs === false ? bbColors.amber800 : undefined, fontWeight: 600 }}
              >
                {linkText(m.linksToUs)}
              </Box>
              <Box component="td" sx={tdSx}>
                {dates.dateTime(m.foundAt)}
              </Box>
              <Box component="td" sx={tdSx}>
                <TextField
                  select
                  size="small"
                  value={m.status}
                  onChange={e => setMentionStatus(m, e.target.value as PrMentionStatus)}
                  inputProps={{ 'aria-label': t('mentions.status') }}
                  sx={{ minWidth: 160 }}
                >
                  {STATUSES.map(s => (
                    <MenuItem key={s} value={s}>
                      {t(`mentionStatus.${s}`)}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </tr>
          ))}
        </tbody>
      </TableCard>

      <Feeds />
    </Stack>
  );
};

export default Mentions;
