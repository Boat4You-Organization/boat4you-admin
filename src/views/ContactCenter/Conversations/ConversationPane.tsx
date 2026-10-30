/* Middle column: the open conversation (design 2.3). A reply takes the conversation over and the AI stays out
 * (ADMIN-8, ADMIN-14); "Preuzmi" does that without a message; "Vrati AI-ju" never for a suspicious one (ADMIN-9); a
 * suspicious conversation is evidence and cannot be deleted (ADMIN-5). On a phone the list and the client card are one
 * tap away and the less used actions sit in the "more" menu. */
import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, IconButton, InputBase, Menu, MenuItem } from '@mui/material';

import { closeChat, deleteChat, replyToChat } from '@/services/chat.service';
import ContactCenterService from '@/services/contactCenter.service';
import { ConversationDetail } from '@/types/contactCenter.type';
import { displayName, isLiveNow } from '@/utils/contactCenter/display';
import { showToast } from '@/valtio/global/global.actions';
import { ChatStatusChip, SiteChip, countryText, formatAt, isSuspicious } from '@/views/ContactCenter/common';
import { CcButton, Dot, MoreIcon, Pill, cc, scrollSx } from '@/views/ContactCenter/ui';

import MessageBubble from './MessageBubble';
import NavigationHistory from './NavigationHistory';

interface Props {
  detail: ConversationDetail;
  onChanged(): void;
  onDeleted(): void;
  onBack(): void;
  onOpenCard(): void;
}

const TAKE_OVER_FROM = ['AI', 'HUMAN_REQUESTED', 'CLOSED'];
const MAX_REPLY = 1000;

const ConversationPane = ({ detail, onChanged, onDeleted, onBack, onOpenCard }: Props) => {
  const { t } = useTranslation('contactCenter');
  const { row } = detail;
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  const [menu, setMenu] = useState<HTMLElement | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const suspicious = isSuspicious(row);
  const live = isLiveNow(row.lastSeenAt);
  const lastId = detail.messages[detail.messages.length - 1]?.id;
  const canTakeOver = TAKE_OVER_FROM.includes(row.status);
  const canReturn = row.status === 'HUMAN' && !suspicious;
  const canClose = row.status !== 'CLOSED';

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' });
  }, [lastId, row.id]);

  useEffect(() => {
    setDraft('');
    setSendFailed(false);
  }, [row.id]);

  const run = async (action: () => Promise<unknown>) => {
    if (busy) return;

    setBusy(true);
    try {
      await action();
      onChanged();
    } catch {
      showToast({ status: 'error', text: t('actionFailed') });
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    const content = draft.trim();

    if (!content || busy) return;

    setBusy(true);
    try {
      await replyToChat(row.id, content);
      setDraft('');
      setSendFailed(false);
      onChanged();
    } catch {
      setSendFailed(true); // the text stays in the field
    } finally {
      setBusy(false);
    }
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send().catch(() => undefined);
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

  const takeOver = () => run(() => ContactCenterService.takeOver(row.id));
  const returnToAi = () => run(() => ContactCenterService.returnToAi(row.id));
  const close = () => run(() => closeChat(row.id));
  const menuAction = (action: () => unknown) => () => {
    setMenu(null);
    action();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Box
        sx={{
          p: { xs: '6px 12px 10px', md: '14px 18px 12px' },
          borderBottom: `1px solid ${cc.hair}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: '4px', mx: '-4px' }}>
          <CcButton kind="txt" onClick={onBack} sx={{ minHeight: 44, px: 1, fontSize: 13.5 }}>
            ← {t('backToList')}
          </CcButton>
          <CcButton kind="out" onClick={onOpenCard} sx={{ ml: 'auto', minHeight: 44 }}>
            {t('clientCard')}
          </CcButton>
          {(canReturn || !suspicious) && (
            <IconButton
              aria-label={t('moreActions')}
              onClick={e => setMenu(e.currentTarget)}
              sx={{ width: 44, height: 44, color: cc.ink }}
            >
              <MoreIcon />
            </IconButton>
          )}
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
          <Box
            component="h2"
            sx={{
              m: 0,
              fontSize: 18,
              fontWeight: 700,
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: cc.ink,
            }}
          >
            {displayName(row)}
          </Box>
          <ChatStatusChip status={row.status} />
          <SiteChip siteId={row.siteId} />
          {live && (
            <Pill colors={[cc.greenBg, cc.greenInk]}>
              <Dot color={cc.green} size={6} />
              {t('live')}
            </Pill>
          )}
          {!live && row.lastSeenAt && (
            <Box component="span" sx={{ fontSize: 12, color: cc.muted }}>
              {`${t('lastSeen')} ${formatAt(row.lastSeenAt)}`}
            </Box>
          )}
          <Box sx={{ ml: 'auto', display: { xs: 'none', md: 'flex' }, flexWrap: 'wrap', gap: '4px' }}>
            <CcButton kind="out" onClick={onOpenCard} sx={{ display: { md: 'inline-flex', xl: 'none' } }}>
              {t('clientCard')}
            </CcButton>
            {canTakeOver && (
              <CcButton kind="fill" disabled={busy} onClick={takeOver} title={t('takeOverHint')}>
                {t('takeOver')}
              </CcButton>
            )}
            {canReturn && (
              <CcButton kind="out" disabled={busy} onClick={returnToAi}>
                {t('returnToAi')}
              </CcButton>
            )}
            {canClose && (
              <CcButton kind="txt" disabled={busy} onClick={close}>
                {t('close')}
              </CcButton>
            )}
            {!suspicious && (
              <CcButton kind="red" disabled={busy} onClick={remove}>
                {t('delete')}
              </CcButton>
            )}
          </Box>
        </Box>

        <Box
          sx={{
            fontSize: 12.5,
            color: cc.muted,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: { xs: 'nowrap', md: 'normal' },
          }}
        >
          {[
            row.visitorEmail,
            row.phone,
            countryText(row.countryCode, row.country),
            row.locale,
            row.ip && `IP ${row.ip}`,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Box>

        {(canTakeOver || canClose) && (
          <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: '6px' }}>
            {canTakeOver && (
              <CcButton kind="fill" disabled={busy} onClick={takeOver} sx={{ flex: 1 }}>
                {t('takeOver')}
              </CcButton>
            )}
            {canClose && (
              <CcButton kind="out" disabled={busy} onClick={close} sx={{ flex: 1 }}>
                {t('close')}
              </CcButton>
            )}
          </Box>
        )}
      </Box>

      <Menu anchorEl={menu} open={!!menu} onClose={() => setMenu(null)}>
        {canReturn && <MenuItem onClick={menuAction(returnToAi)}>{t('returnToAi')}</MenuItem>}
        {!suspicious && (
          <MenuItem onClick={menuAction(remove)} sx={{ color: cc.red }}>
            {t('delete')}
          </MenuItem>
        )}
      </Menu>

      {suspicious && (
        <Box
          role="alert"
          sx={{
            p: '10px 18px',
            bgcolor: cc.redBg,
            color: cc.redInk,
            fontSize: 12.5,
            lineHeight: 1.5,
            borderBottom: `1px solid ${cc.redLine}`,
          }}
        >
          <Box component="strong" sx={{ fontWeight: 700 }}>
            {`⚠ ${t('suspiciousBannerTitle')}`}
          </Box>{' '}
          {t('suspiciousBannerText')}
          {` · ${t('statusLabel')}: ${t(`status.${row.status}`, { defaultValue: row.status })}`}
          {row.lockReason && ` · ${t('lockReason')}: ${row.lockReason}`}
          {row.lockedAt && ` · ${t('lockedAt')}: ${formatAt(row.lockedAt, 'DD.MM.YYYY HH:mm')}`}
        </Box>
      )}

      <Box sx={{ ...scrollSx, flex: 1, minHeight: 120, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ m: { xs: '8px 12px 0', md: '12px 18px 0' } }}>
          <NavigationHistory detail={detail} />
        </Box>
        <Box
          sx={{ flex: 1, p: { xs: '12px', md: '16px 18px' }, display: 'flex', flexDirection: 'column', gap: '14px' }}
        >
          {detail.messages.map(m => (
            <MessageBubble key={m.id} message={m} siteId={row.siteId} visitor={displayName(row)} />
          ))}
          <div ref={bottom} />
        </Box>
      </Box>

      <Box sx={{ p: { xs: '8px 12px 14px', md: '10px 18px 14px' }, borderTop: `1px solid ${cc.border}` }}>
        {(row.status === 'AI' || row.status === 'HUMAN_REQUESTED') && (
          <Box sx={{ fontSize: 12, color: cc.muted, mb: '6px' }}>{t('composerHint')}</Box>
        )}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              border: `1px solid ${sendFailed ? cc.red : cc.field}`,
              borderRadius: '10px',
              '&:focus-within': { borderColor: sendFailed ? cc.red : cc.ink },
            }}
          >
            <InputBase
              multiline
              minRows={2}
              maxRows={6}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={onKey}
              placeholder={t('replyPlaceholder')}
              inputProps={{ maxLength: MAX_REPLY, 'aria-label': t('replyLabel') }}
              sx={{ p: '10px 12px 2px', fontSize: { xs: 16, md: 14 }, lineHeight: 1.5, color: cc.ink }}
            />
            <Box component="span" sx={{ alignSelf: 'flex-end', p: '0 10px 6px', fontSize: 11, color: cc.muted }}>
              {draft.length} / {MAX_REPLY}
            </Box>
          </Box>
          <CcButton
            kind="primary"
            disabled={busy || !draft.trim()}
            onClick={() => send().catch(() => undefined)}
            sx={{ minHeight: 44, px: '18px' }}
          >
            {t('send')}
          </CcButton>
        </Box>
      </Box>

      {sendFailed && (
        <Box
          role="alert"
          sx={{
            position: 'absolute',
            left: '50%',
            bottom: 96,
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            p: '10px 14px',
            borderRadius: '8px',
            bgcolor: cc.red,
            color: '#FFFFFF',
            fontSize: 13,
            boxShadow: cc.shadow,
            maxWidth: 'calc(100% - 24px)',
          }}
        >
          {t('sendFailed')}
          <Box
            component="button"
            type="button"
            onClick={() => setSendFailed(false)}
            sx={{
              border: 0,
              bgcolor: 'transparent',
              color: '#FFFFFF',
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: 28,
              fontFamily: 'inherit',
              fontSize: 13,
            }}
          >
            {t('closePanel')}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ConversationPane;
