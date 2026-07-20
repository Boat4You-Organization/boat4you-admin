/* Site AI-chat inbox (Mario 19.7.2026): the assistant handles visitors on
 * www.boat4you.com; sessions where the visitor asked for a person land here
 * and a broker answers in the same thread (session flips to HUMAN — the AI
 * stays out from then on). Polling keeps both panes fresh; no SSE needed at
 * this volume. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Button, Chip, Stack, Switch, TextField, Typography } from '@mui/material';
import dayjs from 'dayjs';

import Layout from '@/components/Layout';
import {
  ChatMessageDto,
  ChatSessionDto,
  closeChat,
  getChatSessions,
  getChatTranscript,
  replyToChat,
} from '@/services/chat.service';
import { bbColors } from '@/styles/bb';

const STATUS_COLOR: Record<ChatSessionDto['status'], 'default' | 'info' | 'warning' | 'success'> = {
  AI: 'info',
  HUMAN_REQUESTED: 'warning',
  HUMAN: 'success',
  CLOSED: 'default',
};

const Chat = () => {
  const { t } = useTranslation('chat');
  // Default = ALL conversations (Mario 20.7.2026: "zelim da vidim sve chatove");
  // the toggle narrows to needs-human when triaging.
  const [needsHumanOnly, setNeedsHumanOnly] = useState(false);
  const [sessions, setSessions] = useState<ChatSessionDto[]>([]);
  const [selected, setSelected] = useState<ChatSessionDto | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const loadSessions = useCallback(async () => {
    try {
      const { data } = await getChatSessions(needsHumanOnly);

      setSessions(data);
    } catch {
      /* transient — next poll retries */
    }
  }, [needsHumanOnly]);

  const loadTranscript = useCallback(async (id: number) => {
    try {
      const { data } = await getChatTranscript(id);

      setMessages(data);
      requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight }));
    } catch {
      /* transient */
    }
  }, []);

  useEffect(() => {
    loadSessions();

    const interval = window.setInterval(loadSessions, 10000);

    return () => window.clearInterval(interval);
  }, [loadSessions]);

  useEffect(() => {
    if (!selected) return undefined;

    loadTranscript(selected.id);

    const interval = window.setInterval(() => loadTranscript(selected.id), 7000);

    return () => window.clearInterval(interval);
  }, [selected, loadTranscript]);

  const sendReply = async () => {
    if (!selected || !reply.trim() || sending) return;

    setSending(true);
    try {
      await replyToChat(selected.id, reply.trim());
      setReply('');
      await loadTranscript(selected.id);
      await loadSessions();
    } finally {
      setSending(false);
    }
  };

  const handleClose = async () => {
    if (!selected) return;

    await closeChat(selected.id);
    setSelected(null);
    await loadSessions();
  };

  const bubbleSx = (role: ChatMessageDto['role']) => ({
    alignSelf: role === 'USER' ? 'flex-start' : 'flex-end',
    maxWidth: '78%',
    px: 1.5,
    py: 1,
    borderRadius: 2,
    fontSize: 14,
    whiteSpace: 'pre-wrap' as const,
    // eslint-disable-next-line no-nested-ternary -- three-way role palette reads clearer inline
    bgcolor: role === 'USER' ? '#fff' : role === 'ADMIN' ? bbColors.navy700 : '#eef1fb',
    color: role === 'ADMIN' ? '#fff' : bbColors.navy900,
    border: role === 'USER' ? `1px solid ${bbColors.cardBorder}` : 'none',
  });

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: 24, fontWeight: 800, color: bbColors.navy900 }}>{t('title')}</Typography>
          <Stack direction="row" alignItems="center" gap={1}>
            <Typography sx={{ fontSize: 13, color: bbColors.gray500 }}>{t('needsHumanOnly')}</Typography>
            <Switch checked={needsHumanOnly} onChange={e => setNeedsHumanOnly(e.target.checked)} size="small" />
          </Stack>
        </Stack>

        <Stack direction="row" gap={2} sx={{ height: 'calc(100vh - 220px)', minHeight: 420 }}>
          {/* Session list */}
          <Box sx={{ width: 340, flexShrink: 0, overflowY: 'auto', bgcolor: '#fff', borderRadius: 2, border: `1px solid ${bbColors.cardBorder}` }}>
            {sessions.length === 0 && (
              <Typography sx={{ p: 2, fontSize: 14, color: bbColors.gray500 }}>{t('empty')}</Typography>
            )}
            {sessions.map(s => (
              <Box
                key={s.id}
                onClick={() => setSelected(s)}
                sx={{
                  p: 1.5,
                  cursor: 'pointer',
                  borderBottom: `1px solid ${bbColors.cardBorder}`,
                  bgcolor: selected?.id === s.id ? '#eef1fb' : 'transparent',
                  '&:hover': { bgcolor: '#f6f8ff' },
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: bbColors.navy900 }}>
                    {s.visitorName || s.visitorEmail || `#${s.id}`}
                    {s.adminUnread && <Box component="span" sx={{ ml: 0.8, display: 'inline-block', width: 8, height: 8, borderRadius: '50%', bgcolor: '#e8622a' }} />}
                  </Typography>
                  <Chip label={t(`status.${s.status}`)} color={STATUS_COLOR[s.status]} size="small" sx={{ fontSize: 11 }} />
                </Stack>
                <Typography sx={{ fontSize: 12, color: bbColors.gray500, mt: 0.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.lastMessage || '—'}
                </Typography>
                <Typography sx={{ fontSize: 11, color: bbColors.gray500, mt: 0.2 }}>
                  {dayjs(s.lastActivityAt).format('DD.MM. HH:mm')} · {s.locale}
                  {s.visitorEmail && s.visitorName ? ` · ${s.visitorEmail}` : ''}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Transcript + reply */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: '#fff', borderRadius: 2, border: `1px solid ${bbColors.cardBorder}` }}>
            {!selected ? (
              <Typography sx={{ m: 'auto', fontSize: 14, color: bbColors.gray500 }}>{t('pickSession')}</Typography>
            ) : (
              <>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 1.5, borderBottom: `1px solid ${bbColors.cardBorder}` }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: bbColors.navy900 }}>
                    {selected.visitorName || selected.visitorEmail || `#${selected.id}`}
                  </Typography>
                  <Button size="small" variant="outlined" onClick={handleClose}>
                    {t('close')}
                  </Button>
                </Stack>
                <Box ref={listRef} sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1, bgcolor: '#fafbff' }}>
                  {messages.map(m => (
                    <Box key={m.id} sx={bubbleSx(m.role)}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, opacity: 0.7, mb: 0.3 }}>
                        {t(`role.${m.role}`)} · {dayjs(m.createdAt).format('HH:mm')}
                      </Typography>
                      {m.content}
                    </Box>
                  ))}
                </Box>
                <Stack direction="row" gap={1} sx={{ p: 1.5, borderTop: `1px solid ${bbColors.cardBorder}` }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder={t('replyPlaceholder')}
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendReply()}
                  />
                  <Button variant="contained" onClick={sendReply} disabled={sending || !reply.trim()}>
                    {t('send')}
                  </Button>
                </Stack>
              </>
            )}
          </Box>
        </Stack>
      </Box>
    </Layout>
  );
};

export default Chat;
