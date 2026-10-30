/* Who is on the sites now (P1b registry, design 2.3), every 15 s while the tab is visible. Empty until the shared
 * widget (P3) is on the sites: that is an explained empty state, not an error. */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Box, Button, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import dayjs from 'dayjs';

import ContactCenterService from '@/services/contactCenter.service';
import { bbColors } from '@/styles/bb';
import { LiveRow } from '@/types/contactCenter.type';
import { formatDuration } from '@/utils/contactCenter/display';
import { createPoller } from '@/utils/contactCenter/poller';
import { siteLabel } from '@/utils/contactCenter/safeLink';
import { PageLink, SiteChip, countryText } from '@/views/ContactCenter/common';

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

  if (rows && !rows.length) {
    return <Typography sx={{ fontSize: 14, color: bbColors.gray500, p: 2 }}>{t('liveEmpty')}</Typography>;
  }

  return (
    <Box sx={{ bgcolor: '#fff', border: `1px solid ${bbColors.gray100}`, borderRadius: 2, overflowX: 'auto' }}>
      {failed && <Typography sx={{ fontSize: 13, color: bbColors.red600, p: 1 }}>{t('loadFailed')}</Typography>}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{t('liveTable.site')}</TableCell>
            <TableCell>{t('liveTable.page')}</TableCell>
            <TableCell>{t('liveTable.onPage')}</TableCell>
            <TableCell>{t('liveTable.visitor')}</TableCell>
            <TableCell>{t('liveTable.country')}</TableCell>
            <TableCell>{t('liveTable.source')}</TableCell>
            <TableCell>{t('liveTable.device')}</TableCell>
            <TableCell>{t('liveTable.chat')}</TableCell>
            <TableCell>{t('liveTable.pages')}</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {(rows ?? []).map(r => {
            const v = r.visitor;
            const onPage = v.currentPageSince ? dayjs().diff(dayjs(v.currentPageSince), 'second') : null;

            return (
              <TableRow
                key={v.visitKey}
                hover
                onClick={() => r.chatSessionId && navigate(`/contact-center/c/${r.chatSessionId}`)}
                sx={{ cursor: r.chatSessionId ? 'pointer' : 'default' }}
              >
                <TableCell>
                  <SiteChip siteId={v.siteId} />
                </TableCell>
                <TableCell sx={{ maxWidth: 280 }}>
                  {v.currentTitle && <Box sx={{ fontWeight: 600 }}>{v.currentTitle}</Box>}
                  <PageLink siteId={v.siteId} path={v.currentPath} />
                </TableCell>
                <TableCell>{formatDuration(onPage)}</TableCell>
                <TableCell>
                  {r.contactName ?? t('anonymousVisitor')} · {v.returning ? t('returning') : t('new')}
                </TableCell>
                <TableCell>{countryText(v.countryCode)}</TableCell>
                <TableCell>
                  {t(`channel.${v.channel}`, { defaultValue: v.channel })}
                  {v.fromSiteId && ` · ${siteLabel(v.fromSiteId)}`}
                </TableCell>
                <TableCell>{[v.deviceClass, v.browser, v.os].filter(Boolean).join(' · ')}</TableCell>
                <TableCell>
                  {r.chatStatus ? t(`status.${r.chatStatus}`, { defaultValue: r.chatStatus }) : t('chatNotOpened')}
                  {r.adminUnread && ` · ${t('unread')}`}
                </TableCell>
                <TableCell>{v.pageCount}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    onClick={e => {
                      e.stopPropagation();
                      setTarget(r);
                    }}
                  >
                    {t('proactive.button')}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <ProactiveDialog row={target} onClose={() => setTarget(null)} />
    </Box>
  );
};

export default LiveVisitors;
