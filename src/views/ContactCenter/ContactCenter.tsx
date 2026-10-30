/* Contact Center (P2, design 2.3): the admin's home for conversations, live visitors, contacts and statistics. It
 * replaces the /chat inbox (which now redirects here). SYSTEM_ADMIN only, like the /admin/cc API. */
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import { Box, Tabs, Typography } from '@mui/material';

import Layout from '@/components/Layout';
import PillTab from '@/components/PillTab';
import { bbColors } from '@/styles/bb';

import ContactDetail from './Contacts/ContactDetail';
import Contacts from './Contacts/Contacts';
import Conversations from './Conversations/Conversations';
import LiveVisitors from './Live/LiveVisitors';
import Stats from './Stats/Stats';

type TabKey = 'conversations' | 'live' | 'contacts' | 'stats';

const TAB_PATH: Record<TabKey, string> = {
  conversations: '/contact-center',
  live: '/contact-center/live',
  contacts: '/contact-center/contacts',
  stats: '/contact-center/stats',
};

const tabOf = (path: string): TabKey => {
  if (path.startsWith('/contact-center/live')) return 'live';

  if (path.startsWith('/contact-center/contacts')) return 'contacts';

  if (path.startsWith('/contact-center/stats')) return 'stats';

  return 'conversations';
};

const ContactCenter = () => {
  const { t } = useTranslation('contactCenter');
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const tab = tabOf(pathname);
  const contactId = /^\/contact-center\/contacts\/(\d+)/.exec(pathname)?.[1];

  return (
    <Layout>
      <Box sx={{ px: { xs: 1.5, md: 3 }, py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Typography sx={{ fontSize: 24, fontWeight: 800, color: bbColors.navy900 }}>{t('title')}</Typography>
          <Tabs
            value={tab}
            onChange={(_, v: TabKey) => navigate(TAB_PATH[v])}
            variant="scrollable"
            allowScrollButtonsMobile
          >
            <PillTab value="conversations" label={t('tabs.conversations')} />
            <PillTab value="live" label={t('tabs.live')} />
            <PillTab value="contacts" label={t('tabs.contacts')} />
            <PillTab value="stats" label={t('tabs.stats')} />
          </Tabs>
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
