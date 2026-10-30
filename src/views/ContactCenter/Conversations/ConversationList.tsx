/* Left column: all conversations (default, ADMIN-2) or who is on the sites now; bulk delete only over conversations
 * that may be deleted, never a suspicious one (ADMIN-5, ADMIN-6). */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box } from '@mui/material';

import { bulkDeleteChats } from '@/services/chat.service';
import { ConversationFilter, ConversationRow, LiveRow } from '@/types/contactCenter.type';
import { displayName, isLiveNow } from '@/utils/contactCenter/display';
import { showToast } from '@/valtio/global/global.actions';
import { ChatStatusChip, SiteChip, countryText, formatAt, isSuspicious } from '@/views/ContactCenter/common';
import { CcButton, Dot, LoadAlert, Pill, Segmented, Sk, TagPill, cc, scrollSx } from '@/views/ContactCenter/ui';

import ConversationFilters from './ConversationFilters';

export type ListMode = 'all' | 'live';

interface Props {
  mode: ListMode;
  onMode(m: ListMode): void;
  rows: ConversationRow[];
  live: LiveRow[];
  loading: boolean;
  failed: boolean;
  hasMore: boolean;
  onLoadMore(): void;
  selectedId: number | null;
  onSelect(id: number): void;
  filter: ConversationFilter;
  onFilter(f: ConversationFilter): void;
  onDeleted(): void;
}

const checkboxSx = { width: 16, height: 16, accentColor: cc.ink, m: 0, cursor: 'pointer' } as const;

const RowSkeleton = () => (
  <Box
    sx={{
      p: '12px',
      border: `1px solid ${cc.hair}`,
      borderRadius: '10px',
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
    }}
  >
    <Sk h={12} w="60%" />
    <Sk h={10} w="90%" />
    <Box sx={{ display: 'flex', gap: '6px' }}>
      <Sk h={18} w={64} r={999} />
      <Sk h={18} w={90} r={999} />
    </Box>
  </Box>
);

const ConversationList = ({
  mode,
  onMode,
  rows,
  live,
  loading,
  failed,
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
  const [filtersKey, setFiltersKey] = useState(0);
  const deletable = rows.filter(r => !isSuspicious(r));
  const checkedDeletable = checked.filter(id => deletable.some(r => r.id === id));
  const allChecked = checkedDeletable.length > 0 && checkedDeletable.length === deletable.length;

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

  const clearFilters = () => {
    setFiltersKey(k => k + 1); // a fresh filter panel: empty search, tag and dates
    onFilter({});
  };

  const filtered = Object.values(filter).some(v => v !== undefined);

  return (
    <>
      <Box
        sx={{ p: '12px', display: 'flex', flexDirection: 'column', gap: '10px', borderBottom: `1px solid ${cc.hair}` }}
      >
        <Segmented
          label={t('viewLabel')}
          value={mode}
          onChange={onMode}
          sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
          options={[
            { value: 'all', label: t('mode.all') },
            {
              value: 'live',
              label: (
                <>
                  <Dot color={cc.green} size={7} />
                  {t('mode.live')}
                  {mode === 'live' && ` · ${live.length}`}
                </>
              ),
            },
          ]}
        />
        {mode === 'all' && <ConversationFilters key={filtersKey} value={filter} onChange={onFilter} />}
      </Box>

      {mode === 'all' && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            minHeight: 44,
            px: '12px',
            borderBottom: `1px solid ${cc.hair}`,
          }}
        >
          {deletable.length > 0 && (
            <Box
              component="label"
              sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 12.5, color: cc.text2, cursor: 'pointer' }}
            >
              <Box
                component="input"
                type="checkbox"
                checked={allChecked}
                ref={(el: HTMLInputElement | null) => {
                  if (el) el.indeterminate = checkedDeletable.length > 0 && !allChecked;
                }}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setChecked(e.target.checked ? deletable.map(r => r.id) : [])
                }
                sx={checkboxSx}
              />
              {t('selectAll')}
            </Box>
          )}
          <Box component="span" sx={{ ml: 'auto', fontSize: 12, color: cc.muted }}>
            {t('conversationCount', { count: rows.length })}
          </Box>
          {checkedDeletable.length > 0 && (
            <CcButton kind="danger" onClick={deleteChecked} sx={{ minHeight: 30, px: '10px', fontSize: 12 }}>
              {t('deleteSelected', { count: checkedDeletable.length })}
            </CcButton>
          )}
        </Box>
      )}

      <Box sx={{ ...scrollSx, flex: 1, minHeight: 0, p: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {mode === 'all' && failed && <LoadAlert text={t('loadFailed')} />}
        {mode === 'all' && loading && [0, 1, 2, 3, 4].map(k => <RowSkeleton key={k} />)}
        {mode === 'all' && !loading && !rows.length && !failed && (
          <Box
            sx={{
              p: '40px 16px',
              textAlign: 'center',
              fontSize: 13,
              color: cc.muted,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            {filter.flaggedOnly ? t('emptyFlagged') : t('empty')}
            {filtered && <CcButton onClick={clearFilters}>{t('clearFilters')}</CcButton>}
          </Box>
        )}
        {mode === 'all' &&
          rows.map(r => {
            const suspicious = isSuspicious(r);
            const onSite = isLiveNow(r.lastSeenAt);
            const selected = r.id === selectedId;

            return (
              <Box
                key={r.id}
                onClick={() => onSelect(r.id)}
                sx={{
                  display: 'flex',
                  gap: '10px',
                  p: '10px 10px 10px 8px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  border: selected ? `2px solid ${cc.ink}` : `1px solid ${cc.hair}`,
                  bgcolor: r.adminUnread ? cc.unreadBg : '#FFFFFF',
                  '&:hover': { boxShadow: '0 1px 3px rgba(11,29,58,.1)' },
                }}
              >
                <Box sx={{ flex: 'none', width: 20, pt: '2px' }}>
                  {!suspicious && (
                    <Box
                      component="input"
                      type="checkbox"
                      aria-label={t('selectConversation')}
                      checked={checked.includes(r.id)}
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setChecked(c => (e.target.checked ? [...c, r.id] : c.filter(x => x !== r.id)))
                      }
                      sx={checkboxSx}
                    />
                  )}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {r.adminUnread && <Dot color={cc.redDot} label={t('unread')} />}
                    {onSite && <Dot color={cc.green} label={t('live')} />}
                    <Box
                      component="button"
                      type="button"
                      aria-current={selected ? 'true' : undefined}
                      sx={{
                        flex: '0 1 auto',
                        minWidth: 0,
                        p: 0,
                        border: 0,
                        bgcolor: 'transparent',
                        fontFamily: 'inherit',
                        textAlign: 'left',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: 14,
                        color: cc.ink,
                        fontWeight: r.adminUnread ? 700 : 500,
                      }}
                    >
                      {displayName(r)}
                    </Box>
                    <Box
                      component="span"
                      sx={{
                        flex: '1 1 0',
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: 12,
                        color: cc.muted,
                      }}
                    >
                      {r.visitorName && r.visitorEmail ? r.visitorEmail : ''}
                    </Box>
                    <Box component="span" sx={{ flex: 'none', fontSize: 11.5, color: cc.muted }}>
                      {formatAt(r.lastActivityAt)}
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: 13,
                      color: cc.text2,
                    }}
                  >
                    {r.lastMessage?.replace(/\n/g, ' ') || '—'}
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    <ChatStatusChip status={r.status} />
                    <SiteChip siteId={r.siteId} />
                    {r.tags.map(tag => (
                      <TagPill key={tag}>{tag}</TagPill>
                    ))}
                  </Box>
                  {suspicious && (
                    <Pill colors={[cc.redBg, cc.red]} sx={{ alignSelf: 'flex-start' }}>
                      {`⚠ ${t('suspicious')}${r.lockReason ? `: ${r.lockReason}` : ''}`}
                    </Pill>
                  )}
                  <Box sx={{ fontSize: 11.5, color: cc.muted }}>
                    {r.locale} · {countryText(r.countryCode)}
                    {!onSite && r.lastSeenAt && ` · ${t('lastSeen')} ${formatAt(r.lastSeenAt)}`}
                  </Box>
                </Box>
              </Box>
            );
          })}
        {mode === 'all' && hasMore && (
          <CcButton onClick={onLoadMore} sx={{ m: '6px 0 4px' }}>
            {t('loadMore')}
          </CcButton>
        )}

        {mode === 'live' && !live.length && (
          <Box sx={{ p: '40px 16px', textAlign: 'center', fontSize: 13, color: cc.muted }}>{t('liveEmpty')}</Box>
        )}
        {mode === 'live' &&
          live.map(l => (
            <Box
              key={l.visitor.visitKey}
              component="button"
              type="button"
              disabled={!l.chatSessionId}
              onClick={() => l.chatSessionId && onSelect(l.chatSessionId)}
              sx={{
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                p: '12px',
                border: l.chatSessionId === selectedId ? `2px solid ${cc.ink}` : `1px solid ${cc.border}`,
                borderRadius: '10px',
                bgcolor: '#FFFFFF',
                cursor: l.chatSessionId ? 'pointer' : 'default',
                color: cc.ink,
                fontFamily: 'inherit',
                '&:disabled': { color: cc.ink },
              }}
            >
              <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <Dot color={cc.green} />
                <Box component="span" sx={{ fontWeight: 600, fontSize: 14 }}>
                  {l.contactName ?? t('anonymousVisitor')}
                </Box>
                <Box component="span" sx={{ ml: 'auto' }}>
                  <SiteChip siteId={l.visitor.siteId} />
                </Box>
              </Box>
              <Box component="span" sx={{ fontSize: 13, color: cc.text }}>
                {l.visitor.currentTitle ?? l.visitor.currentPath ?? '—'}
              </Box>
              <Box component="span" sx={{ fontSize: 12, color: cc.muted }}>
                {l.visitor.currentTitle && l.visitor.currentPath ? `${l.visitor.currentPath} · ` : ''}
                {l.chatStatus ? t(`status.${l.chatStatus}`, { defaultValue: l.chatStatus }) : t('chatNotOpened')}
              </Box>
            </Box>
          ))}
      </Box>
    </>
  );
};

export default ConversationList;
