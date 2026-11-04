/* Objave → Nova objava: one text, photos/video, the channels; each channel may get its own text and title. Checks
 * against every channel's rules as you type (utils/social/rules.ts); the backend checks again and the network decides.
 * Publish now asks first: what reaches a network can only be deleted there. */
import { ChangeEvent, DragEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';

import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import PlayCircleOutlineRoundedIcon from '@mui/icons-material/PlayCircleOutlineRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { CardHead, DeskCard, EmptyState } from '@/components/Desk';
import SocialService from '@/services/social.service';
import { errorMessage } from '@/services/yacht-media.api';
import { bbColors } from '@/styles/bb';
import { SocialAccount, SocialPostAction } from '@/types/social.type';
import { SITE_IDS, siteLabel } from '@/utils/contactCenter/safeLink';
import {
  ComposerDraft,
  ComposerMedia,
  ComposerTarget,
  EMPTY_DRAFT,
  PLATFORMS,
  PLATFORM_RULES,
  buildRequest,
  countFor,
  draftFromPost,
  effectiveText,
  isEditable,
  mediaFileProblem,
  parseLocal,
  suggestedSlot,
  toLocalInput,
  validateDraft,
  validateTarget,
} from '@/utils/social/rules';
import { showToast } from '@/valtio/global/global.actions';

import { AccountsState, FieldLabel, IssueList, PlatformBadge, textAreaSx, useDateFormat } from './ui';

interface Upload {
  key: string;
  name: string;
  progress: number;
}

const counterSx = (over: boolean) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  height: 26,
  pl: '3px',
  pr: '9px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
  bgcolor: over ? bbColors.red100 : bbColors.gray100,
  color: over ? bbColors.red700 : bbColors.gray600,
  fontVariantNumeric: 'tabular-nums',
});

const MediaThumb = ({
  media,
  index,
  last,
  onMove,
  onRemove,
}: {
  media: ComposerMedia;
  index: number;
  last: boolean;
  onMove(index: number, delta: number): void;
  onRemove(id: number): void;
}) => {
  const { t } = useTranslation('social');
  const src = media.thumbnailUrl ?? (media.kind === 'IMAGE' ? media.url : null);

  return (
    <Box
      sx={{
        position: 'relative',
        aspectRatio: '1 / 1',
        borderRadius: '10px',
        overflow: 'hidden',
        bgcolor: bbColors.navy900,
        border: `1px solid ${bbColors.cardBorder}`,
      }}
    >
      {src && (
        <Box
          component="img"
          src={src}
          alt={media.fileName ?? ''}
          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
      {media.kind === 'VIDEO' && (
        <PlayCircleOutlineRoundedIcon
          sx={{ position: 'absolute', inset: 0, m: 'auto', color: '#fff', fontSize: 36, opacity: 0.9 }}
        />
      )}
      <Box
        component="span"
        sx={{
          position: 'absolute',
          left: 6,
          top: 6,
          px: '6px',
          borderRadius: '4px',
          bgcolor: 'rgba(11,26,43,.7)',
          color: '#fff',
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        {index + 1}
      </Box>
      <Stack
        direction="row"
        sx={{ position: 'absolute', right: 4, bottom: 4, bgcolor: 'rgba(255,255,255,.92)', borderRadius: '8px' }}
      >
        <IconButton
          size="small"
          aria-label={t('compose.moveLeft')}
          disabled={index === 0}
          onClick={() => onMove(index, -1)}
        >
          <ChevronLeftRoundedIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" aria-label={t('compose.moveRight')} disabled={last} onClick={() => onMove(index, 1)}>
          <ChevronRightRoundedIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" aria-label={t('compose.remove')} onClick={() => onRemove(media.id)}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Box>
  );
};

/** A plain card in the spirit of each network: name, text with line breaks, first photo or video, title if any. */
const PreviewCard = ({
  target,
  text,
  media,
  when,
}: {
  target: ComposerTarget;
  text: string;
  media: ComposerMedia[];
  when: Date | null;
}) => {
  const { t } = useTranslation('social');
  const fmt = useDateFormat();
  const r = PLATFORM_RULES[target.platform];
  const first = media[0];
  const src = first ? (first.thumbnailUrl ?? (first.kind === 'IMAGE' ? first.url : null)) : null;
  const wide = target.platform === 'YOUTUBE' || target.platform === 'LINKEDIN' || target.platform === 'X';

  return (
    <Box sx={{ border: `1px solid ${bbColors.cardBorder}`, borderRadius: '12px', overflow: 'hidden' }}>
      <Stack direction="row" alignItems="center" gap={1} sx={{ p: '10px 12px' }}>
        <PlatformBadge platform={target.platform} size={32} />
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: bbColors.navy900 }} noWrap>
            {target.accountName}
          </Typography>
          <Typography sx={{ fontSize: 11.5, color: bbColors.gray500 }}>
            {r.label} · {when ? fmt.dateTime(when.toISOString()) : t('compose.now')}
          </Typography>
        </Box>
      </Stack>
      {first && (
        <Box
          sx={{
            position: 'relative',
            aspectRatio: wide ? '16 / 9' : '1 / 1',
            bgcolor: bbColors.navy900,
          }}
        >
          {src && <Box component="img" src={src} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          {first.kind === 'VIDEO' && (
            <PlayCircleOutlineRoundedIcon
              sx={{ position: 'absolute', inset: 0, m: 'auto', color: '#fff', fontSize: 48 }}
            />
          )}
          {media.length > 1 && (
            <Box
              component="span"
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                px: '7px',
                borderRadius: 999,
                bgcolor: 'rgba(11,26,43,.75)',
                color: '#fff',
                fontSize: 11.5,
                fontWeight: 700,
              }}
            >
              1/{media.length}
            </Box>
          )}
        </Box>
      )}
      <Box sx={{ p: '10px 12px 12px' }}>
        {target.title.trim() && (
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: bbColors.navy900, mb: 0.5 }}>
            {target.title}
          </Typography>
        )}
        <Typography
          sx={{
            fontSize: 13.5,
            color: bbColors.navy900,
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
            lineHeight: 1.5,
          }}
        >
          {text || (
            <Box component="span" sx={{ color: bbColors.gray450 }}>
              {t('posts.noText')}
            </Box>
          )}
        </Typography>
      </Box>
    </Box>
  );
};

const Composer = ({ editId, accounts }: { editId: number | null; accounts: AccountsState }) => {
  const { t } = useTranslation('social');
  const fmt = useDateFormat();
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const copyId = Number(search.get('copy')) || null;
  const dateParam = search.get('date');

  const [draft, setDraft] = useState<ComposerDraft>(() => ({
    ...EMPTY_DRAFT,
    scheduledLocal:
      dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? `${dateParam}T09:00` : suggestedSlot(new Date()),
  }));
  const [loading, setLoading] = useState(!!(editId || copyId));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [busy, setBusy] = useState<SocialPostAction | null>(null);
  const [attempted, setAttempted] = useState<SocialPostAction | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = editId ?? copyId;

    if (!id) return;

    setLoading(true);
    SocialService.post(id)
      .then(post => {
        if (editId && !isEditable(post)) {
          setLocked(true);

          return;
        }

        const next = draftFromPost(post, !editId);

        setDraft(d => ({ ...next, scheduledLocal: next.scheduledLocal || d.scheduledLocal }));
      })
      .catch(e => setLoadError(errorMessage(e, t('compose.loadError'))))
      .finally(() => setLoading(false));
  }, [editId, copyId, t]);

  const patch = (p: Partial<ComposerDraft>) => setDraft(d => ({ ...d, ...p }));

  const patchTarget = (accountId: number, p: Partial<ComposerTarget>) =>
    setDraft(d => ({ ...d, targets: d.targets.map(x => (x.accountId === accountId ? { ...x, ...p } : x)) }));

  const selected = useMemo(() => new Set(draft.targets.map(x => x.accountId)), [draft.targets]);
  const usable = accounts.list.filter(a => a.status === 'CONNECTED');

  const toggleAccount = (a: SocialAccount) =>
    setDraft(d =>
      d.targets.some(x => x.accountId === a.id)
        ? { ...d, targets: d.targets.filter(x => x.accountId !== a.id) }
        : {
            ...d,
            targets: [
              ...d.targets,
              { accountId: a.id, platform: a.platform, accountName: a.name, customText: null, title: '' },
            ],
          }
    );

  const selectAll = () =>
    setDraft(d => ({
      ...d,
      targets: [
        ...d.targets,
        ...usable
          .filter(a => !d.targets.some(x => x.accountId === a.id))
          .map(a => ({ accountId: a.id, platform: a.platform, accountName: a.name, customText: null, title: '' })),
      ],
    }));

  /** Channels grouped by site (our seven in order), shared channels (YouTube) last. */
  const siteGroups = [...SITE_IDS, null]
    .map(site => ({
      site,
      list: PLATFORMS.flatMap(p => accounts.list.filter(a => a.platform === p && (a.site ?? null) === site)),
    }))
    .filter(g => g.list.length > 0);

  const selectGroup = (list: SocialAccount[]) =>
    setDraft(d => ({
      ...d,
      targets: [
        ...d.targets,
        ...list
          .filter(a => a.status === 'CONNECTED' && !d.targets.some(x => x.accountId === a.id))
          .map(a => ({ accountId: a.id, platform: a.platform, accountName: a.name, customText: null, title: '' })),
      ],
    }));

  /* ---- media ---- */

  const uploadOne = useCallback(
    async (file: File) => {
      const key = `${file.name}-${file.size}-${Math.random()}`;

      setUploads(u => [...u, { key, name: file.name, progress: 0 }]);
      try {
        const media = await SocialService.uploadMedia(file, progress =>
          setUploads(u => u.map(x => (x.key === key ? { ...x, progress } : x)))
        );

        setDraft(d => ({ ...d, media: [...d.media, media] }));
      } catch (e) {
        showToast({ status: 'error', text: errorMessage(e, t('compose.uploadFailed', { name: file.name })) });
      } finally {
        setUploads(u => u.filter(x => x.key !== key));
      }
    },
    [t]
  );

  const addFiles = (files: File[]) => {
    const ok = files.filter(f => {
      const problem = mediaFileProblem(f);

      if (problem) showToast({ status: 'error', text: t(`compose.${problem}`, { name: f.name }) });

      return !problem;
    });

    // One at a time: a few big videos in parallel would starve each other on a slow line.
    ok.reduce((p, f) => p.then(() => uploadOne(f)), Promise.resolve());
  };

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []));
    e.target.value = '';
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files ?? []));
  };

  const moveMedia = (index: number, delta: number) =>
    setDraft(d => {
      const media = [...d.media];
      const to = index + delta;

      if (to < 0 || to >= media.length) return d;

      [media[index], media[to]] = [media[to], media[index]];

      return { ...d, media };
    });

  const removeMedia = (id: number) => setDraft(d => ({ ...d, media: d.media.filter(m => m.id !== id) }));

  /* ---- checks and submit ---- */

  const targetIssues = useMemo(
    () =>
      Object.fromEntries(
        draft.targets.map(x => [x.accountId, validateTarget(x.platform, effectiveText(draft, x), x.title, draft.media)])
      ),
    [draft]
  );

  const attemptCheck = attempted ? validateDraft(draft, attempted, new Date()) : null;

  const send = async (action: SocialPostAction) => {
    setBusy(action);
    try {
      const body = buildRequest(draft, action);
      const saved = editId ? await SocialService.update(editId, body) : await SocialService.create(body);

      if (action === 'DRAFT') showToast({ status: 'success', text: t('compose.saved') });
      else if (action === 'SCHEDULE') {
        showToast({ status: 'success', text: t('compose.scheduled', { date: fmt.dateTime(saved.scheduledAt) }) });
      } else showToast({ status: 'success', text: t('compose.publishing') });

      navigate('/social');
    } catch (e) {
      showToast({ status: 'error', text: errorMessage(e, t('compose.saveError')) });
    } finally {
      setBusy(null);
    }
  };

  const submit = (action: SocialPostAction) => {
    if (uploads.length) {
      showToast({ status: 'warning', text: t('compose.waitUploads') });

      return;
    }

    setAttempted(action);

    const check = validateDraft(draft, action, new Date());

    if (!check.ok) {
      setExpanded(new Set(draft.targets.filter(x => targetIssues[x.accountId]?.length).map(x => x.accountId)));
      showToast({ status: 'error', text: action === 'DRAFT' ? t('compose.nothingToSave') : t('compose.fixFirst') });

      return;
    }

    if (action === 'PUBLISH_NOW') setConfirmOpen(true);
    else send(action);
  };

  /* ---- render ---- */

  if (locked) {
    return (
      <DeskCard sx={{ p: 3 }}>
        <EmptyState
          title={t('compose.notEditable')}
          action={
            <Button variant="contained" onClick={() => navigate(`/social/new?copy=${editId}`)}>
              {t('detail.duplicate')}
            </Button>
          }
        />
      </DeskCard>
    );
  }

  if (loading) {
    return (
      <Stack alignItems="center" sx={{ py: 6 }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (loadError) return <Alert severity="error">{loadError}</Alert>;

  const counters = PLATFORMS.filter(p => draft.targets.some(x => x.platform === p && x.customText == null)).map(p => {
    const count = countFor(p, draft.text);
    const { maxChars } = PLATFORM_RULES[p];

    return { p, count, maxChars, over: count > maxChars };
  });

  const preview = draft.targets.find(x => x.accountId === previewId) ?? draft.targets[0];

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 1.5,
        gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 380px' },
        alignItems: 'start',
      }}
    >
      <Stack gap={1.5} sx={{ minWidth: 0 }}>
        {/* Text */}
        <DeskCard>
          <CardHead title={t('compose.text')} />
          <Stack gap={1.5} sx={{ p: 2 }}>
            <Box
              component="textarea"
              aria-label={t('compose.text')}
              placeholder={t('compose.textPlaceholder')}
              value={draft.text}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => patch({ text: e.target.value })}
              sx={{ ...textAreaSx, minHeight: 180 }}
            />
            {counters.length > 0 && (
              <Stack direction="row" gap={0.75} flexWrap="wrap">
                {counters.map(c => (
                  <Box key={c.p} component="span" sx={counterSx(c.over)}>
                    <PlatformBadge platform={c.p} size={20} />
                    {c.count}/{c.maxChars}
                  </Box>
                ))}
              </Stack>
            )}
            <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
              <Box>
                <FieldLabel htmlFor="social-link">{t('compose.link')}</FieldLabel>
                <TextField
                  id="social-link"
                  size="small"
                  fullWidth
                  placeholder="https://www.boat4you.com/…"
                  value={draft.link}
                  onChange={e => patch({ link: e.target.value })}
                  helperText={t('compose.linkHint')}
                />
              </Box>
              <Box>
                <FieldLabel htmlFor="social-note">{t('compose.note')}</FieldLabel>
                <TextField
                  id="social-note"
                  size="small"
                  fullWidth
                  value={draft.note}
                  onChange={e => patch({ note: e.target.value })}
                  helperText={t('compose.noteHint')}
                />
              </Box>
            </Box>
          </Stack>
        </DeskCard>

        {/* Media */}
        <DeskCard>
          <CardHead title={t('compose.media')} hint={t('compose.mediaHint')} />
          <Stack gap={1.5} sx={{ p: 2 }}>
            <Box
              onDragOver={e => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              sx={{
                border: `1.5px dashed ${dragOver ? bbColors.navy700 : bbColors.fieldBorder}`,
                bgcolor: dragOver ? bbColors.info100 : bbColors.gray75,
                borderRadius: '12px',
                p: 2,
                textAlign: 'center',
                fontSize: 13,
                color: bbColors.gray600,
              }}
            >
              {t('compose.mediaDrop')}{' '}
              <Button size="small" variant="outlined" onClick={() => fileInput.current?.click()}>
                {t('compose.mediaPick')}
              </Button>
              <input
                ref={fileInput}
                type="file"
                hidden
                multiple
                accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                onChange={onPick}
              />
            </Box>
            {uploads.map(u => (
              <Box key={u.key}>
                <Typography sx={{ fontSize: 12, color: bbColors.gray600 }}>
                  {t('compose.uploading', { name: u.name })}
                </Typography>
                <LinearProgress variant="determinate" value={u.progress * 100} />
              </Box>
            ))}
            {draft.media.length > 0 && (
              <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: 'repeat(auto-fill, minmax(112px, 1fr))' }}>
                {draft.media.map((m, i) => (
                  <MediaThumb
                    key={m.id}
                    media={m}
                    index={i}
                    last={i === draft.media.length - 1}
                    onMove={moveMedia}
                    onRemove={removeMedia}
                  />
                ))}
              </Box>
            )}
          </Stack>
        </DeskCard>

        {/* Channels */}
        <DeskCard>
          <CardHead
            title={t('compose.channels')}
            hint={draft.targets.length ? t('compose.selectedCount', { count: draft.targets.length }) : undefined}
            action={
              usable.length > 0 && (
                <Stack direction="row" gap={0.5}>
                  <Button size="small" variant="text" onClick={selectAll}>
                    {t('compose.selectAll')}
                  </Button>
                  <Button size="small" variant="text" onClick={() => patch({ targets: [] })}>
                    {t('compose.selectNone')}
                  </Button>
                </Stack>
              )
            }
          />
          <Box sx={{ p: 2 }}>
            {accounts.loading && <CircularProgress size={22} />}
            {!accounts.loading && accounts.list.length === 0 && (
              <EmptyState
                title={accounts.error ?? t('compose.noChannels')}
                tone={accounts.error ? 'error' : 'empty'}
                action={
                  <Button component={RouterLink} to="/social/channels" variant="contained">
                    {t('compose.connectChannels')}
                  </Button>
                }
              />
            )}
            <Stack gap={1.5}>
              {siteGroups.map(({ site, list }) => (
                <Box key={site ?? 'shared'}>
                  <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 0.75 }}>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: bbColors.navy900 }}>
                      {site ? siteLabel(site) : t('sites.shared')}
                    </Typography>
                    <Button size="small" variant="text" onClick={() => selectGroup(list)} sx={{ minHeight: 0, py: 0 }}>
                      {t('sites.selectSite')}
                    </Button>
                  </Stack>
                  <Stack direction="row" gap={1} flexWrap="wrap">
                    {list.map(a => {
                      const on = selected.has(a.id);
                      const ok = a.status === 'CONNECTED';

                      return (
                        <Box
                          key={a.id}
                          component="button"
                          type="button"
                          aria-pressed={on}
                          disabled={!ok && !on}
                          title={ok ? undefined : t('compose.accountNotUsable')}
                          onClick={() => toggleAccount(a)}
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            minHeight: 38,
                            pl: '6px',
                            pr: '12px',
                            borderRadius: 999,
                            border: `1.5px solid ${on ? bbColors.navy900 : bbColors.fieldBorder}`,
                            bgcolor: on ? bbColors.selectedRow : bbColors.white,
                            color: bbColors.navy900,
                            fontFamily: 'inherit',
                            fontSize: 13,
                            fontWeight: on ? 700 : 500,
                            cursor: ok || on ? 'pointer' : 'not-allowed',
                            opacity: ok ? 1 : 0.55,
                            '&:hover': ok ? { borderColor: bbColors.navy700 } : undefined,
                          }}
                        >
                          <PlatformBadge platform={a.platform} size={26} />
                          {a.name}
                          {on && (
                            <Box component="span" aria-hidden sx={{ color: bbColors.green700, fontWeight: 800 }}>
                              ✓
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>
        </DeskCard>

        {/* Per channel */}
        {draft.targets.length > 0 && (
          <DeskCard>
            <CardHead title={t('compose.perChannel')} hint={t('compose.perChannelHint')} />
            <Box>
              {draft.targets.map(x => {
                const issues = targetIssues[x.accountId] ?? [];
                const errors = issues.filter(i => i.level === 'error').length;
                const open = expanded.has(x.accountId);
                const r = PLATFORM_RULES[x.platform];
                const text = effectiveText(draft, x);
                const known = accounts.list.some(a => a.id === x.accountId);

                return (
                  <Box key={x.accountId} sx={{ borderTop: `1px solid ${bbColors.gray100}` }}>
                    <Box
                      component="button"
                      type="button"
                      aria-expanded={open}
                      onClick={() =>
                        setExpanded(s => {
                          const n = new Set(s);

                          if (n.has(x.accountId)) n.delete(x.accountId);
                          else n.add(x.accountId);

                          return n;
                        })
                      }
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        width: '100%',
                        p: '10px 16px',
                        border: 0,
                        bgcolor: 'transparent',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        textAlign: 'left',
                        color: bbColors.navy900,
                        '&:hover': { bgcolor: bbColors.gray75 },
                      }}
                    >
                      <PlatformBadge platform={x.platform} />
                      <Box sx={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600 }}>
                        {x.accountName}
                        {x.customText != null && (
                          <Box
                            component="span"
                            sx={{ ml: 1, fontSize: 11.5, fontWeight: 600, color: bbColors.navy700 }}
                          >
                            {t('compose.ownText')}
                          </Box>
                        )}
                        {!known && !accounts.loading && (
                          <Box component="span" sx={{ ml: 1, fontSize: 11.5, color: bbColors.red700 }}>
                            {t('compose.accountGone')}
                          </Box>
                        )}
                      </Box>
                      <Box
                        component="span"
                        sx={{ fontSize: 12, fontWeight: 600, color: errors ? bbColors.red700 : bbColors.green700 }}
                      >
                        {errors ? t('compose.problems', { count: errors }) : t('compose.ok')}
                      </Box>
                      <ExpandMoreRoundedIcon
                        sx={{
                          color: bbColors.gray400,
                          transform: open ? 'rotate(180deg)' : 'none',
                          transition: '.15s',
                        }}
                      />
                    </Box>
                    {open && (
                      <Stack gap={1.25} sx={{ p: '4px 16px 14px 48px' }}>
                        {r.title !== 'none' && (
                          <TextField
                            size="small"
                            label={r.title === 'required' ? t('compose.titleRequired') : t('compose.title')}
                            value={x.title}
                            onChange={e => patchTarget(x.accountId, { title: e.target.value })}
                            helperText={`${Array.from(x.title).length}/${r.maxTitle}`}
                          />
                        )}
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={x.customText != null}
                              onChange={e =>
                                patchTarget(x.accountId, { customText: e.target.checked ? draft.text : null })
                              }
                            />
                          }
                          label={<Typography sx={{ fontSize: 13 }}>{t('compose.customText')}</Typography>}
                        />
                        {x.customText != null && (
                          <Box
                            component="textarea"
                            aria-label={`${t('compose.customText')} — ${x.accountName}`}
                            value={x.customText}
                            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                              patchTarget(x.accountId, { customText: e.target.value })
                            }
                            sx={{ ...textAreaSx, minHeight: 110 }}
                          />
                        )}
                        <Typography
                          sx={{
                            fontSize: 12,
                            color: countFor(x.platform, text) > r.maxChars ? bbColors.red700 : bbColors.gray500,
                          }}
                        >
                          {t('compose.chars', { count: countFor(x.platform, text), max: r.maxChars })}
                        </Typography>
                        <IssueList issues={issues} />
                        <Box>
                          <Button
                            size="small"
                            variant="text"
                            color="error"
                            onClick={() => patch({ targets: draft.targets.filter(y => y.accountId !== x.accountId) })}
                          >
                            {t('compose.removeChannel')}
                          </Button>
                        </Box>
                      </Stack>
                    )}
                  </Box>
                );
              })}
            </Box>
          </DeskCard>
        )}

        {/* Actions */}
        <DeskCard sx={{ p: 2, position: { lg: 'sticky' }, bottom: { lg: 12 }, zIndex: 2 }}>
          {attemptCheck && <IssueList issues={attemptCheck.post} sx={{ mb: 1.5 }} />}
          <Stack direction={{ xs: 'column', md: 'row' }} gap={1} alignItems={{ md: 'center' }}>
            <Button variant="outlined" disabled={!!busy} onClick={() => submit('DRAFT')}>
              {busy === 'DRAFT' ? <CircularProgress size={18} /> : t('compose.saveDraft')}
            </Button>
            <Box sx={{ flex: 1 }} />
            <TextField
              type="datetime-local"
              size="small"
              label={t('compose.scheduleAt')}
              value={draft.scheduledLocal}
              onChange={e => patch({ scheduledLocal: e.target.value })}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: toLocalInput(new Date()) }}
              helperText={t('compose.timezone', { tz: Intl.DateTimeFormat().resolvedOptions().timeZone })}
              sx={{ minWidth: 230 }}
            />
            <Button variant="contained" color="secondary" disabled={!!busy} onClick={() => submit('SCHEDULE')}>
              {busy === 'SCHEDULE' ? <CircularProgress size={18} /> : t('compose.schedule')}
            </Button>
            <Button
              variant="contained"
              disabled={!!busy}
              startIcon={<SendRoundedIcon />}
              onClick={() => submit('PUBLISH_NOW')}
            >
              {busy === 'PUBLISH_NOW' ? <CircularProgress size={18} /> : t('compose.publishNow')}
            </Button>
          </Stack>
        </DeskCard>
      </Stack>

      {/* Preview */}
      <DeskCard sx={{ position: { lg: 'sticky' }, top: { lg: 74 } }}>
        <CardHead title={t('compose.preview')} />
        <Box sx={{ p: 2 }}>
          {!preview && (
            <Typography sx={{ fontSize: 13, color: bbColors.gray500 }}>{t('compose.previewEmpty')}</Typography>
          )}
          {preview && (
            <>
              <Stack direction="row" gap={0.75} flexWrap="wrap" sx={{ mb: 1.5 }}>
                {draft.targets.map(x => (
                  <Box
                    key={x.accountId}
                    component="button"
                    type="button"
                    onClick={() => setPreviewId(x.accountId)}
                    aria-pressed={x.accountId === preview.accountId}
                    sx={{
                      p: '2px',
                      border: `2px solid ${x.accountId === preview.accountId ? bbColors.navy900 : 'transparent'}`,
                      borderRadius: '50%',
                      bgcolor: 'transparent',
                      cursor: 'pointer',
                      lineHeight: 0,
                    }}
                  >
                    <PlatformBadge platform={x.platform} title={x.accountName} size={24} />
                  </Box>
                ))}
              </Stack>
              <PreviewCard
                target={preview}
                text={effectiveText(draft, preview)}
                media={draft.media}
                when={draft.scheduledLocal ? parseLocal(draft.scheduledLocal) : null}
              />
            </>
          )}
        </Box>
      </DeskCard>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('compose.confirmPublish', { count: draft.targets.length })}</DialogTitle>
        <DialogContent>
          <Stack direction="row" gap={0.75} flexWrap="wrap" sx={{ mb: 1.5 }}>
            {draft.targets.map(x => (
              <PlatformBadge key={x.accountId} platform={x.platform} title={x.accountName} />
            ))}
          </Stack>
          <Typography sx={{ fontSize: 13, color: bbColors.gray600 }}>{t('compose.confirmPublishHint')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setConfirmOpen(false)}>
            {t('ui.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setConfirmOpen(false);
              send('PUBLISH_NOW');
            }}
          >
            {t('compose.publishNow')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Composer;
