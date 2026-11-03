/* Heatmaps (P6 R3): where the visitors of one site, page type and device click most and least, how far down they get, and
 * which elements get dead or rage clicks — the background is the newest recorded page of the group, drawn in a sandboxed,
 * inert iframe at its full height, with clarity-visualize's click or scroll map on top. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import { Box } from '@mui/material';
import { Data } from 'clarity-decode';
import dayjs from 'dayjs';

import ContactCenterService from '@/services/contactCenter.service';
import { Heatmap, HeatmapGroup } from '@/types/contactCenter.type';
import {
  elementLabel,
  reachAt,
  shownShare,
  toActivity,
  toHoverActivity,
  toScrollMap,
} from '@/utils/contactCenter/heatmap';
import { makeUseproxy, rewriteDomUrls, stylesheetPaths } from '@/utils/contactCenter/replay';
import { SITE_IDS, siteLabel } from '@/utils/contactCenter/safeLink';
import { CcButton, Empty, LoadAlert, Segmented, cc, fieldSx, tableSx } from '@/views/ContactCenter/ui';

import { Replay } from './replayEngine';

const DEVICES = ['MOBILE', 'DESKTOP', 'TABLET'] as const;
// The background is drawn as it looked 3 s in: hydrated, before most overlays open.
const BACKGROUND_AT_MS = 3000;
// Chrome stops drawing a canvas taller than 32767 px; a longer page is cut there.
const MAX_HEIGHT = 30000;

type Days = '7' | '30' | '90';
type Mode = 'clicks' | 'scroll' | 'hover';
type Order = 'most' | 'least';

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

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part * 100) / whole) : 0);

const HeatmapView = () => {
  const { t } = useTranslation('contactCenter');
  const navigate = useNavigate();
  const { search } = useLocation();
  const initial = useMemo(() => new URLSearchParams(search), [search]);
  const [siteId, setSiteId] = useState(initial.get('siteId') || 'boat4you');
  const [device, setDevice] = useState(initial.get('device') || 'MOBILE');
  const [days, setDays] = useState<Days>('30');
  const [pageType, setPageType] = useState(initial.get('pageType') || '');
  const [groups, setGroups] = useState<HeatmapGroup[] | null>(null);
  const [data, setData] = useState<Heatmap | null>(null);
  const [failed, setFailed] = useState(false);
  const [mode, setMode] = useState<Mode>('clicks');
  const [order, setOrder] = useState<Order>('most');
  const [bgState, setBgState] = useState<'none' | 'loading' | 'ready' | 'failed'>('none');
  const [size, setSize] = useState({ w: 390, h: 800 });
  const [shown, setShown] = useState<number | null>(null);
  const [stageW, setStageW] = useState(1000);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const replayRef = useRef<Replay | null>(null);
  const from = useMemo(() => dayjs().subtract(Number(days), 'day').toISOString(), [days]);

  // The page types of the site and device, most viewed first; the first one is shown unless the link chose one.
  useEffect(() => {
    let current = true;

    setGroups(null);
    ContactCenterService.heatmapGroups({ siteId, device, from })
      .then(({ data: g }) => {
        if (!current) return;

        setGroups(g);
        setPageType(p => (p && g.some(x => x.pageType === p) ? p : (g[0]?.pageType ?? '')));
      })
      .catch(() => current && setFailed(true));

    return () => {
      current = false;
    };
  }, [siteId, device, from]);

  useEffect(() => {
    let current = true;

    setData(null);

    if (!pageType) return undefined;

    ContactCenterService.heatmap({ siteId, pageType, device, from })
      .then(({ data: h }) => {
        if (!current) return;

        setData(h);
        setFailed(false);
      })
      .catch(() => current && setFailed(true));

    return () => {
      current = false;
    };
  }, [siteId, pageType, device, from]);

  // The background: the newest recorded page of the group, drawn once per background.
  const backgroundId = data?.background ?? null;

  useEffect(() => {
    let current = true;

    replayRef.current = null;

    if (backgroundId === null) {
      setBgState('none');

      return undefined;
    }

    setBgState('loading');

    // The frame of this background (a new one per background: key={backgroundId}), so a slower earlier load never draws into it.
    const frame = iframeRef.current;

    (async () => {
      try {
        const { data: d } = await ContactCenterService.recording(backgroundId);
        const { data: raw } = await ContactCenterService.recordingRaw(backgroundId);

        if (!current) return;

        const lines = raw.split('\n').filter(l => l.trim() !== '');
        const pageUrl = d.row.url ?? 'https://www.boat4you.com/';
        const paths = stylesheetPaths(lines, new URL(pageUrl).host);
        const assets = paths.length
          ? await ContactCenterService.recordingAssets(d.row.siteId, paths)
              .then(r => r.data)
              .catch(() => ({}) as Record<string, string>)
          : {};
        const decoded = await decodeInWorker(lines);

        rewriteDomUrls(decoded, makeUseproxy(pageUrl, assets, window.location.origin));

        if (!current || !frame) return;

        let width = d.row.viewportW ?? 1280;
        let height = d.row.viewportH ?? 800;
        const replay = await Replay.create(frame, {
          decoded,
          pageUrl,
          assets,
          mobile: d.row.device === 'MOBILE',
          onresize: (w, h) => {
            width = w;
            height = h;
          },
        });

        if (!current) return;

        await replay.seek(Math.min(BACKGROUND_AT_MS, replay.duration));

        if (!current) return;

        // At the recorded width, then at the page's full height with screen-height sections kept at the recorded viewport.
        const full = replay.fullHeight(frame, width, height);

        setSize({ w: width, h: Math.min(MAX_HEIGHT, Math.max(400, full)) });
        replayRef.current = replay;
        setBgState('ready');
      } catch {
        if (current) setBgState('failed');
      }
    })();

    return () => {
      current = false;
    };
  }, [backgroundId]);

  // The map on top, after every change of mode, data or size.
  useEffect(() => {
    const replay = replayRef.current;

    if (bgState !== 'ready' || !replay || !data) return;

    const id = requestAnimationFrame(() => {
      if (mode === 'clicks') {
        replay.clickmap(toActivity(data.elements, data.points));
        setShown(shownShare(data.elements, h => replay.has(h)));
      } else if (mode === 'hover') {
        replay.clickmap(toHoverActivity(data.hover));
        setShown(
          shownShare(
            Object.entries(data.hover).map(([hash, pts]) => ({ hash, clicks: pts.reduce((n, p) => n + p.ms, 0) })),
            h => replay.has(h)
          )
        );
      } else replay.scrollmap(toScrollMap(data.scroll), Math.round((data.foldPct / 100) * size.h));
    });

    // eslint-disable-next-line consistent-return -- the cleanup cancels a pending draw
    return () => cancelAnimationFrame(id);
  }, [bgState, data, mode, size]);

  useEffect(() => {
    const el = stageRef.current;

    if (!el) return undefined;

    const ro = new ResizeObserver(entries => setStageW(entries[0].contentRect.width));

    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  const rows = useMemo(() => {
    const list = data?.elements ?? [];

    return order === 'most' ? list : [...list].reverse();
  }, [data, order]);

  const scale = Math.min(1, stageW / Math.max(1, size.w));
  const pageTypeLabel = (p: string) => t(`funnel.pageType.${p}`, { defaultValue: p });

  const select = (
    label: string,
    value: string,
    set: (v: string) => void,
    options: Array<[string, string]>,
    minWidth: number
  ) => (
    <Box
      component="select"
      aria-label={label}
      value={value}
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => set(e.target.value)}
      sx={{ ...fieldSx, width: 'auto', minWidth }}
    >
      {options.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </Box>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 14px', mb: '12px' }}>
        {select(
          t('filter.site'),
          siteId,
          setSiteId,
          SITE_IDS.map(s => [s, siteLabel(s)]),
          170
        )}
        {select(
          t('rec.heat.device'),
          device,
          setDevice,
          DEVICES.map(d => [d, t(`funnel.devices.${d}`)]),
          130
        )}
        {groups &&
          groups.length > 0 &&
          select(
            t('rec.heat.pageType'),
            pageType,
            setPageType,
            groups.map(g => [g.pageType, `${pageTypeLabel(g.pageType)} (${g.pageViews})`]),
            180
          )}
        <Segmented<Days>
          label={t('rangeLabel')}
          value={days}
          onChange={setDays}
          options={[
            { value: '7', label: t('range.7d') },
            { value: '30', label: t('range.30d') },
            { value: '90', label: t('rec.heat.range90') },
          ]}
        />
        <Segmented<Mode>
          label={t('rec.heat.modeClicks')}
          value={mode}
          onChange={setMode}
          options={[
            { value: 'clicks', label: t('rec.heat.modeClicks') },
            { value: 'scroll', label: t('rec.heat.modeScroll') },
            { value: 'hover', label: t('rec.heat.modeHover') },
          ]}
        />
      </Box>
      <Box sx={{ fontSize: 12, color: cc.muted, mb: '10px', lineHeight: 1.5 }}>{t('rec.heat.note')}</Box>
      {failed && (
        <Box sx={{ mb: 2 }}>
          <LoadAlert text={t('loadFailed')} />
        </Box>
      )}
      {groups && groups.length === 0 && <Empty>{t('rec.heat.empty')}</Empty>}
      {data && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px 22px', mb: '12px', fontSize: 13, color: cc.text }}>
          <span>{`${t('rec.heat.pageViews')}: ${data.pageViews}`}</span>
          <span>{`${t('rec.heat.clicks')}: ${data.clicks}`}</span>
          <span>{`${t('rec.heat.inquiries')}: ${data.inquiryPageViews}`}</span>
          <span>{`${t('rec.heat.mouse')}: ${data.hoverPageViews}`}</span>
          <span>{`${t('rec.heat.fold')}: ${t('rec.heat.foldValue', { pct: data.foldPct })}`}</span>
          {[50, 75, 100].map(d => (
            <span
              key={d}
            >{`${t('rec.heat.reach')} ${t('rec.heat.reachValue', { pct: d, share: reachAt(data.scroll, d) })}`}</span>
          ))}
          <CcButton
            onClick={() =>
              navigate(`/contact-center/recording/list?siteId=${siteId}&pageType=${pageType}&device=${device}`)
            }
          >
            {t('rec.heat.watch')}
          </CcButton>
        </Box>
      )}
      {data && bgState === 'none' && (
        <Box sx={{ fontSize: 12.5, color: cc.muted, mb: '10px' }}>{t('rec.heat.noBackground')}</Box>
      )}
      {data && mode === 'hover' && Object.keys(data.hover).length === 0 && (
        <Box sx={{ fontSize: 12.5, color: cc.muted, mb: '10px' }}>{t('rec.heat.noMouse')}</Box>
      )}
      {data && bgState === 'failed' && <LoadAlert text={t('rec.player.failed')} />}
      {bgState === 'loading' && <Box sx={{ fontSize: 13, color: cc.text, mb: '10px' }}>{t('rec.heat.loading')}</Box>}
      <Box
        ref={stageRef}
        sx={{
          width: '100%',
          display: bgState === 'ready' || bgState === 'loading' ? 'flex' : 'none',
          justifyContent: 'center',
          mb: '16px',
        }}
      >
        <Box
          sx={{
            width: size.w * scale,
            height: size.h * scale,
            overflow: 'hidden',
            bgcolor: '#FFFFFF',
            border: `1px solid ${cc.border}`,
            borderRadius: '10px',
          }}
        >
          <iframe
            key={backgroundId ?? 'none'}
            ref={iframeRef}
            title={t('rec.views.heatmaps')}
            sandbox="allow-same-origin"
            // Not clickable: the recorded page's own links must not navigate the frame (P6 R2 review I1).
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
      </Box>
      {bgState === 'ready' && mode !== 'scroll' && shown !== null && shown < 100 && (
        <Box sx={{ fontSize: 12.5, color: cc.muted, mt: '-6px', mb: '12px', textAlign: 'center' }}>
          {t('rec.heat.shown', { pct: shown })}
        </Box>
      )}
      {data && data.elements.length > 0 && (
        <Box>
          <Segmented<Order>
            label={t('rec.heat.col.clicks')}
            value={order}
            onChange={setOrder}
            options={[
              { value: 'most', label: t('rec.heat.sortMost') },
              { value: 'least', label: t('rec.heat.sortLeast') },
            ]}
            sx={{ width: 'fit-content', mb: '10px' }}
          />
          <Box sx={{ overflowX: 'auto' }}>
            <Box component="table" sx={tableSx}>
              <thead>
                <tr>
                  <th>{t('rec.heat.col.element')}</th>
                  <th className="num">{t('rec.heat.col.clicks')}</th>
                  <th className="num">{t('rec.heat.col.pageViewShare')}</th>
                  <th className="num">{t('rec.heat.col.dead')}</th>
                  <th className="num">{t('rec.heat.col.rage')}</th>
                  <th className="num">{t('rec.heat.col.inquiryShare')}</th>
                  <th className="num">{t('rec.heat.col.hover')}</th>
                  <th>{t('rec.heat.col.link')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(e => (
                  <tr key={e.hash}>
                    <td>
                      <Box
                        component="span"
                        sx={{
                          display: 'inline-block',
                          maxWidth: 280,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {elementLabel(e)}
                      </Box>
                    </td>
                    <td className="num">{e.clicks}</td>
                    <td className="num">{`${pct(e.pageViews, data.pageViews)} %`}</td>
                    <td className="num" style={e.dead > 0 ? { color: cc.red, fontWeight: 700 } : undefined}>
                      {e.dead}
                    </td>
                    <td className="num" style={e.rage > 0 ? { color: cc.red, fontWeight: 700 } : undefined}>
                      {e.rage}
                    </td>
                    <td className="num">{`${pct(e.inquiryClicks, e.clicks)} %`}</td>
                    <td className="num">{`${Math.round(e.hoverMs / 1000)} s`}</td>
                    <td>
                      <Box
                        component="span"
                        title={e.link ?? undefined}
                        sx={{
                          display: 'inline-block',
                          maxWidth: 260,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: cc.muted,
                        }}
                      >
                        {e.link ?? ''}
                      </Box>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default HeatmapView;
