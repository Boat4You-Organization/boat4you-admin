/* Session recording switches (P6 R1.6): per site on or off and the recorded share of visits with analytics consent, of all and
 * of mobile ones; and the links that mark this browser as the team's on every site, so our own visits are never recorded. */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Switch } from '@mui/material';

import ContactCenterService from '@/services/contactCenter.service';
import { RecSiteSetting } from '@/types/contactCenter.type';
import { pctOk } from '@/utils/contactCenter/rec';
import { siteLabel, staffLinks } from '@/utils/contactCenter/safeLink';
import { CcButton, InfoIcon, LoadAlert, SectionLabel, cc, fieldSx, tableSx } from '@/views/ContactCenter/ui';

type RowState = 'saved' | 'failed' | 'invalid';

const sameValues = (a: RecSiteSetting, b: RecSiteSetting) =>
  a.enabled === b.enabled && a.samplePct === b.samplePct && a.mobilePct === b.mobilePct;

const Recording = () => {
  const { t } = useTranslation('contactCenter');
  const [saved, setSaved] = useState<Record<string, RecSiteSetting>>({});
  const [draft, setDraft] = useState<Record<string, RecSiteSetting>>({});
  const [state, setState] = useState<Record<string, RowState | undefined>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let current = true;

    ContactCenterService.recSettings()
      .then(({ data }) => {
        if (!current) return;

        const bySite = Object.fromEntries(data.map(r => [r.siteId, r]));

        setSaved(bySite);
        setDraft(bySite);
      })
      .catch(() => current && setFailed(true));

    return () => {
      current = false;
    };
  }, []);

  const edit = (siteId: string, patch: Partial<RecSiteSetting>) => {
    setDraft(d => ({ ...d, [siteId]: { ...d[siteId], ...patch } }));
    setState(s => ({ ...s, [siteId]: undefined }));
  };

  const save = async (siteId: string) => {
    const row = draft[siteId];

    if (!pctOk(row.samplePct) || !pctOk(row.mobilePct)) {
      setState(s => ({ ...s, [siteId]: 'invalid' }));

      return;
    }

    setBusy(siteId);
    try {
      const { data } = await ContactCenterService.saveRecSetting(row);

      setSaved(s => ({ ...s, [siteId]: data }));
      setDraft(d => ({ ...d, [siteId]: data }));
      setState(s => ({ ...s, [siteId]: 'saved' }));
    } catch {
      setState(s => ({ ...s, [siteId]: 'failed' }));
    } finally {
      setBusy(null);
    }
  };

  const stateText = (s: RowState | undefined) => {
    if (s === 'saved') return t('rec.saved');

    if (s === 'failed') return t('rec.saveFailed');

    if (s === 'invalid') return t('rec.invalid');

    return '';
  };

  const pctField = (siteId: string, key: 'samplePct' | 'mobilePct', label: string) => (
    <Box
      component="input"
      type="number"
      min={0}
      max={100}
      step={1}
      aria-label={`${siteLabel(siteId)} · ${label}`}
      value={Number.isFinite(draft[siteId][key]) ? draft[siteId][key] : ''}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        edit(siteId, { [key]: e.target.value === '' ? Number.NaN : Number(e.target.value) })
      }
      sx={{ ...fieldSx, width: 90 }}
    />
  );

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-start',
          p: '10px 14px',
          mb: '18px',
          borderRadius: '10px',
          bgcolor: cc.note,
          color: cc.text,
          fontSize: 13,
          lineHeight: 1.5,
        }}
      >
        <Box component="span" sx={{ mt: '2px', display: 'flex' }}>
          <InfoIcon />
        </Box>
        <span>{t('rec.note')}</span>
      </Box>
      {failed && (
        <Box sx={{ mb: 2 }}>
          <LoadAlert text={t('loadFailed')} />
        </Box>
      )}
      <Box
        sx={{
          overflowX: 'auto',
          mb: '28px',
          border: `1px solid ${cc.border}`,
          borderRadius: '12px',
          bgcolor: '#FFFFFF',
        }}
      >
        <Box component="table" sx={{ ...tableSx, minWidth: 640 }}>
          <thead>
            <tr>
              <th>{t('rec.site')}</th>
              <th>{t('rec.enabled')}</th>
              <th>{t('rec.sample')}</th>
              <th>{t('rec.mobile')}</th>
              <th aria-label={t('rec.save')} />
            </tr>
          </thead>
          <tbody>
            {Object.keys(draft).map(siteId => {
              const row = draft[siteId];
              const dirty = !sameValues(row, saved[siteId]);

              return (
                <tr key={siteId}>
                  <td className="nowrap">{siteLabel(siteId)}</td>
                  <td>
                    <Switch
                      checked={row.enabled}
                      onChange={e => edit(siteId, { enabled: e.target.checked })}
                      inputProps={{ 'aria-label': `${siteLabel(siteId)} · ${t('rec.enabled')}` }}
                    />
                  </td>
                  <td>{pctField(siteId, 'samplePct', t('rec.sample'))}</td>
                  <td>{pctField(siteId, 'mobilePct', t('rec.mobile'))}</td>
                  <td className="nowrap">
                    <CcButton kind="primary" disabled={!dirty || busy === siteId} onClick={() => save(siteId)}>
                      {t('rec.save')}
                    </CcButton>
                    <Box
                      component="span"
                      role="status"
                      sx={{ ml: '10px', fontSize: 12.5, color: state[siteId] === 'saved' ? cc.greenInk : cc.red }}
                    >
                      {stateText(state[siteId])}
                    </Box>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Box>
      </Box>
      <SectionLabel sx={{ mb: '8px' }}>{t('rec.staffTitle')}</SectionLabel>
      <Box sx={{ fontSize: 13, color: cc.text, lineHeight: 1.5, mb: '12px', maxWidth: 720 }}>{t('rec.staffText')}</Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))',
          gap: '8px 16px',
        }}
      >
        {staffLinks(true).map((link, i) => (
          <Box key={link.siteId} sx={{ display: 'flex', gap: '12px', alignItems: 'baseline', fontSize: 13 }}>
            <Box component="span" sx={{ minWidth: 140, color: cc.ink, fontWeight: 600 }}>
              {link.label}
            </Box>
            <Box component="a" href={link.href} target="_blank" rel="noopener" sx={{ color: cc.link }}>
              {t('rec.staffMark')}
            </Box>
            <Box component="a" href={staffLinks(false)[i].href} target="_blank" rel="noopener" sx={{ color: cc.muted }}>
              {t('rec.staffUnmark')}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default Recording;
