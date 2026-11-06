/* PR (digital PR, 4.11.2026): journalist contacts, data studies, 1:1 pitches from press@boat4you.com that Mario reads and
 * sends himself, the articles that used a study (with their link checks) and the pages that name us. SYSTEM_ADMIN only,
 * like the backend /admin/pr/**. The backend checks every send rule again and adds the mail footer. */
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import { DeskPage, DeskTabs, PageHead } from '@/components/Desk';
import Layout from '@/components/Layout';

import Contacts from './Contacts';
import Mentions from './Mentions';
import Overview from './Overview';
import Pitches from './Pitches';
import Placements from './Placements';
import Studies from './Studies';

type TabKey = 'overview' | 'contacts' | 'studies' | 'pitches' | 'placements' | 'mentions';

const TAB_PATHS: Record<TabKey, string> = {
  overview: '/pr',
  contacts: '/pr/contacts',
  studies: '/pr/studies',
  pitches: '/pr/pitches',
  placements: '/pr/placements',
  mentions: '/pr/mentions',
};

const tabOf = (path: string): TabKey =>
  (Object.keys(TAB_PATHS) as TabKey[]).find(k => k !== 'overview' && path.startsWith(TAB_PATHS[k])) ?? 'overview';

const Pr = () => {
  const { t } = useTranslation('pr');
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const tab = tabOf(pathname);

  return (
    <Layout>
      <DeskPage>
        <PageHead title={t('title')} subtitle={t('subtitle')} />
        <DeskTabs<TabKey>
          ariaLabel={t('title')}
          value={tab}
          onChange={v => navigate(TAB_PATHS[v])}
          items={[
            { value: 'overview', label: t('tab.overview') },
            { value: 'contacts', label: t('tab.contacts') },
            { value: 'studies', label: t('tab.studies') },
            { value: 'pitches', label: t('tab.pitches') },
            { value: 'placements', label: t('tab.placements') },
            { value: 'mentions', label: t('tab.mentions') },
          ]}
        />
        {tab === 'overview' && <Overview />}
        {tab === 'contacts' && <Contacts />}
        {tab === 'studies' && <Studies />}
        {tab === 'pitches' && <Pitches />}
        {tab === 'placements' && <Placements />}
        {tab === 'mentions' && <Mentions />}
      </DeskPage>
    </Layout>
  );
};

export default Pr;
