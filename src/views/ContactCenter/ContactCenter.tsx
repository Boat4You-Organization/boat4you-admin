/* Contact Center (P2, design 2.3; redesign 30.10.2026): the admin's home for conversations and contacts.
 * It replaces the /chat inbox (which now redirects here). SYSTEM_ADMIN only, like the /admin/cc API.
 * Statistics (/contact-center/stats), Live visitors (/contact-center/live) and Heatmaps (/contact-center/recording/*) keep
 * their routes and this view, but
 * since 5.11.2026 they are menu items of their own in the Marketing workspace (Mario): they render with their own title
 * and without the Contact Center tab bar. */
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useLocation } from 'react-router-dom';

import { Box } from '@mui/material';

import Layout from '@/components/Layout';

import ContactDetail from './Contacts/ContactDetail';
import Contacts from './Contacts/Contacts';
import Conversations from './Conversations/Conversations';
import LiveVisitors from './Live/LiveVisitors';
import RecordingsTab from './Recordings/RecordingsTab';
import Stats from './Stats/Stats';
import { cc } from './ui';

type TabKey = 'conversations' | 'live' | 'contacts' | 'stats' | 'recording';

/** Tabs of the Contact Center section proper; live, stats and recording are separate menu items (see header comment). */
const TABS: { key: TabKey; path: string }[] = [
  { key: 'conversations', path: '/contact-center' },
  { key: 'contacts', path: '/contact-center/contacts' },
];

const STANDALONE: TabKey[] = ['live', 'stats', 'recording'];

const tabOf = (path: string): TabKey => {
  if (path.startsWith('/contact-center/live')) return 'live';

  if (path.startsWith('/contact-center/contacts')) return 'contacts';

  if (path.startsWith('/contact-center/stats')) return 'stats';

  if (path.startsWith('/contact-center/recording')) return 'recording';

  return 'conversations';
};

const ContactCenter = () => {
  const { t } = useTranslation('contactCenter');
  const { pathname } = useLocation();
  const tab = tabOf(pathname);
  const standalone = STANDALONE.includes(tab);
  const contactId = /^\/contact-center\/contacts\/(\d+)/.exec(pathname)?.[1];

  return (
    <Layout>
      {/* The header is fixed (54 px): the page starts below it, as in Boats · Media. */}
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
            {standalone ? t(`tab.${tab}`) : t('title')}
          </Box>
          <Box
            component="nav"
            aria-label={t('title')}
            sx={{
              display: standalone ? 'none' : 'flex',
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
        {tab === 'conversations' && <Conversations />}
        {tab === 'live' && <LiveVisitors />}
        {tab === 'contacts' && (contactId ? <ContactDetail id={Number(contactId)} /> : <Contacts />)}
        {tab === 'stats' && <Stats />}
        {tab === 'recording' && <RecordingsTab />}
      </Box>
    </Layout>
  );
};

export default ContactCenter;
