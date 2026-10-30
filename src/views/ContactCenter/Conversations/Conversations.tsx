/* Conversations in three columns (design 2.3): list, open conversation, client card. Short polling (plan P2): the
 * list's first page every 5 s, the open conversation every 4 s, live visitors every 15 s, only while the tab is visible
 * and never two of the same request in flight (createPoller). Deep link: /contact-center/c/:id. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';

import { Box, Drawer } from '@mui/material';
import { isAxiosError } from 'axios';

import ContactCenterService from '@/services/contactCenter.service';
import { ConversationDetail, ConversationFilter, ConversationRow, LiveRow } from '@/types/contactCenter.type';
import { Poller, createPoller } from '@/utils/contactCenter/poller';
import { linkSx } from '@/views/ContactCenter/common';
import { ChatIcon, Empty, GoneIcon, Sk, cc, panelSx, scrollSx } from '@/views/ContactCenter/ui';

import ClientCard from './ClientCard';
import ConversationList, { ListMode } from './ConversationList';
import ConversationPane from './ConversationPane';

const PAGE = 50;

const olderThan = (r: ConversationRow, last: ConversationRow) => {
  const a = new Date(r.lastActivityAt).getTime();
  const b = new Date(last.lastActivityAt).getTime();

  return a < b || (a === b && r.id < last.id);
};

const columnSx = { ...panelSx, minHeight: 0, height: '100%', display: 'flex', flexDirection: 'column' } as const;

const Conversations = () => {
  const { t } = useTranslation('contactCenter');
  const navigate = useNavigate();
  const { id } = useParams();
  const selectedId = id && /^\d+$/.test(id) ? Number(id) : null;

  const [mode, setMode] = useState<ListMode>('all');
  const [filter, setFilter] = useState<ConversationFilter>({});
  const [rows, setRows] = useState<ConversationRow[]>([]);
  const [live, setLive] = useState<LiveRow[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listFailed, setListFailed] = useState(false);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [missing, setMissing] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);

  const filterRef = useRef(filter);
  const rowsRef = useRef(rows);
  const listPoller = useRef<Poller | null>(null);
  const detailPoller = useRef<Poller | null>(null);

  filterRef.current = filter;
  rowsRef.current = rows;

  const loadFirst = useCallback(async () => {
    const asked = filterRef.current;
    let data: ConversationRow[];

    try {
      data = (await ContactCenterService.conversations({ ...asked, size: PAGE })).data;
    } catch {
      if (asked === filterRef.current) setListFailed(true); // the last good rows stay visible under the notice

      return;
    }

    if (asked !== filterRef.current) return; // the filter changed while this page was on its way

    setListFailed(false);

    const last = data[data.length - 1];
    const tail = last ? rowsRef.current.filter(r => !data.some(d => d.id === r.id) && olderThan(r, last)) : [];

    setRows([...data, ...tail]);

    if (!tail.length) setHasMore(data.length === PAGE);

    setLoading(false);
  }, []);

  const loadMore = async () => {
    const last = rowsRef.current[rowsRef.current.length - 1];

    if (!last) return;

    const { data } = await ContactCenterService.conversations({
      ...filterRef.current,
      before: last.lastActivityAt,
      beforeId: last.id,
      size: PAGE,
    });

    setRows(prev => [...prev, ...data.filter(d => !prev.some(p => p.id === d.id))]);
    setHasMore(data.length === PAGE);
  };

  useEffect(() => {
    const poller = createPoller(loadFirst, 5_000);

    listPoller.current = poller;
    poller.start();

    return () => poller.stop();
  }, [loadFirst]);

  useEffect(() => {
    if (mode !== 'live') return undefined;

    const poller = createPoller(async () => setLive((await ContactCenterService.live()).data), 15_000);

    poller.start();

    return () => poller.stop();
  }, [mode]);

  const changeFilter = useCallback((f: ConversationFilter) => {
    filterRef.current = f;
    rowsRef.current = [];
    setFilter(f);
    setRows([]);
    setLoading(true);
    listPoller.current?.poke();
  }, []);

  const selectedRef = useRef(selectedId);

  selectedRef.current = selectedId;

  // Opening a conversation does not clear its unread dot: the broker e-mail is sent once per burst while the flag is
  // set, and only a reply or a close clears it (ADMIN-10, as on the old /chat).
  const loadDetail = useCallback(async () => {
    if (selectedId == null) return;

    try {
      const { data } = await ContactCenterService.conversation(selectedId);

      if (selectedRef.current !== selectedId) return; // another conversation was opened while this one was loading

      setDetail(data);
      setMissing(false);
    } catch (e) {
      if (selectedRef.current === selectedId && isAxiosError(e) && e.response?.status === 404) {
        setDetail(null);
        setMissing(true);
        detailPoller.current?.stop();
      }
    }
  }, [selectedId]);

  useEffect(() => {
    setDetail(null);
    setMissing(false);

    if (selectedId == null) return undefined;

    const poller = createPoller(loadDetail, 4_000);

    detailPoller.current = poller;
    poller.start();

    return () => poller.stop();
  }, [selectedId, loadDetail]);

  const refreshBoth = () => {
    detailPoller.current?.poke();
    listPoller.current?.poke();
  };

  const contactId = detail?.row.contactId ?? null;
  const card = useCallback(
    (layout: 'column' | 'drawer') => (
      <ClientCard
        key={contactId ?? 'none'}
        contactId={contactId}
        layout={layout}
        onMerged={refreshBoth}
        onClose={layout === 'drawer' ? () => setCardOpen(false) : undefined}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [contactId]
  );

  const backToList = () => navigate('/contact-center');

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', md: '340px minmax(0, 1fr)', lg: '340px minmax(0, 1fr) 320px' },
        height: { xs: 'calc(100dvh - 150px)', md: 'calc(100vh - 150px)' },
        minHeight: 560,
      }}
    >
      <Box
        component="section"
        aria-label={t('listLabel')}
        sx={{ ...columnSx, display: { xs: selectedId ? 'none' : 'flex', md: 'flex' } }}
      >
        <ConversationList
          mode={mode}
          onMode={setMode}
          rows={rows}
          live={live}
          loading={loading}
          failed={listFailed}
          hasMore={hasMore}
          onLoadMore={() => loadMore().catch(() => undefined)}
          selectedId={selectedId}
          onSelect={sid => navigate(`/contact-center/c/${sid}`)}
          filter={filter}
          onFilter={changeFilter}
          onDeleted={() => listPoller.current?.poke()}
        />
      </Box>

      <Box
        component="section"
        aria-label={t('conversationLabel')}
        sx={{ ...columnSx, position: 'relative', display: { xs: selectedId ? 'flex' : 'none', md: 'flex' } }}
      >
        {selectedId == null && (
          <Empty>
            <ChatIcon />
            {t('pickSession')}
          </Empty>
        )}
        {missing && (
          <Empty>
            <GoneIcon />
            <Box component="span" sx={{ color: cc.ink, fontWeight: 600 }}>
              {t('notFound')}
            </Box>
            <Box component={RouterLink} to="/contact-center" sx={{ ...linkSx, fontSize: 13.5 }}>
              ← {t('backToListLong')}
            </Box>
          </Empty>
        )}
        {selectedId != null && !detail && !missing && (
          <Box sx={{ p: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Sk h={18} w="40%" />
            <Sk h={12} w="70%" />
            <Sk h={120} w="100%" r={10} />
            <Sk h={54} w="55%" r={12} />
            <Sk h={54} w="60%" r={12} sx={{ alignSelf: 'flex-end' }} />
          </Box>
        )}
        {detail && (
          <ConversationPane
            detail={detail}
            onChanged={refreshBoth}
            onBack={backToList}
            onOpenCard={() => setCardOpen(true)}
            onDeleted={() => {
              backToList();
              listPoller.current?.poke();
            }}
          />
        )}
      </Box>

      <Box
        component="aside"
        aria-label={t('clientCard')}
        sx={{ ...columnSx, ...scrollSx, display: { xs: 'none', lg: 'block' } }}
      >
        {detail ? card('column') : null}
      </Box>

      <Drawer anchor="right" open={cardOpen} onClose={() => setCardOpen(false)}>
        <Box sx={{ width: { xs: '100vw', sm: 400 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {detail && card('drawer')}
        </Box>
      </Drawer>
    </Box>
  );
};

export default Conversations;
