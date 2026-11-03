/* Objave → Objave: the month as a calendar (or a list by day), filters by status and channel, and one post's detail
 * with the state of every channel (published link, the network's error, retry / cancel / edit / duplicate). */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';

import { DeskCard, DeskTabs, EmptyState, FilterBar } from '@/components/Desk';
import SocialService from '@/services/social.service';
import { errorMessage } from '@/services/yacht-media.api';
import { bbColors } from '@/styles/bb';
import { SocialPlatform, SocialPost, SocialPostStatus } from '@/types/social.type';
import { SITE_IDS, siteLabel } from '@/utils/contactCenter/safeLink';
import { addMonths, dayKey, gridRange, groupByDay, monthGrid, postTime } from '@/utils/social/calendar';
import { PLATFORMS, PLATFORM_RULES, canCancel, canDelete, canRetry, isEditable } from '@/utils/social/rules';
import { showToast } from '@/valtio/global/global.actions';

import { AccountsState, PlatformBadge, StatusPill, excerpt, useDateFormat } from './ui';

const STATUSES: SocialPostStatus[] = [
  'DRAFT',
  'SCHEDULED',
  'PUBLISHING',
  'PUBLISHED',
  'PARTIAL',
  'FAILED',
  'CANCELLED',
];

type View = 'calendar' | 'list';

const dayColor = (isToday: boolean, inMonth: boolean) => {
  if (isToday) return '#fff';

  return inMonth ? bbColors.navy900 : bbColors.gray450;
};

/** One page holds the month: a post a day on every channel is ~42 posts. */
const PAGE_SIZE = 500;

const CHIP_COLORS: Record<SocialPostStatus, { bg: string; fg: string }> = {
  DRAFT: { bg: bbColors.gray100, fg: bbColors.gray600 },
  SCHEDULED: { bg: bbColors.info100, fg: bbColors.navy700 },
  PUBLISHING: { bg: bbColors.progress100, fg: bbColors.progress700 },
  PUBLISHED: { bg: bbColors.green100, fg: bbColors.green700 },
  PARTIAL: { bg: bbColors.amber100, fg: bbColors.amber800 },
  FAILED: { bg: bbColors.red100, fg: bbColors.red700 },
  CANCELLED: { bg: bbColors.gray100, fg: bbColors.gray450 },
};

const CalendarChip = ({ post, onOpen }: { post: SocialPost; onOpen(): void }) => {
  const { t } = useTranslation('social');
  const fmt = useDateFormat();
  const c = CHIP_COLORS[post.status];
  const platforms = Array.from(new Set(post.targets.map(x => x.platform)));

  return (
    <Box
      component="button"
      type="button"
      onClick={onOpen}
      title={`${t(`status.${post.status}`)} — ${excerpt(post.text, 200)}`}
      sx={{
        display: 'block',
        width: '100%',
        p: '3px 5px',
        border: 0,
        borderRadius: '6px',
        bgcolor: c.bg,
        color: c.fg,
        textAlign: 'left',
        fontFamily: 'inherit',
        fontSize: 11.5,
        cursor: 'pointer',
        textDecoration: post.status === 'CANCELLED' ? 'line-through' : 'none',
        '&:hover': { filter: 'brightness(0.96)' },
      }}
    >
      <Stack direction="row" alignItems="center" gap="3px" sx={{ mb: '1px' }}>
        <Box component="span" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
          {fmt.time(postTime(post))}
        </Box>
        {platforms.slice(0, 5).map(p => (
          <PlatformBadge key={p} platform={p} size={14} />
        ))}
      </Stack>
      <Box
        component="span"
        sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {excerpt(post.text, 40) || t('posts.noText')}
      </Box>
    </Box>
  );
};

type DialogAction = 'cancel' | 'retry' | 'delete';

const PostDialog = ({
  post,
  onClose,
  onChanged,
}: {
  post: SocialPost | null;
  onClose(): void;
  onChanged(p: SocialPost | null, removedId?: number): void;
}) => {
  const { t } = useTranslation('social');
  const fmt = useDateFormat();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<DialogAction | null>(null);

  if (!post) return null;

  const run = async (action: DialogAction) => {
    if (action === 'cancel' && !window.confirm(t('detail.confirmCancel'))) return;

    if (action === 'delete' && !window.confirm(t('detail.confirmDelete'))) return;

    setBusy(action);
    try {
      if (action === 'cancel') {
        onChanged(await SocialService.cancel(post.id));
        showToast({ status: 'success', text: t('detail.cancelled') });
      } else if (action === 'retry') {
        onChanged(await SocialService.retry(post.id));
        showToast({ status: 'success', text: t('detail.retried') });
      } else {
        await SocialService.remove(post.id);
        onChanged(null, post.id);
        showToast({ status: 'success', text: t('detail.deleted') });
      }
    } catch (e) {
      showToast({ status: 'error', text: errorMessage(e, t('detail.actionError')) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth aria-labelledby="social-post-title">
      <DialogTitle id="social-post-title">
        <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
          {t('detail.title', { id: post.id })}
          <StatusPill status={post.status} />
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Stack gap={1.5}>
          <Box sx={{ fontSize: 12.5, color: bbColors.gray600 }}>
            {post.scheduledAt && (
              <div>
                {t('detail.scheduledFor')}: <strong>{fmt.dateTime(post.scheduledAt)}</strong>
              </div>
            )}
            {post.publishedAt && (
              <div>
                {t('detail.publishedAt')}: <strong>{fmt.dateTime(post.publishedAt)}</strong>
              </div>
            )}
            <div>
              {t(`source.${post.source}`)}
              {post.createdBy ? ` · ${post.createdBy}` : ''} · {fmt.dateTime(post.createdAt)}
            </div>
            {post.note && (
              <div>
                {t('detail.note')}: {post.note}
              </div>
            )}
          </Box>
          <Typography sx={{ fontSize: 14, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', color: bbColors.navy900 }}>
            {post.text || t('posts.noText')}
          </Typography>
          {post.link && (
            <Typography sx={{ fontSize: 12.5, overflowWrap: 'anywhere' }}>
              {t('detail.link')}: {post.link}
            </Typography>
          )}
          {post.media.length > 0 && (
            <Stack direction="row" gap={0.75} flexWrap="wrap">
              {post.media.map(m => (
                <Box
                  key={m.id}
                  component="img"
                  src={m.thumbnailUrl ?? m.url}
                  alt={m.fileName}
                  sx={{ width: 72, height: 72, objectFit: 'cover', borderRadius: '8px', bgcolor: bbColors.navy900 }}
                />
              ))}
            </Stack>
          )}
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: bbColors.gray600, mb: 0.75 }}>
              {t('detail.channels')}
            </Typography>
            <Stack gap={0.75}>
              {post.targets.map(x => (
                <Box
                  key={x.id}
                  sx={{ border: `1px solid ${bbColors.cardBorder}`, borderRadius: '10px', p: '8px 10px' }}
                >
                  <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                    <PlatformBadge platform={x.platform} />
                    <Box sx={{ fontSize: 13, fontWeight: 600, flex: 1, minWidth: 120 }}>{x.accountName}</Box>
                    <StatusPill status={x.status} />
                    {x.externalUrl && /^https:\/\//.test(x.externalUrl) && (
                      <Link
                        href={x.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ fontSize: 12.5, display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                      >
                        {t('detail.open')} <OpenInNewRoundedIcon sx={{ fontSize: 14 }} />
                      </Link>
                    )}
                  </Stack>
                  {x.text && (
                    <Typography sx={{ fontSize: 12, color: bbColors.gray600, mt: 0.5, whiteSpace: 'pre-wrap' }}>
                      {excerpt(x.text, 160)}
                    </Typography>
                  )}
                  {x.error && (
                    <Typography sx={{ fontSize: 12, color: bbColors.red700, mt: 0.5, overflowWrap: 'anywhere' }}>
                      {x.error}
                      {x.attempts > 1 ? ` (${t('detail.attempts', { count: x.attempts })})` : ''}
                    </Typography>
                  )}
                </Box>
              ))}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ flexWrap: 'wrap', gap: 1 }}>
        {canDelete(post) && (
          <Button color="error" variant="text" disabled={!!busy} onClick={() => run('delete')}>
            {t('detail.delete')}
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        {canCancel(post) && (
          <Button variant="outlined" disabled={!!busy} onClick={() => run('cancel')}>
            {busy === 'cancel' ? <CircularProgress size={18} /> : t('detail.cancel')}
          </Button>
        )}
        {canRetry(post) && (
          <Button variant="outlined" disabled={!!busy} onClick={() => run('retry')}>
            {busy === 'retry' ? <CircularProgress size={18} /> : t('detail.retry')}
          </Button>
        )}
        <Button variant="outlined" onClick={() => navigate(`/social/new?copy=${post.id}`)}>
          {t('detail.duplicate')}
        </Button>
        {isEditable(post) && (
          <Button variant="contained" onClick={() => navigate(`/social/edit/${post.id}`)}>
            {t('detail.edit')}
          </Button>
        )}
        <Button variant="text" onClick={onClose}>
          {t('detail.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const Posts = ({ accounts }: { accounts: AccountsState }) => {
  const { t } = useTranslation('social');
  const fmt = useDateFormat();
  const navigate = useNavigate();
  const small = useMediaQuery('(max-width: 899px)', { noSsr: true });
  const today = new Date();

  const [{ year, month0 }, setMonth] = useState({ year: today.getFullYear(), month0: today.getMonth() });
  const [view, setView] = useState<View>(small ? 'list' : 'calendar');
  const [status, setStatus] = useState<SocialPostStatus | ''>('');
  const [platform, setPlatform] = useState<SocialPlatform | ''>('');
  const [site, setSite] = useState('');
  const [search, setSearch] = useSearchParams();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<SocialPost | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const range = gridRange(year, month0);
      const page = await SocialService.posts({
        ...range,
        status: status || undefined,
        platform: platform || undefined,
        site: site || undefined,
        size: PAGE_SIZE,
      });

      setPosts(page.content);
      setError(null);
    } catch (e) {
      setError(errorMessage(e, t('posts.loadError')));
    } finally {
      setLoading(false);
    }
  }, [year, month0, status, platform, site, t]);

  // ?post=ID (from AI dnevne objave): open that post.
  useEffect(() => {
    const id = Number(search.get('post'));

    if (!id) return;

    SocialService.post(id)
      .then(setOpen)
      .catch(() => undefined)
      .finally(() => setSearch({}, { replace: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per link
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // A post that is going out changes by itself: look again every 15 s while one is PUBLISHING and the tab is visible.
  useEffect(() => {
    if (!posts.some(p => p.status === 'PUBLISHING')) return undefined;

    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 15000);

    return () => window.clearInterval(id);
  }, [posts, load]);

  const byDay = useMemo(() => groupByDay(posts), [posts]);
  const grid = useMemo(() => monthGrid(year, month0), [year, month0]);
  const monthDate = new Date(year, month0, 1);
  const todayKey = dayKey(today);

  const onChanged = (p: SocialPost | null, removedId?: number) => {
    if (removedId) setPosts(list => list.filter(x => x.id !== removedId));
    else if (p) setPosts(list => list.map(x => (x.id === p.id ? p : x)));

    setOpen(p);
  };

  const connectedPlatforms = PLATFORMS.filter(p => accounts.list.some(a => a.platform === p));

  return (
    <Stack gap={1.5}>
      <FilterBar>
        <Stack direction="row" alignItems="center" gap={0.5}>
          <IconButton aria-label={t('posts.prevMonth')} onClick={() => setMonth(addMonths(year, month0, -1))}>
            <ChevronLeftRoundedIcon />
          </IconButton>
          <Typography
            component="h2"
            sx={{
              fontSize: 15,
              fontWeight: 700,
              minWidth: 150,
              textAlign: 'center',
              '&::first-letter': { textTransform: 'uppercase' },
            }}
          >
            {fmt.month(monthDate)}
          </Typography>
          <IconButton aria-label={t('posts.nextMonth')} onClick={() => setMonth(addMonths(year, month0, 1))}>
            <ChevronRightRoundedIcon />
          </IconButton>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setMonth({ year: today.getFullYear(), month0: today.getMonth() })}
          >
            {t('posts.today')}
          </Button>
        </Stack>
        <Box sx={{ flex: 1 }} />
        <TextField
          select
          size="small"
          label={t('posts.status')}
          value={status}
          onChange={e => setStatus(e.target.value as SocialPostStatus | '')}
          SelectProps={{ displayEmpty: true }}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">{t('posts.allStatuses')}</MenuItem>
          {STATUSES.map(s => (
            <MenuItem key={s} value={s}>
              {t(`status.${s}`)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label={t('posts.channel')}
          value={platform}
          onChange={e => setPlatform(e.target.value as SocialPlatform | '')}
          SelectProps={{ displayEmpty: true }}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">{t('posts.allChannels')}</MenuItem>
          {(connectedPlatforms.length ? connectedPlatforms : PLATFORMS).map(p => (
            <MenuItem key={p} value={p}>
              {PLATFORM_RULES[p].label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label={t('posts.site')}
          value={site}
          onChange={e => setSite(e.target.value)}
          SelectProps={{ displayEmpty: true }}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 170 }}
        >
          <MenuItem value="">{t('sites.all')}</MenuItem>
          {SITE_IDS.map(id => (
            <MenuItem key={id} value={id}>
              {siteLabel(id)}
            </MenuItem>
          ))}
        </TextField>
        <DeskTabs<View>
          value={view}
          onChange={setView}
          items={[
            { value: 'calendar', label: t('posts.calendar') },
            { value: 'list', label: t('posts.list') },
          ]}
        />
      </FilterBar>

      {error && <Alert severity="error">{error}</Alert>}

      {view === 'calendar' && (
        <DeskCard sx={{ overflowX: 'auto' }}>
          <Box sx={{ minWidth: 760 }}>
            <Box
              sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', bgcolor: bbColors.tableHead }}
            >
              {grid[0].map(d => (
                <Box
                  key={d.key}
                  sx={{
                    p: '8px 10px',
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: bbColors.tableHeadText,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {fmt.weekdayShort(d.date)}
                </Box>
              ))}
            </Box>
            {grid.map(week => (
              <Box key={week[0].key} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
                {week.map(d => {
                  const list = byDay.get(d.key) ?? [];
                  const past = d.key < todayKey;

                  return (
                    <Box
                      key={d.key}
                      sx={{
                        minHeight: 112,
                        p: '6px',
                        borderTop: `1px solid ${bbColors.gray100}`,
                        borderLeft: `1px solid ${bbColors.gray100}`,
                        bgcolor: d.inMonth ? bbColors.white : bbColors.gray75,
                        position: 'relative',
                        '&:hover .social-add': { opacity: 1 },
                      }}
                    >
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: '4px' }}>
                        <Box
                          component="span"
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: 24,
                            height: 24,
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 700,
                            bgcolor: d.key === todayKey ? bbColors.navy900 : 'transparent',
                            color: dayColor(d.key === todayKey, d.inMonth),
                          }}
                        >
                          {d.date.getDate()}
                        </Box>
                        {!past && (
                          <Box
                            component="button"
                            type="button"
                            className="social-add"
                            aria-label={t('posts.addOnDay', { date: fmt.day(d.date) })}
                            onClick={() => navigate(`/social/new?date=${d.key}`)}
                            sx={{
                              opacity: 0,
                              border: 0,
                              bgcolor: bbColors.yellow500,
                              color: bbColors.yellowText,
                              borderRadius: '6px',
                              width: 22,
                              height: 22,
                              fontWeight: 800,
                              cursor: 'pointer',
                              '&:focus-visible': { opacity: 1 },
                            }}
                          >
                            +
                          </Box>
                        )}
                      </Stack>
                      <Stack gap="3px">
                        {list.slice(0, 3).map(p => (
                          <CalendarChip key={p.id} post={p} onOpen={() => setOpen(p)} />
                        ))}
                        {list.length > 3 && (
                          <Box
                            component="button"
                            type="button"
                            onClick={() => setView('list')}
                            sx={{
                              border: 0,
                              bgcolor: 'transparent',
                              textAlign: 'left',
                              p: '0 4px',
                              fontSize: 11.5,
                              fontWeight: 600,
                              color: bbColors.navy700,
                              cursor: 'pointer',
                            }}
                          >
                            {t('posts.more', { count: list.length - 3 })}
                          </Box>
                        )}
                      </Stack>
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>
        </DeskCard>
      )}

      {view === 'list' && (
        <Stack gap={1.5}>
          {loading && posts.length === 0 && (
            <Stack alignItems="center" sx={{ py: 5 }}>
              <CircularProgress size={26} />
            </Stack>
          )}
          {!loading && !error && posts.length === 0 && (
            <DeskCard sx={{ p: 3 }}>
              <EmptyState
                illustration="sailboat"
                title={t('posts.empty')}
                hint={t('posts.emptyHint')}
                action={
                  <Button variant="contained" onClick={() => navigate('/social/new')}>
                    {t('newPost')}
                  </Button>
                }
              />
            </DeskCard>
          )}
          {Array.from(byDay.entries()).map(([key, list]) => (
            <DeskCard key={key}>
              <Box
                sx={{
                  p: '10px 16px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: key === todayKey ? bbColors.navy700 : bbColors.navy900,
                  borderBottom: `1px solid ${bbColors.gray100}`,
                  '&::first-letter': { textTransform: 'uppercase' },
                }}
              >
                {fmt.day(postTime(list[0]))}
              </Box>
              {list.map(p => (
                <Box
                  key={p.id}
                  component="button"
                  type="button"
                  onClick={() => setOpen(p)}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '52px 1fr', md: '60px 180px 1fr auto' },
                    gap: { xs: '4px 10px', md: 1.5 },
                    alignItems: 'center',
                    width: '100%',
                    p: '10px 16px',
                    border: 0,
                    borderTop: `1px solid ${bbColors.gray100}`,
                    bgcolor: bbColors.white,
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    '&:first-of-type': { borderTop: 0 },
                    '&:hover': { bgcolor: bbColors.gray75 },
                  }}
                >
                  <Box
                    sx={{ fontSize: 13, fontWeight: 700, color: bbColors.navy900, fontVariantNumeric: 'tabular-nums' }}
                  >
                    {fmt.time(postTime(p))}
                  </Box>
                  <Box>
                    <StatusPill status={p.status} />
                  </Box>
                  <Box sx={{ minWidth: 0, gridColumn: { xs: '1 / -1', md: 'auto' } }}>
                    <Typography sx={{ fontSize: 13.5, color: bbColors.navy900 }} noWrap>
                      {excerpt(p.text, 140) || t('posts.noText')}
                    </Typography>
                    {(p.source !== 'ADMIN' || p.note || p.site || p.generating) && (
                      <Typography sx={{ fontSize: 11.5, color: bbColors.gray500 }} noWrap>
                        {[
                          p.site ? siteLabel(p.site) : null,
                          p.source !== 'ADMIN' ? t(`source.${p.source}`) : null,
                          p.generating ? t('posts.generating') : null,
                          p.note,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </Typography>
                    )}
                  </Box>
                  <Stack direction="row" gap="4px" sx={{ gridColumn: { xs: '1 / -1', md: 'auto' } }}>
                    {p.targets.map(x => (
                      <PlatformBadge
                        key={x.id}
                        platform={x.platform}
                        dim={x.status === 'CANCELLED'}
                        title={`${x.accountName} — ${t(`status.${x.status}`)}`}
                      />
                    ))}
                  </Stack>
                </Box>
              ))}
            </DeskCard>
          ))}
        </Stack>
      )}

      <PostDialog post={open} onClose={() => setOpen(null)} onChanged={onChanged} />
    </Stack>
  );
};

export default Posts;
