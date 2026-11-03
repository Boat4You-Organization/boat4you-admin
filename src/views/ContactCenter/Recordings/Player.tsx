/* The recording player (P6 R2): the recorded page view replayed in a sandboxed iframe (allow-same-origin only, so nothing
 * recorded can run), play and pause, 1–8×, skipping inactivity, seeking, marks for clicks, rage clicks and errors, and the
 * other pages of the same visit. The recording is decoded in a worker; its stylesheets come from the archive (/replay-assets/). */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box } from '@mui/material';
import { Data } from 'clarity-decode';

import ContactCenterService from '@/services/contactCenter.service';
import { RecDetail } from '@/types/contactCenter.type';
import {
  createSeekQueue,
  formatClock,
  loadErrorKind,
  makeUseproxy,
  markerLeft,
  rewriteDomUrls,
  skipIdle,
  stylesheetPaths,
} from '@/utils/contactCenter/replay';
import { safeHref } from '@/utils/contactCenter/safeLink';
import { SiteChip, formatAt, linkSx } from '@/views/ContactCenter/common';
import { CcButton, LoadAlert, Segmented, cc } from '@/views/ContactCenter/ui';

import { Replay } from './replayEngine';

type Phase = 'loading' | 'ready' | 'gone' | 'busy' | 'failed';

const SPEEDS = ['1', '2', '4', '8'] as const;
const CLOCK_EVERY_MS = 100;

const decodeInWorker = (lines: string[]) =>
  new Promise<Data.DecodedPayload[]>((resolve, reject) => {
    const worker = new Worker(new URL('./decode.worker.ts', import.meta.url), { type: 'module' });

    worker.onmessage = (e: MessageEvent<Data.DecodedPayload[]>) => {
      worker.terminate();
      resolve(e.data);
    };
    worker.onerror = e => {
      worker.terminate();
      reject(new Error(e.message || 'decode worker failed'));
    };
    worker.postMessage(lines);
  });

const Mark = ({ left, color, title, onClick }: { left: number; color: string; title: string; onClick(): void }) => (
  <Box
    component="button"
    type="button"
    title={title}
    aria-label={title}
    onClick={onClick}
    sx={{
      position: 'absolute',
      left: `${left}%`,
      top: 0,
      width: 3,
      height: '100%',
      p: 0,
      border: 0,
      bgcolor: color,
      cursor: 'pointer',
      transform: 'translateX(-1px)',
    }}
  />
);

const Player = ({ id, onOpen, onBack }: { id: number; onOpen(id: number): void; onBack(): void }) => {
  const { t } = useTranslation('contactCenter');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const replayRef = useRef<Replay | null>(null);
  const playingRef = useRef(false);
  const speedRef = useRef(1);
  const skipRef = useRef(true);
  const seeksRef = useRef<ReturnType<typeof createSeekQueue> | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [detail, setDetail] = useState<RecDetail | null>(null);
  const [size, setSize] = useState({ w: 1280, h: 800 });
  const [stageW, setStageW] = useState(1000);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>('1');
  const [skip, setSkip] = useState(true);
  const [noStyles, setNoStyles] = useState(false);

  // Load, decode and draw the first DOM; a new id starts over.
  useEffect(() => {
    let current = true;

    playingRef.current = false;
    setPlaying(false);
    setPhase('loading');
    setTime(0);
    replayRef.current = null;
    seeksRef.current = null;
    (async () => {
      try {
        // The details first: the raw file is fetched (and its view audited) only for a recording the admin can open.
        const { data: d } = await ContactCenterService.recording(id);

        if (!current) return;

        setDetail(d);

        const { data: raw } = await ContactCenterService.recordingRaw(id);

        if (!current) return;

        const lines = raw.split('\n').filter(l => l.trim() !== '');
        const pageUrl = d.row.url ?? 'https://www.boat4you.com/';
        const paths = stylesheetPaths(lines, new URL(pageUrl).host);
        const assets = paths.length
          ? await ContactCenterService.recordingAssets(d.row.siteId, paths)
              .then(r => r.data)
              .catch(() => ({}) as Record<string, string>)
          : {};

        // Preloaded chunks are never archived (P0 S8): only a recording none of whose stylesheets is archived plays without them.
        setNoStyles(paths.length > 0 && Object.keys(assets).length === 0);

        const decoded = await decodeInWorker(lines);

        rewriteDomUrls(decoded, makeUseproxy(pageUrl, assets, window.location.origin));

        if (!current || !iframeRef.current) return;

        const replay = await Replay.create(iframeRef.current, {
          decoded,
          pageUrl,
          assets,
          mobile: d.row.device === 'MOBILE',
          onresize: (w, h) => setSize({ w, h }),
        });

        if (!current) return;

        replayRef.current = replay;
        seeksRef.current = createSeekQueue(at => replay.seek(at));
        setDuration(replay.duration);
        setPhase('ready');
      } catch (e) {
        if (current) setPhase(loadErrorKind(e));
      }
    })();

    return () => {
      current = false;
      playingRef.current = false;
    };
  }, [id]);

  // The stage scales the recorded viewport down to the width at hand.
  useEffect(() => {
    const el = stageRef.current;

    if (!el) return undefined;

    const ro = new ResizeObserver(entries => setStageW(entries[0].contentRect.width));

    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  const pause = () => {
    playingRef.current = false;
    setPlaying(false);
  };

  const play = () => {
    const replay = replayRef.current;
    const seeks = seeksRef.current;

    if (!replay || !seeks || playingRef.current) return;

    if (replay.time >= replay.duration) seeks.seek(0);

    playingRef.current = true;
    setPlaying(true);

    let last = -1;
    let shown = 0;
    const tick = (now: number) => {
      if (!playingRef.current || replayRef.current !== replay) return;

      // The clock starts at the first frame, after any pending seek.
      if (last < 0) last = now;

      let target = replay.time + (now - last) * speedRef.current;

      last = now;

      if (skipRef.current) target = skipIdle(target, replay.times);

      if (target >= replay.duration) {
        replay.advance(replay.duration);
        setTime(replay.duration);
        pause();

        return;
      }

      replay.advance(target);

      if (now - shown >= CLOCK_EVERY_MS) {
        shown = now;
        setTime(target);
      }

      requestAnimationFrame(tick);
    };

    seeks.idle().then(() => requestAnimationFrame(tick));
  };

  const seek = (to: number) => {
    const replay = replayRef.current;

    if (!replay) return;

    pause();

    const target = Math.max(0, Math.min(replay.duration, to));

    setTime(target);
    seeksRef.current?.seek(target);
  };

  const changeSpeed = (v: (typeof SPEEDS)[number]) => {
    setSpeed(v);
    speedRef.current = Number(v);
  };

  const changeSkip = (on: boolean) => {
    setSkip(on);
    skipRef.current = on;
  };

  const scale = Math.min(1, stageW / Math.max(1, size.w));
  const pages = detail?.visitPages ?? [];
  const index = pages.findIndex(p => p.id === id);
  const next = index >= 0 && index < pages.length - 1 ? pages[index + 1] : null;
  const row = detail?.row;
  const live = row?.url ? safeHref(row.siteId, row.url) : null;

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 14px', mb: '12px' }}>
        <CcButton kind="txt" onClick={onBack}>
          {t('rec.player.back')}
        </CcButton>
        {row && (
          <>
            <SiteChip siteId={row.siteId} small />
            <Box component="span" sx={{ fontSize: 12.5, color: cc.text }}>
              {`${formatAt(row.startedAt, 'DD.MM.YYYY HH:mm')} · ${t(`funnel.devices.${row.device}`, { defaultValue: row.device })}`}
              {row.inquiry && ` · ${t('rec.list.col.inquiry')} ✓`}
              {row.chat && ` · ${t('rec.list.col.chat')} ✓`}
            </Box>
            {live && (
              <Box
                component="a"
                href={live}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  ...linkSx,
                  fontSize: 12.5,
                  maxWidth: 420,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {row.url}
              </Box>
            )}
          </>
        )}
      </Box>
      {pages.length > 1 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', mb: '10px' }}>
          <Box component="span" sx={{ fontSize: 12, color: cc.muted, mr: '4px' }}>
            {t('rec.player.pages')}
          </Box>
          {pages.map((p, i) => (
            <CcButton
              key={p.id}
              kind={p.id === id ? 'primary' : 'out'}
              onClick={() => p.id !== id && onOpen(p.id)}
              title={p.url ?? undefined}
            >
              {`${i + 1}. ${p.pageType ? t(`funnel.pageType.${p.pageType}`, { defaultValue: p.pageType }) : '—'}`}
            </CcButton>
          ))}
        </Box>
      )}
      {phase === 'gone' && <LoadAlert text={t('rec.player.gone')} />}
      {phase === 'busy' && <LoadAlert text={t('rec.player.busy')} />}
      {phase === 'failed' && <LoadAlert text={t('rec.player.failed')} />}
      {phase === 'loading' && <Box sx={{ fontSize: 13, color: cc.text, mb: '10px' }}>{t('rec.player.loading')}</Box>}
      {phase === 'ready' && noStyles && (
        <Box sx={{ fontSize: 12, color: cc.muted, mb: '8px' }}>{t('rec.player.noStyles')}</Box>
      )}
      <Box
        ref={stageRef}
        sx={{
          width: '100%',
          height: size.h * scale,
          overflow: 'hidden',
          bgcolor: '#FFFFFF',
          border: `1px solid ${cc.border}`,
          borderRadius: '10px',
          display: phase === 'ready' || phase === 'loading' ? 'block' : 'none',
        }}
      >
        <iframe
          ref={iframeRef}
          title={t('rec.player.timeline')}
          sandbox="allow-same-origin"
          // Not clickable: a click on a recorded link would navigate the frame away (P6 R2 review I1).
          inert
          tabIndex={-1}
          width={size.w}
          height={size.h}
          style={{
            border: 0,
            display: 'block',
            transform: `scale(${scale})`,
            transformOrigin: '0 0',
            pointerEvents: 'none',
          }}
        />
      </Box>
      {phase === 'ready' && (
        <Box sx={{ mt: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Box
            sx={{ position: 'relative', height: 10, borderRadius: '5px', bgcolor: cc.hover }}
            aria-label={t('rec.player.timeline')}
          >
            {detail?.clicks.map(c => (
              <Mark
                key={`c${c.tMs}-${c.x}-${c.y}`}
                left={markerLeft(c.tMs, duration)}
                color={cc.muted}
                title={`${t('rec.player.markers.clicks')} ${formatClock(c.tMs)}`}
                onClick={() => seek(c.tMs - 500)}
              />
            ))}
            {detail?.errors.map(e => (
              <Mark
                key={`e${e.tMs}-${e.message}`}
                left={markerLeft(e.tMs, duration)}
                color="#E8A23A"
                title={`${t('rec.player.markers.errors')}: ${e.message ?? ''}`}
                onClick={() => seek(e.tMs - 500)}
              />
            ))}
            {detail?.rage.map(r => (
              <Mark
                key={`r${r}`}
                left={markerLeft(r, duration)}
                color={cc.red}
                title={`${t('rec.player.markers.rage')} ${formatClock(r)}`}
                onClick={() => seek(r - 500)}
              />
            ))}
          </Box>
          <Box
            component="input"
            type="range"
            aria-label={t('rec.player.timeline')}
            min={0}
            max={Math.round(duration)}
            step={100}
            value={Math.round(time)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => seek(Number(e.target.value))}
            sx={{ width: '100%' }}
          />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 14px' }}>
            <CcButton kind="primary" onClick={playing ? pause : play}>
              {playing ? t('rec.player.pause') : t('rec.player.play')}
            </CcButton>
            <Box component="span" sx={{ fontSize: 13, color: cc.ink, fontVariantNumeric: 'tabular-nums' }}>
              {`${formatClock(time)} / ${formatClock(duration)}`}
            </Box>
            <Segmented
              label={t('rec.player.speed')}
              value={speed}
              onChange={changeSpeed}
              options={SPEEDS.map(s => ({ value: s, label: `${s}×` }))}
            />
            <Box
              component="label"
              sx={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 12.5, color: cc.text }}
            >
              <input type="checkbox" checked={skip} onChange={e => changeSkip(e.target.checked)} />
              {t('rec.player.skipIdle')}
            </Box>
            {next && time >= duration && <CcButton onClick={() => onOpen(next.id)}>{t('rec.player.next')}</CcButton>}
            <Box component="span" sx={{ fontSize: 12, color: cc.muted, ml: 'auto' }}>
              {`${t('rec.player.markers.clicks')}: ${detail?.clicks.length ?? 0} · ${t('rec.player.markers.rage')}: ${detail?.rage.length ?? 0} · ${t('rec.player.markers.errors')}: ${detail?.errors.length ?? 0}`}
            </Box>
          </Box>
          <Box sx={{ fontSize: 12, color: cc.muted }}>{t('rec.player.privacy')}</Box>
        </Box>
      )}
    </Box>
  );
};

export default Player;
