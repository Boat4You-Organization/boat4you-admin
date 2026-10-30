/* Contact Center (P2, design 2.3; redesign 30.10.2026): the admin's home for conversations, live visitors, contacts and
 * statistics. It replaces the /chat inbox (which now redirects here). SYSTEM_ADMIN only, like the /admin/cc API. */
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useLocation } from 'react-router-dom';

import { Box } from '@mui/material';

import Layout from '@/components/Layout';

import ContactDetail from './Contacts/ContactDetail';
import Contacts from './Contacts/Contacts';
import Conversations from './Conversations/Conversations';
import LiveVisitors from './Live/LiveVisitors';
import Stats from './Stats/Stats';
import { cc } from './ui';

type TabKey = 'conversations' | 'live' | 'contacts' | 'stats';

const TABS: { key: TabKey; path: string }[] = [
  { key: 'conversations', path: '/contact-center' },
  { key: 'live', path: '/contact-center/live' },
  { key: 'contacts', path: '/contact-center/contacts' },
  { key: 'stats', path: '/contact-center/stats' },
];

const tabOf = (path: string): TabKey => {
  if (path.startsWith('/contact-center/live')) return 'live';

  if (path.startsWith('/contact-center/contacts')) return 'contacts';

  if (path.startsWith('/contact-center/stats')) return 'stats';

  return 'conversations';
};

const ContactCenter = () => {
  const { t } = useTranslation('contactCenter');
  const { pathname } = useLocation();
  const tab = tabOf(pathname);
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
          <Box component="h1" sx={{ m: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: cc.ink }}>
            {t('title')}
          </Box>
          <Box
            component="nav"
            aria-label={t('title')}
            sx={{
              display: 'flex',
              gap: '4px',
              p: '4px',
              bgcolor: cc.seg,
              borderRadius: '999px',
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
                    p: '7px 16px',
                    borderRadius: '999px',
                    bgcolor: on ? cc.ink : 'transparent',
                    color: on ? '#FFFFFF' : cc.text,
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: on ? 600 : 500,
                    whiteSpace: 'nowrap',
                    '&:hover': on ? undefined : { bgcolor: 'rgba(11,29,58,.06)' },
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
      </Box>
    </Layout>
  );
};

export default ContactCenter;
