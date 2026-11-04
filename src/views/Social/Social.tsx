/* Objave (Social publisher S0, Mario 3.11.2026: „alat s kojim ćemo moći objavljivati jednu objavu na više kanala … sve
 * inhouse“): write one post, pick the channels, publish now or schedule; connect our pages and profiles; keys for the
 * daily automation. SYSTEM_ADMIN only, like the backend /admin/social/**. Design and API contract:
 * docs/superpowers/specs/2026-11-03-social-publisher-design.md. */
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { Button } from '@mui/material';

import { DeskPage, DeskTabs, PageHead } from '@/components/Desk';
import Layout from '@/components/Layout';
import SocialService from '@/services/social.service';
import { errorMessage } from '@/services/yacht-media.api';
import { SocialAccount } from '@/types/social.type';

import AiTab from './AiTab';
import Automation from './Automation';
import Channels from './Channels';
import Composer from './Composer';
import Posts from './Posts';
import { AccountsState } from './ui';

type TabKey = 'posts' | 'compose' | 'channels' | 'ai' | 'automation';

const TAB_PATHS: Record<TabKey, string> = {
  posts: '/social',
  compose: '/social/new',
  channels: '/social/channels',
  ai: '/social/ai',
  automation: '/social/automation',
};

const tabOf = (path: string): TabKey => {
  if (path.startsWith('/social/new') || path.startsWith('/social/edit')) return 'compose';

  if (path.startsWith('/social/channels')) return 'channels';

  if (path.startsWith('/social/automation')) return 'automation';

  if (path.startsWith('/social/ai')) return 'ai';

  return 'posts';
};

const Social = () => {
  const { t } = useTranslation('social');
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const tab = tabOf(pathname);
  const editId = /^\/social\/edit\/(\d+)/.exec(pathname)?.[1];

  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setAccounts(await SocialService.accounts());
      setError(null);
    } catch (e) {
      setError(errorMessage(e, t('channels.loadError')));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    reload();
  }, [reload]);

  const accountsState: AccountsState = { list: accounts, loading, error, reload };

  return (
    <Layout>
      <DeskPage>
        <PageHead
          title={t('title')}
          subtitle={t('subtitle')}
          actions={
            tab !== 'compose' && (
              <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate('/social/new')}>
                {t('newPost')}
              </Button>
            )
          }
        />
        <DeskTabs<TabKey>
          ariaLabel={t('title')}
          value={tab}
          onChange={v => navigate(TAB_PATHS[v])}
          items={[
            { value: 'posts', label: t('tab.posts') },
            { value: 'compose', label: editId ? t('tab.edit') : t('tab.compose') },
            {
              value: 'channels',
              label: t('tab.channels'),
              count: accounts.length || undefined,
            },
            { value: 'ai', label: t('tab.ai') },
            { value: 'automation', label: t('tab.automation') },
          ]}
        />
        {tab === 'posts' && <Posts accounts={accountsState} />}
        {/* key: another edit, a copy or a plain new post each start from a clean composer. */}
        {tab === 'compose' && (
          <Composer key={editId ?? `new${search}`} editId={editId ? Number(editId) : null} accounts={accountsState} />
        )}
        {tab === 'channels' && <Channels accounts={accountsState} />}
        {tab === 'ai' && <AiTab accounts={accountsState} />}
        {tab === 'automation' && <Automation accounts={accountsState} />}
      </DeskPage>
    </Layout>
  );
};

export default Social;
