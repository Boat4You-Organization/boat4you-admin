/* Site AI-chat inbox (Mario 19.7.2026): the assistant handles visitors on
 * www.boat4you.com; sessions where the visitor asked for a person land here
 * and a broker answers in the same thread (session flips to HUMAN — the AI
 * stays out from then on). Polling keeps both panes fresh; no SSE needed at
 * this volume.
 * IRIS guard (11.10.2026, after the 4.10. injection/XSS probes): the backend
 * flags suspicious sessions and locks them (status LOCKED, AI off for good).
 * Flagged sessions carry a ⚠️ badge, have their own filter and cannot be
 * deleted from here (they are evidence). Every visitor-, bot- or
 * metadata-derived value is rendered as a React text node: never
 * dangerouslySetInnerHTML, markdown or linkify (.eslintrc: react/no-danger). */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Button, Checkbox, Chip, Stack, Switch, TextField, Typography } from '@mui/material';
import dayjs from 'dayjs';

import Layout from '@/components/Layout';
import {
  ChatMessageDto,
  ChatSessionDto,
  bulkDeleteChats,
  closeChat,
  deleteChat,
  getChatSessions,
  getChatTranscript,
  replyToChat,
} from '@/services/chat.service';
import { bbColors } from '@/styles/bb';
import { showToast } from '@/valtio/global/global.actions';

// Keyed by string: a status this build does not know gets a grey chip.
const STATUS_COLOR: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  AI: 'info',
  HUMAN_REQUESTED: 'warning',
  HUMAN: 'success',
  CLOSED: 'default',
  LOCKED: 'error',
};

const SITE_ORIGIN = 'https://www.boat4you.com';

// Older backends send no `flagged`; a LOCKED status alone still counts.
const isSuspicious = (s: ChatSessionDto) => s.flagged === true || s.status === 'LOCKED';

// currentPage comes from an anonymous API call: '.evil.tld/x' or '@evil.tld/x'
// glued after the domain would open another host. Only a same-site path
// becomes a link; anything else is shown as text with a warning.
const pageHref = (page: string | null): string | null => {
  if (!page || !/^\/(?![/\\])[^\s\\]*$/.test(page)) return null;

  try {
    const url = new URL(page, SITE_ORIGIN);

    return url.origin === SITE_ORIGIN ? url.href : null;
  } catch {
    return null;
  }
};

// Widget heartbeats every 30s — under 90s since the last ping = the visitor
// still has the site open right now.
const isLive = (s: ChatSessionDto) => !!s.lastSeenAt && Date.now() - new Date(s.lastSeenAt).getTime() < 90_000;

// ISO-2 -> regional-indicator emoji flag ("HR" -> 🇭🇷); IP geolocation by DB-IP.
const flagOf = (code: string | null) =>
  code && code.length === 2
    ? String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1f1e6 + c.charCodeAt(0) - 65))
    : '';

const trailOf = (s: ChatSessionDto): string[] => {
  try {
    const parsed = JSON.parse(s.pageTrail ?? '[]');

    return Array.isArray(parsed) ? parsed.slice(-6) : [];
  } catch {
    return [];
  }
};

const Chat = () => {
  const { t } = useTranslation('chat');
  // Default = ALL conversations (Mario 20.7.2026: "zelim da vidim sve chatove");
  // the toggle narrows to needs-human when triaging.
  const [needsHumanOnly, setNeedsHumanOnly] = useState(false);
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [sessions, setSessions] = useState<ChatSessionDto[]>([]);
  const [selected, setSelected] = useState<ChatSessionDto | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  // Housekeeping: tick conversations in the list, then delete them for good.
  const [checked, setChecked] = useState<number[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  const loadSessions = useCallback(async () => {
    try {
      const { data } = await getChatSessions(needsHumanOnly, flaggedOnly);

      setSessions(data);
    } catch {
      /* transient — next poll retries */
    }
  }, [needsHumanOnly, flaggedOnly]);

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

  // The flagged filter is applied here as well, so an older backend that
  // ignores ?flaggedOnly still shows only suspicious rows.
  const visible = flaggedOnly ? sessions.filter(isSuspicious) : sessions;
  // Flagged sessions are evidence: never ticked, never sent to delete.
  const deletableIds = visible.filter(s => !isSuspicious(s)).map(s => s.id);
  const checkedDeletable = checked.filter(id => deletableIds.includes(id));

  const handleDelete = async (s: ChatSessionDto) => {
    if (isSuspicious(s)) return;

    // eslint-disable-next-line no-alert -- destructive, no confirm primitive in this view
    if (!window.confirm(t('confirmDelete'))) return;

    try {
      await deleteChat(s.id);
    } catch {
      showToast({ status: 'error', text: t('deleteFailed') });

      return;
    }

    setChecked(prev => prev.filter(x => x !== s.id));

    if (selected?.id === s.id) setSelected(null);

    await loadSessions();
  };

  const handleBulkDelete = async () => {
    const ids = checkedDeletable;

    // eslint-disable-next-line no-alert -- destructive, no confirm primitive in this view
    if (!ids.length || !window.confirm(t('confirmDeleteMany', { count: ids.length }))) return;

    try {
      await bulkDeleteChats(ids);
    } catch {
      showToast({ status: 'error', text: t('deleteFailed') });
      await loadSessions();

      return;
    }

    if (selected && ids.includes(selected.id)) setSelected(null);

    setChecked([]);
    await loadSessions();
  };

  const toggleChecked = (id: number) =>
    setChecked(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const bubbleSx = (role: ChatMessageDto['role']) => ({
    alignSelf: role === 'USER' ? 'flex-start' : 'flex-end',
    maxWidth: '78%',
    px: 1.5,
    py: 1,
    borderRadius: 2,
    fontSize: 14,
    whiteSpace: 'pre-wrap' as const,
    overflowWrap: 'anywhere' as const,
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
            <Typography sx={{ fontSize: 13, color: bbColors.gray500 }}>{t('flaggedOnly')}</Typography>
            <Switch checked={flaggedOnly} onChange={e => setFlaggedOnly(e.target.checked)} size="small" color="error" />
            <Typography sx={{ fontSize: 13, color: bbColors.gray500, ml: 1 }}>{t('needsHumanOnly')}</Typography>
            <Switch checked={needsHumanOnly} onChange={e => setNeedsHumanOnly(e.target.checked)} size="small" />
          </Stack>
        </Stack>

        <Stack direction="row" gap={2} sx={{ height: 'calc(100vh - 220px)', minHeight: 420 }}>
          {/* Session list */}
          <Box
            sx={{
              width: 340,
              flexShrink: 0,
              overflowY: 'auto',
              bgcolor: '#fff',
              borderRadius: 2,
              border: `1px solid ${bbColors.cardBorder}`,
            }}
          >
            {visible.length > 0 && (
              <Stack
                direction="row"
                alignItems="center"
                gap={0.5}
                sx={{
                  px: 1,
                  py: 0.5,
                  borderBottom: `1px solid ${bbColors.cardBorder}`,
                  position: 'sticky',
                  top: 0,
                  bgcolor: '#fff',
                  zIndex: 1,
                }}
              >
                <Checkbox
                  size="small"
                  disabled={deletableIds.length === 0}
                  checked={deletableIds.length > 0 && checkedDeletable.length === deletableIds.length}
                  indeterminate={checkedDeletable.length > 0 && checkedDeletable.length < deletableIds.length}
                  onChange={e => setChecked(e.target.checked ? deletableIds : [])}
                />
                <Typography sx={{ fontSize: 12, color: bbColors.gray500 }}>{t('selectAll')}</Typography>
                {checkedDeletable.length > 0 && (
                  <Button
                    size="small"
                    color="error"
                    variant="contained"
                    onClick={handleBulkDelete}
                    sx={{ ml: 'auto', fontSize: 11, py: 0.2, minWidth: 0 }}
                  >
                    {t('deleteSelected', { count: checkedDeletable.length })}
                  </Button>
                )}
              </Stack>
            )}
            {visible.length === 0 && (
              <Typography sx={{ p: 2, fontSize: 14, color: bbColors.gray500 }}>
                {t(flaggedOnly ? 'emptyFlagged' : 'empty')}
              </Typography>
            )}
            {visible.map(s => (
              <Box
                key={s.id}
                onClick={() => setSelected(s)}
                sx={{
                  p: 1.5,
                  cursor: 'pointer',
                  borderBottom: `1px solid ${bbColors.cardBorder}`,
                  borderLeft: `3px solid ${isSuspicious(s) ? bbColors.red600 : 'transparent'}`,
                  bgcolor: selected?.id === s.id ? '#eef1fb' : 'transparent',
                  '&:hover': { bgcolor: '#f6f8ff' },
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                  <Checkbox
                    size="small"
                    sx={{ p: 0.3, mr: 0.3 }}
                    disabled={isSuspicious(s)}
                    checked={!isSuspicious(s) && checked.includes(s.id)}
                    onClick={e => e.stopPropagation()}
                    onChange={() => toggleChecked(s.id)}
                  />
                  <Typography
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      fontSize: 13,
                      fontWeight: 700,
                      color: bbColors.navy900,
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {isLive(s) && (
                      <Box
                        component="span"
                        title={t('live')}
                        sx={{
                          mr: 0.7,
                          display: 'inline-block',
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: '#22c55e',
                        }}
                      />
                    )}
                    {s.visitorName || s.visitorEmail || `#${s.id}`}
                    {s.adminUnread && (
                      <Box
                        component="span"
                        sx={{
                          ml: 0.8,
                          display: 'inline-block',
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: '#e8622a',
                        }}
                      />
                    )}
                  </Typography>
                  {isSuspicious(s) && (
                    <Chip
                      label={`⚠️ ${t('suspicious')}`}
                      title={s.lockReason ?? undefined}
                      color="error"
                      variant="outlined"
                      size="small"
                      sx={{ fontSize: 11 }}
                    />
                  )}
                  <Chip
                    label={t(`status.${s.status}`, { defaultValue: s.status })}
                    color={STATUS_COLOR[s.status]}
                    size="small"
                    sx={{ fontSize: 11 }}
                  />
                </Stack>
                {isLive(s) && s.currentPage && (
                  <Typography
                    sx={{
                      fontSize: 11,
                      color: '#15803d',
                      mt: 0.2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t('viewing')}: {s.currentPage}
                  </Typography>
                )}
                <Typography
                  sx={{
                    fontSize: 12,
                    color: bbColors.gray500,
                    mt: 0.4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.lastMessage || '—'}
                </Typography>
                <Typography sx={{ fontSize: 11, color: bbColors.gray500, mt: 0.2 }}>
                  {dayjs(s.lastActivityAt).format('DD.MM. HH:mm')} · {s.locale}
                  {s.countryCode ? ` · ${flagOf(s.countryCode)} ${s.country ?? s.countryCode}` : ''}
                  {s.visitorEmail && s.visitorName ? ` · ${s.visitorEmail}` : ''}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Transcript + reply */}
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: '#fff',
              borderRadius: 2,
              border: `1px solid ${bbColors.cardBorder}`,
            }}
          >
            {!selected ? (
              <Typography sx={{ m: 'auto', fontSize: 14, color: bbColors.gray500 }}>{t('pickSession')}</Typography>
            ) : (
              <>
                {(() => {
                  // The list refreshes every 10s; `selected` is a snapshot — read the
                  // fresh row for live presence so the header doesn't go stale.
                  const sel = sessions.find(x => x.id === selected.id) ?? selected;
                  const trail = trailOf(sel);
                  const suspicious = isSuspicious(sel);
                  const href = pageHref(sel.currentPage);
                  const lockedAt =
                    sel.lockedAt && dayjs(sel.lockedAt).isValid()
                      ? dayjs(sel.lockedAt).format('DD.MM.YYYY HH:mm')
                      : null;

                  return (
                    <Stack sx={{ p: 1.5, borderBottom: `1px solid ${bbColors.cardBorder}`, gap: 0.4 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography sx={{ fontSize: 14, fontWeight: 700, color: bbColors.navy900 }}>
                          {isLive(sel) && (
                            <Box
                              component="span"
                              sx={{
                                mr: 0.7,
                                display: 'inline-block',
                                width: 9,
                                height: 9,
                                borderRadius: '50%',
                                bgcolor: '#22c55e',
                              }}
                            />
                          )}
                          {sel.visitorName || sel.visitorEmail || `#${sel.id}`}
                          <Box
                            component="span"
                            sx={{
                              ml: 1,
                              fontSize: 12,
                              fontWeight: 500,
                              color: isLive(sel) ? '#15803d' : bbColors.gray500,
                            }}
                          >
                            {isLive(sel) && t('live')}
                            {!isLive(sel) &&
                              sel.lastSeenAt &&
                              `${t('lastSeen')} ${dayjs(sel.lastSeenAt).format('DD.MM. HH:mm')}`}
                          </Box>
                        </Typography>
                        <Stack direction="row" gap={1}>
                          <Button size="small" variant="outlined" onClick={handleClose}>
                            {t('close')}
                          </Button>
                          {!suspicious && (
                            <Button size="small" color="error" variant="outlined" onClick={() => handleDelete(sel)}>
                              {t('delete')}
                            </Button>
                          )}
                        </Stack>
                      </Stack>
                      {suspicious && (
                        <Typography
                          sx={{
                            fontSize: 12,
                            color: bbColors.red600,
                            bgcolor: bbColors.red100,
                            borderRadius: 1,
                            px: 1,
                            py: 0.6,
                            overflowWrap: 'anywhere',
                          }}
                        >
                          ⚠️ {t('suspiciousBanner')}
                          {` · ${t('statusLabel')}: ${t(`status.${sel.status}`, { defaultValue: sel.status })}`}
                          {sel.lockReason && ` · ${t('lockReason')}: ${sel.lockReason}`}
                          {lockedAt && ` · ${t('lockedAt')}: ${lockedAt}`}
                        </Typography>
                      )}
                      <Typography
                        sx={{
                          fontSize: 12,
                          color: bbColors.gray500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {sel.currentPage && (
                          <>
                            {t('viewing')}:{' '}
                            {href ? (
                              <Box
                                component="a"
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ color: '#2856ff' }}
                              >
                                {sel.currentPage}
                              </Box>
                            ) : (
                              <>
                                {sel.currentPage}
                                <Box
                                  component="span"
                                  title={t('suspiciousLinkHint')}
                                  sx={{
                                    ml: 0.6,
                                    px: 0.6,
                                    borderRadius: 1,
                                    bgcolor: bbColors.red600,
                                    color: '#fff',
                                    fontSize: 10,
                                    fontWeight: 700,
                                  }}
                                >
                                  {t('suspiciousLink')}
                                </Box>
                              </>
                            )}
                          </>
                        )}
                        {` · ${sel.locale}`}
                        {sel.countryCode && (
                          <Box component="span" title={sel.ip ?? undefined}>
                            {` · ${flagOf(sel.countryCode)} ${sel.country ?? sel.countryCode}`}
                          </Box>
                        )}
                        {` · ${t('cameFrom')}: ${sel.referrer || t('direct')}`}
                      </Typography>
                      {trail.length > 1 && (
                        <Typography
                          sx={{
                            fontSize: 11,
                            color: bbColors.gray500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {t('trail')}: {trail.join(' → ')}
                        </Typography>
                      )}
                    </Stack>
                  );
                })()}
                <Box
                  ref={listRef}
                  sx={{
                    flex: 1,
                    overflowY: 'auto',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    bgcolor: '#fafbff',
                  }}
                >
                  {messages.map(m => (
                    <Box key={m.id} sx={bubbleSx(m.role)}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, opacity: 0.7, mb: 0.3 }}>
                        {t(`role.${m.role}`, { defaultValue: m.role })} · {dayjs(m.createdAt).format('HH:mm')}
                      </Typography>
                      {/* Plain text node: '<img onerror>' or '[x](javascript:)' must show literally. */}
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
