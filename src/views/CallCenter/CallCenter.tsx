/* Call centar (AI call centre "Nika", design §2.5): calls with transcripts and recordings, the inquiries Nika may
 * call, and the calls.* settings. Its own section in the Marketing workspace, separate from the Contact Center (web
 * chat). SYSTEM_ADMIN only, like the /admin/calls API: transcripts and recordings never leave this role. */
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useLocation } from 'react-router-dom';

import { Box } from '@mui/material';

import Layout from '@/components/Layout';
import { cc } from '@/views/ContactCenter/ui';

import CallDetail from './CallDetail';
import Calls from './Calls';
import Inquiries from './Inquiries';
import Settings from './Settings';

type TabKey = 'calls' | 'inquiries' | 'settings';

const TABS: { key: TabKey; path: string }[] = [
  { key: 'calls', path: '/call-center/calls' },
  { key: 'inquiries', path: '/call-center/inquiries' },
  { key: 'settings', path: '/call-center/settings' },
];

const tabOf = (path: string): TabKey => {
  if (path.startsWith('/call-center/inquiries')) return 'inquiries';

  if (path.startsWith('/call-center/settings')) return 'settings';

  return 'calls';
};

const CallCenter = () => {
  const { t } = useTranslation('callCenter');
  const { pathname } = useLocation();
  const tab = tabOf(pathname);
  const callId = /^\/call-center\/calls\/(\d+)/.exec(pathname)?.[1];

  return (
    <Layout>
      {/* The header is fixed (54 px): the page starts below it, as in the Contact Center. */}
      <Box
        sx={{
          px: { xs: 1.5, md: 3 },
          pt: { xs: '66px', md: '74px' },
          pb: 3,
          bgcolor: cc.page,
          minHeight: '100vh',
          color: cc.ink,
          fontSize: 14,
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px 28px', mb: 2 }}>
          <Box component="h1" sx={{ m: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-0.015em', color: cc.ink }}>
            {t('title')}
          </Box>
          <Box
            component="nav"
            aria-label={t('title')}
            sx={{
              display: 'flex',
              gap: '2px',
              p: '3px',
              bgcolor: cc.seg,
              borderRadius: '10px',
              overflowX: 'auto',
              maxWidth: '100%',
            }}
          >
            {TABS.map(({ key, path }) => {
              const on = key === tab;

              return (
                <Box
                  key={key}
                  component={RouterLink}
                  to={path}
                  aria-current={on ? 'page' : undefined}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    height: 30,
                    px: '12px',
                    borderRadius: '7px',
                    bgcolor: on ? cc.ink : 'transparent',
                    color: on ? '#FFFFFF' : cc.text,
                    textDecoration: 'none',
                    fontSize: 12.5,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    '&:hover': on ? undefined : { color: cc.ink, bgcolor: 'rgba(255,255,255,.6)' },
                  }}
                >
                  {t(`tab.${key}`)}
                </Box>
              );
            })}
          </Box>
        </Box>
        {tab === 'calls' && (callId ? <CallDetail key={callId} id={Number(callId)} /> : <Calls />)}
        {tab === 'inquiries' && <Inquiries />}
        {tab === 'settings' && <Settings />}
      </Box>
    </Layout>
  );
};

export default CallCenter;
