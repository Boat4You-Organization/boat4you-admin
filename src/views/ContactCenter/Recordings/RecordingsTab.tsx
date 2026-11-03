/* The "Heatmaps" tab (P6 R3): heatmaps (/contact-center/recording, ?siteId=&pageType=&device= from a finding), what to fix
 * (/insights), the recordings list (/list, ?visitId= or ?conversationId= from a conversation, ?siteId=&pageType=&device= from a
 * heatmap), a recording in the player (/:id) and the recording switches (/settings). */
import { Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import { Box } from '@mui/material';

import { lazyWithReload } from '@/utils/contactCenter/replay';
import Recording from '@/views/ContactCenter/Recording/Recording';
import { Segmented, cc } from '@/views/ContactCenter/ui';

import InsightsView from './InsightsView';
import RecordingList, { RecScope } from './RecordingList';

const RELOAD_KEY = 'cc-player-reload';

// After an admin deploy the old chunk is gone: reload once (not again within a minute) instead of blanking the admin.
const reloadOnce = () => {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);

    if (Date.now() - last < 60_000) return;

    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // storage blocked: reload anyway
  }
  window.location.reload();
};

// clarity-visualize and the decode worker load only when a heatmap or a recording is opened.
const Player = lazy(lazyWithReload(() => import('./Player'), reloadOnce));
const HeatmapView = lazy(lazyWithReload(() => import('./HeatmapView'), reloadOnce));

const BASE = '/contact-center/recording';

type View = 'heatmaps' | 'insights' | 'list' | 'settings';

const numberParam = (q: URLSearchParams, key: string) => {
  const v = Number(q.get(key));

  return Number.isInteger(v) && v > 0 ? v : undefined;
};

const viewOf = (pathname: string): View => {
  if (pathname.startsWith(`${BASE}/settings`)) return 'settings';

  if (pathname.startsWith(`${BASE}/insights`)) return 'insights';

  if (pathname.startsWith(`${BASE}/list`) || /^\/contact-center\/recording\/\d+/.test(pathname)) return 'list';

  return 'heatmaps';
};

const PATHS: Record<View, string> = {
  heatmaps: BASE,
  insights: `${BASE}/insights`,
  list: `${BASE}/list`,
  settings: `${BASE}/settings`,
};

const RecordingsTab = () => {
  const { t } = useTranslation('contactCenter');
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const view = viewOf(pathname);
  const id = Number(/^\/contact-center\/recording\/(\d+)/.exec(pathname)?.[1]) || null;
  const query = new URLSearchParams(search);
  const scope: RecScope = {
    visitId: numberParam(query, 'visitId'),
    conversationId: numberParam(query, 'conversationId'),
    siteId: query.get('siteId') || undefined,
    pageType: query.get('pageType') || undefined,
    device: query.get('device') || undefined,
  };
  const loading = <Box sx={{ fontSize: 13, color: cc.text }}>{t('rec.player.loading')}</Box>;

  return (
    <Box>
      <Segmented<View>
        label={t('tab.recording')}
        value={view}
        onChange={v => navigate(PATHS[v])}
        options={[
          { value: 'heatmaps', label: t('rec.views.heatmaps') },
          { value: 'insights', label: t('rec.views.insights') },
          { value: 'list', label: t('rec.views.list') },
          { value: 'settings', label: t('rec.views.settings') },
        ]}
        sx={{ width: 'fit-content', mb: '14px' }}
      />
      {view === 'settings' && <Recording />}
      {view === 'insights' && <InsightsView />}
      {view === 'heatmaps' && (
        <Suspense fallback={loading}>
          <HeatmapView />
        </Suspense>
      )}
      {view === 'list' && id !== null && (
        <Suspense fallback={loading}>
          <Player
            id={id}
            onOpen={next => navigate(`${BASE}/${next}${search}`)}
            onBack={() => navigate(`${PATHS.list}${search}`)}
          />
        </Suspense>
      )}
      {view === 'list' && id === null && (
        <RecordingList
          scope={scope}
          onOpen={open => navigate(`${BASE}/${open}${search}`)}
          onClearScope={() => navigate(PATHS.list)}
        />
      )}
    </Box>
  );
};

export default RecordingsTab;
