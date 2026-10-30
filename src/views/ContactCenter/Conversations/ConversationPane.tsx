/* Middle column: the open conversation (design 2.3). A reply takes the conversation over and the AI stays out
 * (ADMIN-8, ADMIN-14); "Preuzmi" does that without a message; "Vrati AI-ju" never for a suspicious one (ADMIN-9); a
 * suspicious conversation is evidence and cannot be deleted (ADMIN-5). */
import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Button, Stack, TextField, Typography } from '@mui/material';

import { closeChat, deleteChat, replyToChat } from '@/services/chat.service';
import ContactCenterService from '@/services/contactCenter.service';
import { bbColors } from '@/styles/bb';
import { ConversationDetail } from '@/types/contactCenter.type';
import { displayName, isLiveNow } from '@/utils/contactCenter/display';
import { showToast } from '@/valtio/global/global.actions';
import { ChatStatusChip, PageLink, SiteChip, countryText, formatAt, isSuspicious } from '@/views/ContactCenter/common';

import MessageBubble from './MessageBubble';
import NavigationHistory from './NavigationHistory';

interface Props {
  detail: ConversationDetail;
  onChanged(): void;
  onDeleted(): void;
}

const TAKE_OVER_FROM = ['AI', 'HUMAN_REQUESTED', 'CLOSED'];

const ConversationPane = ({ detail, onChanged, onDeleted }: Props) => {
  const { t } = useTranslation('contactCenter');
  const { row } = detail;
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const suspicious = isSuspicious(row);
  const live = isLiveNow(row.lastSeenAt);
  const lastId = detail.messages[detail.messages.length - 1]?.id;
  let seenText = '';

  if (live) seenText = t('live');
  else if (row.lastSeenAt) seenText = `${t('lastSeen')} ${formatAt(row.lastSeenAt)}`;

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' });
  }, [lastId, row.id]);

  useEffect(() => setDraft(''), [row.id]);

  const run = async (action: () => Promise<unknown>, failText: string) => {
    if (busy) return;

    setBusy(true);
    try {
      await action();
      onChanged();
    } catch {
      showToast({ status: 'error', text: failText });
    } finally {
      setBusy(false);
    }
  };

  const send = () => {
    const content = draft.trim();

    if (!content) return;

    run(async () => {
      await replyToChat(row.id, content);
      setDraft('');
    }, t('replyFailed')).catch(() => undefined);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };

  const remove = async () => {
    if (!window.confirm(t('confirmDelete'))) return;

    try {
      await deleteChat(row.id);
      onDeleted();
    } catch {
      showToast({ status: 'error', text: t('deleteFailed') });
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Box sx={{ borderBottom: `1px solid ${bbColors.gray100}`, pb: 1, mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography sx={{ fontSize: 18, fontWeight: 800, color: bbColors.navy900 }}>{displayName(row)}</Typography>
          <ChatStatusChip status={row.status} />
          <SiteChip siteId={row.siteId} />
          <Typography sx={{ fontSize: 12, color: live ? bbColors.green600 : bbColors.gray500 }}>{seenText}</Typography>
          <Stack direction="row" gap={0.75} sx={{ ml: 'auto', flexWrap: 'wrap' }}>
            {TAKE_OVER_FROM.includes(row.status) && (
              <Button
                size="small"
                variant="contained"
                disabled={busy}
                onClick={() => run(() => ContactCenterService.takeOver(row.id), t('actionFailed'))}
              >
                {t('takeOver')}
              </Button>
            )}
            {row.status === 'HUMAN' && !suspicious && (
              <Button
                size="small"
                variant="outlined"
                disabled={busy}
                onClick={() => run(() => ContactCenterService.returnToAi(row.id), t('actionFailed'))}
              >
                {t('returnToAi')}
              </Button>
            )}
            {row.status !== 'CLOSED' && (
              <Button size="small" disabled={busy} onClick={() => run(() => closeChat(row.id), t('actionFailed'))}>
                {t('close')}
              </Button>
            )}
            {!suspicious && (
              <Button size="small" color="error" disabled={busy} onClick={remove}>
                {t('delete')}
              </Button>
            )}
          </Stack>
        </Box>
        <Typography sx={{ fontSize: 12, color: bbColors.gray600, mt: 0.5 }}>
          {[row.visitorEmail, row.phone, countryText(row.countryCode, row.country), row.locale, row.ip]
            .filter(Boolean)
            .join(' · ')}
        </Typography>
        {suspicious && (
          <Box sx={{ mt: 1, p: 1, borderRadius: 1.5, bgcolor: bbColors.red100, color: bbColors.red600, fontSize: 13 }}>
            ⚠ {t('suspiciousBanner')}
            {` · ${t('statusLabel')}: ${t(`status.${row.status}`, { defaultValue: row.status })}`}
            {row.lockReason && ` · ${t('lockReason')}: ${row.lockReason}`}
            {row.lockedAt && ` · ${t('lockedAt')}: ${formatAt(row.lockedAt, 'DD.MM.YYYY HH:mm')}`}
          </Box>
        )}
        <Box sx={{ mt: 1, fontSize: 12 }}>
          <Box sx={{ color: bbColors.gray600 }}>
            {t('viewing')}: <PageLink siteId={row.siteId} path={row.currentPage} />
            {` · ${t('cameFrom')}: ${detail.referrer || t('direct')}`}
          </Box>
          <NavigationHistory detail={detail} />
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 120, pr: 0.5 }}>
        {detail.messages.map(m => (
          <MessageBubble key={m.id} message={m} siteId={row.siteId} visitor={displayName(row)} />
        ))}
        <div ref={bottom} />
      </Box>

      <Box sx={{ display: 'flex', gap: 1, pt: 1, borderTop: `1px solid ${bbColors.gray100}` }}>
        <TextField
          fullWidth
          multiline
          maxRows={6}
          size="small"
          placeholder={t('replyPlaceholder')}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={onKey}
          inputProps={{ maxLength: 1000 }}
        />
        <Button variant="contained" disabled={busy || !draft.trim()} onClick={send}>
          {t('send')}
        </Button>
      </Box>
    </Box>
  );
};

export default ConversationPane;
