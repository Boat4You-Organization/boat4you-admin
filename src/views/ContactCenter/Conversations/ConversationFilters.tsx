/* Filters of the conversation list (ADMIN-2…4): every filter off = all non-deleted conversations by last activity. */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, FormControlLabel, MenuItem, Switch, TextField } from '@mui/material';
import dayjs from 'dayjs';

import { CHAT_STATUSES, CONTACT_STATUSES, ConversationFilter } from '@/types/contactCenter.type';
import { SITE_IDS, siteLabel } from '@/utils/contactCenter/safeLink';

const SEARCH_DEBOUNCE_MS = 400;

const small = { size: 'small' as const, sx: { minWidth: 130, flex: '1 1 130px' } };

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
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
      <TextField
        size="small"
        fullWidth
        placeholder={t('searchPlaceholder')}
        value={q}
        onChange={e => setQ(e.target.value)}
        inputProps={{ maxLength: 100 }}
      />
      <TextField
        select
        label={t('filter.site')}
        value={value.siteId ?? ''}
        onChange={e => set({ siteId: e.target.value || undefined })}
        {...small}
      >
        <MenuItem value="">{t('filter.all')}</MenuItem>
        {SITE_IDS.map(id => (
          <MenuItem key={id} value={id}>
            {siteLabel(id)}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        label={t('filter.status')}
        value={value.status ?? ''}
        onChange={e => set({ status: e.target.value || undefined })}
        {...small}
      >
        <MenuItem value="">{t('filter.all')}</MenuItem>
        {CHAT_STATUSES.map(s => (
          <MenuItem key={s} value={s}>
            {t(`status.${s}`)}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        label={t('filter.contactStatus')}
        value={value.contactStatus ?? ''}
        onChange={e => set({ contactStatus: e.target.value || undefined })}
        {...small}
      >
        <MenuItem value="">{t('filter.all')}</MenuItem>
        {CONTACT_STATUSES.map(s => (
          <MenuItem key={s} value={s}>
            {t(`contactStatus.${s}`)}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label={t('filter.tag')}
        value={tag}
        onChange={e => setTag(e.target.value)}
        inputProps={{ maxLength: 40 }}
        {...small}
      />
      <TextField
        type="date"
        label={t('filter.from')}
        InputLabelProps={{ shrink: true }}
        value={fromDay}
        onChange={e => {
          setFromDay(e.target.value);
          set({ from: e.target.value ? dayjs(e.target.value).startOf('day').toISOString() : undefined });
        }}
        {...small}
      />
      <TextField
        type="date"
        label={t('filter.to')}
        InputLabelProps={{ shrink: true }}
        value={toDay}
        onChange={e => {
          setToDay(e.target.value);
          set({ to: e.target.value ? dayjs(e.target.value).add(1, 'day').startOf('day').toISOString() : undefined });
        }}
        {...small}
      />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 1 }}>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={!!value.needsHuman}
              onChange={e => set({ needsHuman: e.target.checked || undefined })}
            />
          }
          label={t('filter.needsHuman')}
          slotProps={{ typography: { fontSize: 13 } }}
        />
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={!!value.flaggedOnly}
              onChange={e => set({ flaggedOnly: e.target.checked || undefined })}
            />
          }
          label={t('filter.flaggedOnly')}
          slotProps={{ typography: { fontSize: 13 } }}
        />
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={value.includeSpam !== false}
              onChange={e => set({ includeSpam: e.target.checked ? undefined : false })}
            />
          }
          label={t('filter.includeSpam')}
          slotProps={{ typography: { fontSize: 13 } }}
        />
      </Box>
    </Box>
  );
};

export default ConversationFilters;
