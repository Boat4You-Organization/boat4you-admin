/* Right column (and the contact page): the client card. Contacts are merged only by the broker's click, because no
 * identity is verified yet; look-alikes by email or phone are only suggested ("moguće ista osoba, neprovjereno"). */
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';

import { Autocomplete, Box, Button, Chip, Link, MenuItem, TextField, Typography } from '@mui/material';
import { isAxiosError } from 'axios';

import ContactCenterService from '@/services/contactCenter.service';
import { bbColors } from '@/styles/bb';
import { CONTACT_STATUSES, ContactCard, ContactPatch, ContactStatus, SourceView } from '@/types/contactCenter.type';
import { siteLabel } from '@/utils/contactCenter/safeLink';
import { showToast } from '@/valtio/global/global.actions';
import { Field, PageLink, SectionTitle, countryText, formatAt } from '@/views/ContactCenter/common';

const Source = ({ s }: { s: SourceView | null }) => {
  const { t } = useTranslation('contactCenter');

  if (!s) return <span>—</span>;

  const campaign = [s.utmSource, s.utmMedium, s.utmCampaign].filter(Boolean).join(' / ');

  return (
    <Box component="span">
      {t(`channel.${s.channel}`, { defaultValue: s.channel })} · {siteLabel(s.siteId)} · {formatAt(s.at)}
      {s.fromSiteId && ` · ${t('fromSite')}: ${siteLabel(s.fromSiteId)}`}
      {campaign && ` · ${campaign}`}
      {s.referrer && ` · ${s.referrer}`}
      {s.landingUrl && (
        <>
          {' · '}
          <PageLink siteId={s.siteId} path={s.landingUrl} />
        </>
      )}
    </Box>
  );
};

const ClientCard = ({ contactId, onMerged }: { contactId: number | null; onMerged?(): void }) => {
  const { t } = useTranslation('contactCenter');
  const [card, setCard] = useState<ContactCard | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', note: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (contactId == null) {
      setCard(null);

      return;
    }

    try {
      const { data } = await ContactCenterService.contact(contactId);

      setCard(data);
      setForm({
        name: data.contact.name ?? '',
        email: data.contact.email ?? '',
        phone: data.contact.phone ?? '',
        note: data.note ?? '',
      });
    } catch {
      setCard(null);
    }
  }, [contactId]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  if (contactId == null) {
    return <Typography sx={{ fontSize: 13, color: bbColors.gray500 }}>{t('noContact')}</Typography>;
  }

  if (!card) return null;

  const c = card.contact;
  const errorText = (e: unknown) =>
    isAxiosError(e) && e.response?.data?.error ? String(e.response.data.error) : t('saveFailed');

  const save = async (patch: ContactPatch) => {
    setSaving(true);
    try {
      await ContactCenterService.updateContact(c.id, patch);
      await load();
    } catch (e) {
      showToast({ status: 'error', text: errorText(e) });
    } finally {
      setSaving(false);
    }
  };

  const saveTags = async (tags: string[]) => {
    try {
      await ContactCenterService.setTags(c.id, tags);
      await load();
    } catch (e) {
      showToast({ status: 'error', text: errorText(e) });
    }
  };

  const merge = async (sourceId: number) => {
    if (!window.confirm(t('confirmMerge'))) return;

    try {
      await ContactCenterService.merge(c.id, sourceId);
      await load();
      onMerged?.();
    } catch (e) {
      showToast({ status: 'error', text: errorText(e) });
    }
  };

  const dirty =
    form.name !== (c.name ?? '') ||
    form.email !== (c.email ?? '') ||
    form.phone !== (c.phone ?? '') ||
    form.note !== (card.note ?? '');

  return (
    <Box sx={{ fontSize: 13 }}>
      <Box sx={{ display: 'grid', gap: 1 }}>
        <TextField
          size="small"
          label={t('contact.name')}
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          inputProps={{ maxLength: 120 }}
        />
        <TextField
          size="small"
          label={t('contact.email')}
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          inputProps={{ maxLength: 254 }}
        />
        <TextField
          size="small"
          label={t('contact.phone')}
          value={form.phone}
          onChange={e => setForm({ ...form, phone: e.target.value })}
          inputProps={{ maxLength: 40 }}
        />
        <TextField
          select
          size="small"
          label={t('contact.status')}
          value={c.status}
          onChange={e => save({ status: e.target.value as ContactStatus })}
        >
          {CONTACT_STATUSES.map(s => (
            <MenuItem key={s} value={s}>
              {t(`contactStatus.${s}`)}
            </MenuItem>
          ))}
        </TextField>
        <Autocomplete
          multiple
          freeSolo
          size="small"
          options={['vip', 'spam']}
          value={c.tags}
          onChange={(_, tags) => saveTags(tags.map(x => String(x).trim().toLowerCase()).filter(Boolean))}
          renderTags={(value, getTagProps) =>
            value.map((tag, index) => {
              const { key, ...rest } = getTagProps({ index });

              return <Chip key={key} size="small" label={tag} {...rest} />;
            })
          }
          renderInput={params => <TextField {...params} label={t('contact.tags')} placeholder={t('contact.addTag')} />}
        />
        <TextField
          size="small"
          multiline
          minRows={2}
          label={t('contact.note')}
          value={form.note}
          onChange={e => setForm({ ...form, note: e.target.value })}
          inputProps={{ maxLength: 5000 }}
        />
        {dirty && (
          <Button
            size="small"
            variant="contained"
            disabled={saving}
            onClick={() => save({ name: form.name, email: form.email, phone: form.phone, note: form.note })}
          >
            {t('save')}
          </Button>
        )}
      </Box>

      <SectionTitle>{t('contact.sources')}</SectionTitle>
      <Field label={t('contact.firstSource')}>
        <Source s={card.firstSource} />
      </Field>
      <Field label={t('contact.lastSource')}>
        <Source s={card.lastSource} />
      </Field>

      <SectionTitle>{t('contact.visits', { count: card.visits.length })}</SectionTitle>
      {card.visits.slice(0, 10).map(v => (
        <Box key={v.id} sx={{ color: bbColors.gray600 }}>
          {formatAt(v.startedAt)} · {siteLabel(v.siteId)} · {t('pages', { count: v.pageCount })} ·{' '}
          {t(`channel.${v.channel}`, { defaultValue: v.channel })} · {countryText(v.countryCode)}
        </Box>
      ))}

      <SectionTitle>{t('contact.conversations', { count: card.conversations.length })}</SectionTitle>
      {card.conversations.map(r => (
        <Box key={r.id}>
          <Link component={RouterLink} to={`/contact-center/c/${r.id}`}>
            {formatAt(r.lastActivityAt)} · {siteLabel(r.siteId)} · {t(`status.${r.status}`, { defaultValue: r.status })}
          </Link>
        </Box>
      ))}

      <SectionTitle>{t('contact.searches')}</SectionTitle>
      {!card.searches.length && <Box sx={{ color: bbColors.gray500 }}>—</Box>}
      {card.searches.slice(0, 15).map((s, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <Box key={`${s.at}-${i}`} sx={{ color: bbColors.gray600 }}>
          {formatAt(s.at, 'DD.MM.')} · {[s.location, s.countryCode].filter(Boolean).join(', ') || '—'}
          {s.startDate && ` · ${formatAt(s.startDate, 'DD.MM.YYYY')}`}
          {s.minPersons != null && ` · ${t('persons', { count: s.minPersons })}`}
          {s.vesselType && ` · ${s.vesselType}`}
          {s.resultCount != null && ` · ${t('results', { count: s.resultCount })}`}
        </Box>
      ))}

      <SectionTitle>{t('contact.boats')}</SectionTitle>
      {!card.boatsViewed.length && <Box sx={{ color: bbColors.gray500 }}>—</Box>}
      {card.boatsViewed.map(slug => (
        <Box key={slug}>
          <PageLink siteId="boat4you" path={`/boat/${encodeURIComponent(slug)}`} label={slug} />
        </Box>
      ))}

      {card.possibleDuplicates.length > 0 && (
        <>
          <SectionTitle>{t('contact.duplicates')}</SectionTitle>
          {card.possibleDuplicates.map(d => (
            <Box key={d.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Link component={RouterLink} to={`/contact-center/contacts/${d.id}`} sx={{ minWidth: 0, flex: 1 }}>
                {[d.name, d.email, d.phone].filter(Boolean).join(' · ') || `#${d.id}`}
              </Link>
              <Button size="small" variant="outlined" onClick={() => merge(d.id)}>
                {t('merge')}
              </Button>
            </Box>
          ))}
        </>
      )}
    </Box>
  );
};

export default ClientCard;
