/* Postavke: the calls.* rows of the settings table, in effect without a restart. Only changed values are sent; the
 * transfer number arrives masked and is written only when a new one is typed. */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box } from '@mui/material';

import CallCenterService from '@/services/callCenter.service';
import { CallSettings } from '@/types/callCenter.type';
import { CcButton, Labeled, LoadAlert, SectionLabel, Sk, cc, fieldSx, panelSx } from '@/views/ContactCenter/ui';

type FieldKind = 'bool' | 'time' | 'number' | 'text';

const GROUPS: { id: 'general' | 'window' | 'transfer' | 'limits'; fields: { key: string; kind: FieldKind }[] }[] = [
  {
    id: 'general',
    fields: [
      { key: 'calls.enabled', kind: 'bool' },
      { key: 'calls.test.numbers', kind: 'text' },
    ],
  },
  {
    id: 'window',
    fields: [
      { key: 'calls.window.start', kind: 'time' },
      { key: 'calls.window.end', kind: 'time' },
      { key: 'calls.first.delayMinutes', kind: 'number' },
      { key: 'calls.followup.delayHours', kind: 'number' },
      { key: 'calls.attempts.max', kind: 'number' },
    ],
  },
  {
    id: 'transfer',
    fields: [
      { key: 'calls.transfer.available', kind: 'bool' },
      { key: 'calls.transfer.days', kind: 'text' },
      { key: 'calls.transfer.start', kind: 'time' },
      { key: 'calls.transfer.end', kind: 'time' },
    ],
  },
  {
    id: 'limits',
    fields: [
      { key: 'calls.limit.daily', kind: 'number' },
      { key: 'calls.limit.monthly', kind: 'number' },
      { key: 'calls.audio.retentionDays', kind: 'number' },
    ],
  },
];

const TRANSFER_NUMBER = 'calls.transfer.number';

/** i18n keys cannot carry dots: "calls.window.start" → "calls_window_start". */
const labelKey = (key: string) => key.replace(/\./g, '_');

const Settings = () => {
  const { t } = useTranslation('callCenter');
  const [saved, setSaved] = useState<CallSettings | null>(null);
  const [draft, setDraft] = useState<CallSettings>({});
  const [newNumber, setNewNumber] = useState('');
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const load = () =>
    CallCenterService.settings()
      .then(({ data }) => {
        setSaved(data);
        setDraft(data);
        setFailed(false);
      })
      .catch(() => setFailed(true));

  useEffect(() => {
    load();
  }, []);

  if (!saved) return failed ? <LoadAlert text={t('loadFailed')} /> : <Sk h={320} w="100%" r={14} />;

  const changed: CallSettings = Object.fromEntries(
    Object.entries(draft).filter(([key, v]) => key !== TRANSFER_NUMBER && v !== saved[key])
  );

  if (newNumber.trim()) changed[TRANSFER_NUMBER] = newNumber.trim();

  const dirty = Object.keys(changed).length > 0;
  const turningOn = changed['calls.enabled'] === 'true';

  const save = () => {
    if (turningOn && !window.confirm(t('settings.enableConfirm'))) return;

    setBusy(true);
    setNotice(null);
    CallCenterService.updateSettings(changed)
      .then(() => {
        setNewNumber('');
        setNotice({ ok: true, text: t('settings.saved') });

        return load();
      })
      .catch((error: unknown) =>
        setNotice({ ok: false, text: (error as { message?: string } | undefined)?.message ?? t('action.failed') })
      )
      .finally(() => setBusy(false));
  };

  const set = (key: string, v: string) => setDraft(d => ({ ...d, [key]: v }));

  const input = (key: string, kind: FieldKind) => {
    const v = draft[key] ?? '';

    if (kind === 'bool') {
      return (
        <Box
          component="select"
          value={v}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => set(key, e.target.value)}
          sx={fieldSx}
        >
          <option value="true">{t('settings.on')}</option>
          <option value="false">{t('settings.off')}</option>
        </Box>
      );
    }

    return (
      <Box
        component="input"
        type={kind === 'text' ? 'text' : kind}
        inputMode={kind === 'number' ? 'numeric' : undefined}
        value={v}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => set(key, e.target.value)}
        sx={fieldSx}
      />
    );
  };

  return (
    <Box component="section" sx={{ ...panelSx, p: '18px', maxWidth: 980 }}>
      {failed && <LoadAlert text={t('loadFailed')} />}
      {GROUPS.map(group => (
        <Box key={group.id} sx={{ mb: '22px' }}>
          <SectionLabel sx={{ mb: '10px' }}>{t(`settings.group.${group.id}`)}</SectionLabel>
          <Box
            sx={{ display: 'grid', gap: '14px', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' } }}
          >
            {group.fields.map(({ key, kind }) => (
              <Labeled
                key={key}
                label={t(`settings.field.${labelKey(key)}`, { defaultValue: key })}
                hint={t(`settings.hint.${labelKey(key)}`, { defaultValue: '' }) || undefined}
              >
                {input(key, kind)}
              </Labeled>
            ))}
            {group.id === 'transfer' && (
              <Labeled
                label={t('settings.field.calls_transfer_number')}
                hint={t('settings.transferCurrent', { number: saved[TRANSFER_NUMBER] || '—' })}
              >
                <Box
                  component="input"
                  type="tel"
                  autoComplete="off"
                  placeholder={t('settings.transferNew')}
                  value={newNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewNumber(e.target.value)}
                  sx={fieldSx}
                />
              </Labeled>
            )}
          </Box>
        </Box>
      ))}
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <CcButton kind="primary" disabled={!dirty || busy} onClick={save}>
          {t('settings.save')}
        </CcButton>
        <CcButton
          kind="txt"
          disabled={!dirty || busy}
          onClick={() => {
            setDraft(saved);
            setNewNumber('');
          }}
        >
          {t('settings.reset')}
        </CcButton>
        {notice && (
          <Box role="status" sx={{ fontSize: 13, fontWeight: 500, color: notice.ok ? cc.greenInk : cc.red }}>
            {notice.text}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Settings;
