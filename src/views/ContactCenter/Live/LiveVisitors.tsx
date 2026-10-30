/* Who is on the sites now (P1b registry, design 2.3), every 15 s while the tab is visible. Empty until the shared
 * widget (P3) is on the sites: that is an explained empty state, not an error. */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Box } from '@mui/material';
import dayjs from 'dayjs';

import ContactCenterService from '@/services/contactCenter.service';
import { LiveRow } from '@/types/contactCenter.type';
import { formatDuration } from '@/utils/contactCenter/display';
import { createPoller } from '@/utils/contactCenter/poller';
import { siteLabel } from '@/utils/contactCenter/safeLink';
import { PageLink, SiteChip, countryText } from '@/views/ContactCenter/common';
import { CHAT_STATUS_COLORS, CcButton, Dot, LoadAlert, Pill, cc, panelSx, tableSx } from '@/views/ContactCenter/ui';

import ProactiveDialog from './ProactiveDialog';

const LiveVisitors = () => {
  const { t } = useTranslation('contactCenter');
  const navigate = useNavigate();
  const [rows, setRows] = useState<LiveRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [target, setTarget] = useState<LiveRow | null>(null);

  useEffect(() => {
    const poller = createPoller(async () => {
      try {
        setRows((await ContactCenterService.live()).data);
        setFailed(false);
      } catch {
        setFailed(true);
      }
    }, 15_000);

    poller.start();

    return () => poller.stop();
  }, []);

  const list = rows ?? [];

  return (
    <Box component="section" sx={panelSx}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '10px 16px',
          p: '14px 16px',
          borderBottom: `1px solid ${cc.hair}`,
        }}
      >
        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 15, fontWeight: 700 }}>
          <Dot color={cc.green} size={9} />
          {rows ? t('liveHeader', { count: rows.length }) : t('tab.live')}
        </Box>
        <Box component="span" sx={{ fontSize: 12.5, color: cc.muted }}>
          {t('liveSub')}
        </Box>
      </Box>
      {failed && (
        <Box sx={{ p: '12px 16px 0' }}>
          <LoadAlert text={t('loadFailed')} />
        </Box>
      )}
      {rows && !rows.length ? (
        <Box sx={{ p: '40px 16px', textAlign: 'center', fontSize: 13.5, color: cc.muted }}>{t('liveEmpty')}</Box>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Box component="table" sx={{ ...tableSx, minWidth: 1240, '& th, & td': { px: '12px' } }}>
            <thead>
              <tr>
                <th>{t('liveTable.site')}</th>
                <th>{t('liveTable.page')}</th>
                <th>{t('liveTable.onPage')}</th>
                <th>{t('liveTable.visitor')}</th>
                <th>{t('liveTable.country')}</th>
                <th>{t('liveTable.source')}</th>
                <th>{t('liveTable.device')}</th>
                <th>{t('liveTable.chat')}</th>
                <th>{t('liveTable.pages')}</th>
                <th>
                  <Box
                    component="span"
                    sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}
                  >
                    {t('liveTable.action')}
                  </Box>
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map(r => {
                const v = r.visitor;
                const onPage = v.currentPageSince ? dayjs().diff(dayjs(v.currentPageSince), 'second') : null;
                const chatColors = r.chatStatus ? CHAT_STATUS_COLORS[r.chatStatus] : undefined;

                return (
                  <tr
                    key={v.visitKey}
                    className={r.chatSessionId ? 'click' : undefined}
                    onClick={() => r.chatSessionId && navigate(`/contact-center/c/${r.chatSessionId}`)}
                  >
                    <td>
                      <SiteChip siteId={v.siteId} />
                    </td>
                    <Box component="td" sx={{ maxWidth: 260 }}>
                      {v.currentTitle && (
                        <Box
                          sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {v.currentTitle}
                        </Box>
                      )}
                      <Box sx={{ fontSize: 12 }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <PageLink siteId={v.siteId} path={v.currentPath} />
                      </Box>
                    </Box>
                    <td className="nowrap tnum">{formatDuration(onPage)}</td>
                    <td>
                      <Box sx={{ fontWeight: 500 }}>{r.contactName ?? t('anonymousVisitor')}</Box>
                      <Box sx={{ fontSize: 12, color: cc.muted }}>{v.returning ? t('returning') : t('new')}</Box>
                    </td>
                    <td>{countryText(v.countryCode)}</td>
                    <td>
                      <Box>{t(`channel.${v.channel}`, { defaultValue: v.channel })}</Box>
                      {v.fromSiteId && <Box sx={{ fontSize: 12, color: cc.muted }}>{siteLabel(v.fromSiteId)}</Box>}
                    </td>
                    <td>
                      <Box sx={{ fontSize: 12, fontWeight: 600, letterSpacing: '.03em' }}>{v.deviceClass ?? '—'}</Box>
                      <Box sx={{ fontSize: 12, color: cc.muted }}>{[v.browser, v.os].filter(Boolean).join(' · ')}</Box>
                    </td>
                    <td>
                      <Pill colors={chatColors}>
                        {r.chatStatus
                          ? t(`status.${r.chatStatus}`, { defaultValue: r.chatStatus })
                          : t('chatNotOpened')}
                      </Pill>
                      {r.adminUnread && (
                        <Box sx={{ mt: '4px', fontSize: 12, fontWeight: 600, color: cc.red }}>{`● ${t('unread')}`}</Box>
                      )}
                    </td>
                    <td className="tnum">{v.pageCount}</td>
                    <Box component="td" sx={{ textAlign: 'right' }}>
                      <CcButton
                        onClick={e => {
                          e.stopPropagation();
                          setTarget(r);
                        }}
                        sx={{ minHeight: 34 }}
                      >
                        {t('proactive.button')}
                      </CcButton>
                    </Box>
                  </tr>
                );
              })}
            </tbody>
          </Box>
        </Box>
      )}
      <ProactiveDialog row={target} onClose={() => setTarget(null)} />
    </Box>
  );
};

export default LiveVisitors;
