/* Filters of the conversation list (ADMIN-2…4): every filter off = all non-deleted conversations by last activity.
 * Search and the two quick chips stay in view; the rest folds into "Filteri · N". */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box } from '@mui/material';
import dayjs from 'dayjs';

import { CHAT_STATUSES, CONTACT_STATUSES, ConversationFilter } from '@/types/contactCenter.type';
import { SITE_IDS, siteLabel } from '@/utils/contactCenter/safeLink';
import { CcButton, FilterIcon, Labeled, SearchField, cc, fieldSx } from '@/views/ContactCenter/ui';

const SEARCH_DEBOUNCE_MS = 400;

/** How many of the folded filters are on (the number on the "Filteri" button). */
export const foldedCount = (f: ConversationFilter) =>
  [f.siteId, f.status, f.contactStatus, f.tag, f.from, f.to].filter(Boolean).length + (f.includeSpam === false ? 1 : 0);

const ToggleChip = ({
  on,
  danger,
  onClick,
  children,
}: {
  on: boolean;
  danger?: boolean;
  onClick(): void;
  children: React.ReactNode;
}) => {
  let colors: { borderColor: string; bgcolor: string; color: string } = {
    borderColor: cc.field,
    bgcolor: '#FFFFFF',
    color: cc.text,
  };

  if (on) {
    colors = danger
      ? { borderColor: cc.red, bgcolor: cc.redBg, color: cc.red }
      : { borderColor: cc.ink, bgcolor: cc.ink, color: '#FFFFFF' };
  }

  return (
    <Box
      component="button"
      type="button"
      aria-pressed={on}
      onClick={onClick}
      sx={{
        minHeight: 30,
        px: '10px',
        borderRadius: '999px',
        fontSize: 12.5,
        fontWeight: 500,
        fontFamily: 'inherit',
        cursor: 'pointer',
        border: '1px solid',
        ...colors,
      }}
    >
      {children}
    </Box>
  );
};

const ConversationFilters = ({
  value,
  onChange,
}: {
  value: ConversationFilter;
  onChange(f: ConversationFilter): void;
}) => {
  const { t } = useTranslation('contactCenter');
  const [q, setQ] = useState(value.q ?? '');
  const [tag, setTag] = useState(value.tag ?? '');
  const [fromDay, setFromDay] = useState('');
  const [toDay, setToDay] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      if ((value.q ?? '') !== q.trim()) onChange({ ...value, q: q.trim() || undefined });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(id);
  }, [q, value, onChange]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const clean = tag.trim().toLowerCase();

      if ((value.tag ?? '') !== clean) onChange({ ...value, tag: clean || undefined });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(id);
  }, [tag, value, onChange]);

  const set = (patch: Partial<ConversationFilter>) => onChange({ ...value, ...patch });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <SearchField value={q} onChange={setQ} placeholder={t('searchPlaceholder')} label={t('search')} />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        <CcButton
          kind="out"
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
          startIcon={<FilterIcon />}
          sx={{
            minHeight: 30,
            px: '10px',
            fontSize: 12.5,
            borderRadius: '999px',
            '& .MuiButton-startIcon': { mr: '6px', ml: 0 },
          }}
        >
          {t('filters', { count: foldedCount(value) })}
        </CcButton>
        <ToggleChip on={!!value.needsHuman} onClick={() => set({ needsHuman: value.needsHuman ? undefined : true })}>
          {t('filter.needsHuman')}
        </ToggleChip>
        <ToggleChip
          danger
          on={!!value.flaggedOnly}
          onClick={() => set({ flaggedOnly: value.flaggedOnly ? undefined : true })}
        >
          ⚠ {t('filter.flaggedOnly')}
        </ToggleChip>
      </Box>
      {open && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 1,
            p: '10px',
            bgcolor: cc.soft,
            borderRadius: '10px',
          }}
        >
          <Labeled label={t('filter.site')}>
            <Box
              component="select"
              value={value.siteId ?? ''}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => set({ siteId: e.target.value || undefined })}
              sx={fieldSx}
            >
              <option value="">{t('filter.all')}</option>
              {SITE_IDS.map(id => (
                <option key={id} value={id}>
                  {siteLabel(id)}
                </option>
              ))}
            </Box>
          </Labeled>
          <Labeled label={t('filter.status')}>
            <Box
              component="select"
              value={value.status ?? ''}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => set({ status: e.target.value || undefined })}
              sx={fieldSx}
            >
              <option value="">{t('filter.all')}</option>
              {CHAT_STATUSES.map(s => (
                <option key={s} value={s}>
                  {t(`status.${s}`)}
                </option>
              ))}
            </Box>
          </Labeled>
          <Labeled label={t('filter.contactStatus')}>
            <Box
              component="select"
              value={value.contactStatus ?? ''}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                set({ contactStatus: e.target.value || undefined })
              }
              sx={fieldSx}
            >
              <option value="">{t('filter.all')}</option>
              {CONTACT_STATUSES.map(s => (
                <option key={s} value={s}>
                  {t(`contactStatus.${s}`)}
                </option>
              ))}
            </Box>
          </Labeled>
          <Labeled label={t('filter.tag')}>
            <Box
              component="input"
              value={tag}
              placeholder={t('tagPlaceholder')}
              maxLength={40}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTag(e.target.value)}
              sx={fieldSx}
            />
          </Labeled>
          <Labeled label={t('filter.from')}>
            <Box
              component="input"
              type="date"
              value={fromDay}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setFromDay(e.target.value);
                set({ from: e.target.value ? dayjs(e.target.value).startOf('day').toISOString() : undefined });
              }}
              sx={fieldSx}
            />
          </Labeled>
          <Labeled label={t('filter.to')}>
            <Box
              component="input"
              type="date"
              value={toDay}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setToDay(e.target.value);
                set({
                  to: e.target.value ? dayjs(e.target.value).add(1, 'day').startOf('day').toISOString() : undefined,
                });
              }}
              sx={fieldSx}
            />
          </Labeled>
          <Box
            component="label"
            sx={{
              gridColumn: '1 / -1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: 36,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <span>{t('filter.includeSpam')}</span>
            <Box
              component="input"
              type="checkbox"
              checked={value.includeSpam !== false}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                set({ includeSpam: e.target.checked ? undefined : false })
              }
              sx={{ width: 18, height: 18, accentColor: cc.ink, m: 0 }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ConversationFilters;
