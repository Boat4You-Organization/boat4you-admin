/* Conversations in three columns (design 2.3): list, open conversation, client card. Short polling (plan P2): the
 * list's first page every 5 s, the open conversation every 4 s, live visitors every 15 s, only while the tab is visible
 * and never two of the same request in flight (createPoller). Deep link: /contact-center/c/:id. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { Box, Button, Drawer, Typography } from '@mui/material';
import { isAxiosError } from 'axios';

import ContactCenterService from '@/services/contactCenter.service';
import { bbColors } from '@/styles/bb';
import { ConversationDetail, ConversationFilter, ConversationRow, LiveRow } from '@/types/contactCenter.type';
import { Poller, createPoller } from '@/utils/contactCenter/poller';

import ClientCard from './ClientCard';
import ConversationList, { ListMode } from './ConversationList';
import ConversationPane from './ConversationPane';

const PAGE = 50;

const olderThan = (r: ConversationRow, last: ConversationRow) => {
  const a = new Date(r.lastActivityAt).getTime();
  const b = new Date(last.lastActivityAt).getTime();

  return a < b || (a === b && r.id < last.id);
};

const columnSx = { bgcolor: '#fff', border: `1px solid ${bbColors.gray100}`, borderRadius: 2, p: 1.5, minHeight: 0 };

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
    const { data } = await ContactCenterService.conversations({ ...asked, size: PAGE });

    if (asked !== filterRef.current) return; // the filter changed while this page was on its way

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

  const card = useMemo(
    () => (
      <ClientCard
        key={detail?.row.contactId ?? 'none'}
        contactId={detail?.row.contactId ?? null}
        onMerged={refreshBoth}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [detail?.row.contactId]
  );

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 1.5,
        gridTemplateColumns: { xs: '1fr', md: '340px 1fr', lg: '340px 1fr 320px' },
        height: { md: 'calc(100vh - 170px)' },
        minHeight: 480,
      }}
    >
      <Box sx={{ ...columnSx, display: { xs: selectedId ? 'none' : 'block', md: 'block' } }}>
        <ConversationList
          mode={mode}
          onMode={setMode}
          rows={rows}
          live={live}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={() => loadMore().catch(() => undefined)}
          selectedId={selectedId}
          onSelect={sid => navigate(`/contact-center/c/${sid}`)}
          filter={filter}
          onFilter={changeFilter}
          onDeleted={() => listPoller.current?.poke()}
        />
      </Box>

      <Box sx={{ ...columnSx, display: { xs: selectedId ? 'flex' : 'none', md: 'flex' }, flexDirection: 'column' }}>
        {selectedId != null && (
          <Box sx={{ display: { xs: 'flex', lg: 'none' }, gap: 1, mb: 1 }}>
            <Button size="small" sx={{ display: { md: 'none' } }} onClick={() => navigate('/contact-center')}>
              ← {t('backToList')}
            </Button>
            <Button size="small" onClick={() => setCardOpen(true)} disabled={!detail}>
              {t('clientCard')}
            </Button>
          </Box>
        )}
        {selectedId == null && (
          <Typography sx={{ m: 'auto', fontSize: 14, color: bbColors.gray500 }}>{t('pickSession')}</Typography>
        )}
        {missing && <Typography sx={{ m: 'auto', fontSize: 14, color: bbColors.gray500 }}>{t('notFound')}</Typography>}
        {detail && (
          <ConversationPane
            detail={detail}
            onChanged={refreshBoth}
            onDeleted={() => {
              navigate('/contact-center');
              listPoller.current?.poke();
            }}
          />
        )}
      </Box>

      <Box sx={{ ...columnSx, display: { xs: 'none', lg: 'block' }, overflowY: 'auto' }}>
        <Typography sx={{ fontSize: 14, fontWeight: 800, mb: 1 }}>{t('clientCard')}</Typography>
        {detail ? card : <Typography sx={{ fontSize: 13, color: bbColors.gray500 }}>—</Typography>}
      </Box>

      <Drawer anchor="right" open={cardOpen} onClose={() => setCardOpen(false)}>
        <Box sx={{ width: { xs: '100vw', sm: 380 }, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 800 }}>{t('clientCard')}</Typography>
            <Button size="small" sx={{ ml: 'auto' }} onClick={() => setCardOpen(false)}>
              {t('closePanel')}
            </Button>
          </Box>
          {detail && card}
        </Box>
      </Drawer>
    </Box>
  );
};

export default Conversations;
