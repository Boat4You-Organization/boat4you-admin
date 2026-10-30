/* Left column: all conversations (default, ADMIN-2) or who is on the sites now; bulk delete only over conversations
 * that may be deleted, never a suspicious one (ADMIN-5, ADMIN-6). */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Button, Checkbox, Chip, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';

import { bulkDeleteChats } from '@/services/chat.service';
import { bbColors } from '@/styles/bb';
import { ConversationFilter, ConversationRow, LiveRow } from '@/types/contactCenter.type';
import { displayName, isLiveNow } from '@/utils/contactCenter/display';
import { siteLabel } from '@/utils/contactCenter/safeLink';
import { showToast } from '@/valtio/global/global.actions';
import { ChatStatusChip, SiteChip, countryText, formatAt, isSuspicious } from '@/views/ContactCenter/common';

import ConversationFilters from './ConversationFilters';

export type ListMode = 'all' | 'live';

interface Props {
  mode: ListMode;
  onMode(m: ListMode): void;
  rows: ConversationRow[];
  live: LiveRow[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore(): void;
  selectedId: number | null;
  onSelect(id: number): void;
  filter: ConversationFilter;
  onFilter(f: ConversationFilter): void;
  onDeleted(): void;
}

const Dot = ({ color, title }: { color: string; title: string }) => (
  <Box
    component="span"
    title={title}
    sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }}
  />
);

const ConversationList = ({
  mode,
  onMode,
  rows,
  live,
  loading,
  hasMore,
  onLoadMore,
  selectedId,
  onSelect,
  filter,
  onFilter,
  onDeleted,
}: Props) => {
  const { t } = useTranslation('contactCenter');
  const [checked, setChecked] = useState<number[]>([]);
  const deletable = rows.filter(r => !isSuspicious(r));
  const checkedDeletable = checked.filter(id => deletable.some(r => r.id === id));

  const deleteChecked = async () => {
    if (!checkedDeletable.length || !window.confirm(t('confirmDeleteMany', { count: checkedDeletable.length }))) return;

    try {
      await bulkDeleteChats(checkedDeletable);
      setChecked([]);
      onDeleted();
    } catch {
      showToast({ status: 'error', text: t('deleteFailed') });
    }
  };

  const emptyText = filter.flaggedOnly ? t('emptyFlagged') : t('empty');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
      <ToggleButtonGroup size="small" exclusive value={mode} onChange={(_, v) => v && onMode(v)} sx={{ mb: 1 }}>
        <ToggleButton value="all">{t('mode.all')}</ToggleButton>
        <ToggleButton value="live">{t('mode.live')}</ToggleButton>
      </ToggleButtonGroup>

      {mode === 'all' ? (
        <>
          <ConversationFilters value={filter} onChange={onFilter} />
          {deletable.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Checkbox
                size="small"
                checked={checkedDeletable.length > 0 && checkedDeletable.length === deletable.length}
                indeterminate={checkedDeletable.length > 0 && checkedDeletable.length < deletable.length}
                onChange={e => setChecked(e.target.checked ? deletable.map(r => r.id) : [])}
              />
              <Typography sx={{ fontSize: 12, color: bbColors.gray500 }}>{t('selectAll')}</Typography>
              {checkedDeletable.length > 0 && (
                <Button size="small" color="error" onClick={deleteChecked} sx={{ ml: 'auto' }}>
                  {t('deleteSelected', { count: checkedDeletable.length })}
                </Button>
              )}
            </Box>
          )}
          <Box sx={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
            {!loading && !rows.length && (
              <Typography sx={{ fontSize: 13, color: bbColors.gray500, p: 2 }}>{emptyText}</Typography>
            )}
            {rows.map(r => {
              const suspicious = isSuspicious(r);
              const onSite = isLiveNow(r.lastSeenAt);

              return (
                <Box
                  key={r.id}
                  onClick={() => onSelect(r.id)}
                  sx={{
                    display: 'flex',
                    gap: 0.5,
                    p: 1,
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    mb: 0.5,
                    border: `1px solid ${r.id === selectedId ? bbColors.navy700 : bbColors.gray100}`,
                    bgcolor: r.adminUnread ? '#fffbea' : '#fff',
                  }}
                >
                  {!suspicious ? (
                    <Checkbox
                      size="small"
                      checked={checked.includes(r.id)}
                      onClick={e => e.stopPropagation()}
                      onChange={e => setChecked(c => (e.target.checked ? [...c, r.id] : c.filter(x => x !== r.id)))}
                      sx={{ p: 0.25, alignSelf: 'flex-start' }}
                    />
                  ) : (
                    <Box sx={{ width: 26, flexShrink: 0 }} />
                  )}
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      {r.adminUnread && <Dot color={bbColors.red600} title={t('unread')} />}
                      {onSite && <Dot color={bbColors.green600} title={t('live')} />}
                      <Typography
                        noWrap
                        sx={{ fontSize: 14, fontWeight: r.adminUnread ? 800 : 600, color: bbColors.navy900 }}
                      >
                        {displayName(r)}
                      </Typography>
                      {r.visitorName && r.visitorEmail && (
                        <Typography noWrap sx={{ fontSize: 12, color: bbColors.gray500 }}>
                          {r.visitorEmail}
                        </Typography>
                      )}
                      <Typography sx={{ fontSize: 11, color: bbColors.gray500, ml: 'auto', flexShrink: 0 }}>
                        {formatAt(r.lastActivityAt)}
                      </Typography>
                    </Box>
                    <Typography noWrap sx={{ fontSize: 13, color: bbColors.gray600 }}>
                      {r.lastMessage ?? '—'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center', mt: 0.5 }}>
                      <ChatStatusChip status={r.status} />
                      <SiteChip siteId={r.siteId} />
                      <Typography sx={{ fontSize: 11, color: bbColors.gray500 }}>
                        {r.locale} · {countryText(r.countryCode)}
                        {!onSite && r.lastSeenAt && ` · ${t('lastSeen')} ${formatAt(r.lastSeenAt)}`}
                      </Typography>
                      {suspicious && (
                        <Chip
                          size="small"
                          label={`⚠ ${t('suspicious')}${r.lockReason ? `: ${r.lockReason}` : ''}`}
                          sx={{
                            height: 20,
                            fontSize: 11,
                            bgcolor: bbColors.red100,
                            color: bbColors.red600,
                            maxWidth: '100%',
                          }}
                        />
                      )}
                      {r.tags.map(tag => (
                        <Chip key={tag} size="small" label={tag} sx={{ height: 20, fontSize: 11 }} />
                      ))}
                    </Box>
                  </Box>
                </Box>
              );
            })}
            {hasMore && (
              <Button fullWidth size="small" onClick={onLoadMore}>
                {t('loadMore')}
              </Button>
            )}
          </Box>
        </>
      ) : (
        <Box sx={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
          {!live.length && (
            <Typography sx={{ fontSize: 13, color: bbColors.gray500, p: 2 }}>{t('liveEmpty')}</Typography>
          )}
          {live.map(l => (
            <Box
              key={l.visitor.visitKey}
              onClick={() => l.chatSessionId && onSelect(l.chatSessionId)}
              sx={{
                p: 1,
                mb: 0.5,
                borderRadius: 1.5,
                border: `1px solid ${l.chatSessionId === selectedId ? bbColors.navy700 : bbColors.gray100}`,
                cursor: l.chatSessionId ? 'pointer' : 'default',
                fontSize: 13,
              }}
            >
              <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
                <Dot color={bbColors.green600} title={t('live')} />
                <Box sx={{ fontWeight: 700 }}>{l.contactName ?? t('anonymousVisitor')}</Box>
                <Box sx={{ ml: 'auto', color: bbColors.gray500, fontSize: 11 }}>{siteLabel(l.visitor.siteId)}</Box>
              </Box>
              <Box sx={{ color: bbColors.gray600, fontSize: 12 }}>
                {l.visitor.currentTitle ?? l.visitor.currentPath ?? '—'} ·{' '}
                {l.chatStatus ? t(`status.${l.chatStatus}`, { defaultValue: l.chatStatus }) : t('chatNotOpened')}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ConversationList;
