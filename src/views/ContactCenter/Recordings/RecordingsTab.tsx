/* The "Recordings" tab (P6 R2): the list (/contact-center/recording, ?visitId= or ?conversationId= from a conversation), a
 * recording in the player (/contact-center/recording/:id) and the recording switches (/contact-center/recording/settings). */
import { Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import { Box } from '@mui/material';

import Recording from '@/views/ContactCenter/Recording/Recording';
import { Segmented, cc } from '@/views/ContactCenter/ui';

import RecordingList, { RecScope } from './RecordingList';

// clarity-visualize and the decode worker load only when a recording is opened.
const Player = lazy(() => import('./Player'));

const BASE = '/contact-center/recording';

const numberParam = (q: URLSearchParams, key: string) => {
  const v = Number(q.get(key));

  return Number.isInteger(v) && v > 0 ? v : undefined;
};

const RecordingsTab = () => {
  const { t } = useTranslation('contactCenter');
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const settings = pathname.startsWith(`${BASE}/settings`);
  const id = Number(/^\/contact-center\/recording\/(\d+)/.exec(pathname)?.[1]) || null;
  const query = new URLSearchParams(search);
  const scope: RecScope = {
    visitId: numberParam(query, 'visitId'),
    conversationId: numberParam(query, 'conversationId'),
  };

  return (
    <Box>
      <Segmented
        label={t('tab.recording')}
        value={settings ? 'settings' : 'list'}
        onChange={v => navigate(v === 'settings' ? `${BASE}/settings` : BASE)}
        options={[
          { value: 'list', label: t('rec.views.list') },
          { value: 'settings', label: t('rec.views.settings') },
        ]}
        sx={{ width: 'fit-content', mb: '14px' }}
      />
      {settings && <Recording />}
      {!settings && id !== null && (
        <Suspense fallback={<Box sx={{ fontSize: 13, color: cc.text }}>{t('rec.player.loading')}</Box>}>
          <Player
            id={id}
            onOpen={next => navigate(`${BASE}/${next}${search}`)}
            onBack={() => navigate(`${BASE}${search}`)}
          />
        </Suspense>
      )}
      {!settings && id === null && (
        <RecordingList
          scope={scope}
          onOpen={open => navigate(`${BASE}/${open}${search}`)}
          onClearScope={() => navigate(BASE)}
        />
      )}
    </Box>
  );
};

export default RecordingsTab;
