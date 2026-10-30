/* The client card: right column of a conversation, a drawer on tablets and phones, and the contact page. Contacts are
 * merged only by the broker's click, because no identity is verified yet; look-alikes by email or phone are only
 * suggested ("moguće ista osoba, neprovjereno"). */
import { KeyboardEvent, ReactNode, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';

import { Box, IconButton } from '@mui/material';
import { isAxiosError } from 'axios';

import ContactCenterService from '@/services/contactCenter.service';
import { CONTACT_STATUSES, ContactCard, ContactPatch, ContactStatus, SourceView } from '@/types/contactCenter.type';
import { siteLabel } from '@/utils/contactCenter/safeLink';
import { showToast } from '@/valtio/global/global.actions';
import { ContactStatusChip, PageLink, countryText, formatAt, linkSx } from '@/views/ContactCenter/common';
import { CcButton, CloseIcon, Labeled, Pill, SectionLabel, cc, fieldSx, textareaSx } from '@/views/ContactCenter/ui';

export type CardLayout = 'column' | 'drawer' | 'page';

const TAG_MAX = 40; // = ContactService.TAG_MAX
const SUGGESTED_TAGS = ['vip', 'spam'];

const initials = (name: string | null, email: string | null) => {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);

  if (words.length) {
    return words
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('');
  }

  return email?.trim()[0]?.toUpperCase() ?? '#';
};

const Source = ({ kind, s }: { kind: string; s: SourceView | null }) => {
  const { t } = useTranslation('contactCenter');

  if (!s) return null;

  const campaign = [s.utmSource, s.utmMedium, s.utmCampaign].filter(Boolean).join(' / ');
  const detail = [
    formatAt(s.at, 'DD.MM.YYYY HH:mm'),
    s.fromSiteId && `${t('fromSite')} ${siteLabel(s.fromSiteId)}`,
    campaign,
    s.referrer && `${t('referrer')} ${s.referrer}`,
  ].filter(Boolean);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '3px',
        p: '10px',
        bgcolor: cc.soft,
        borderRadius: '8px',
        fontSize: 12.5,
        minWidth: 0,
      }}
    >
      <Box component="span" sx={{ fontSize: 11.5, color: cc.muted }}>
        {kind}
      </Box>
      <Box component="strong" sx={{ fontWeight: 600, color: cc.ink }}>
        {t(`channel.${s.channel}`, { defaultValue: s.channel })} · {siteLabel(s.siteId)}
      </Box>
      <Box component="span" sx={{ color: cc.text2, wordBreak: 'break-word' }}>
        {detail.join(' · ')}
      </Box>
      {s.landingUrl && (
        <Box component="span" sx={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <PageLink siteId={s.siteId} path={s.landingUrl} />
        </Box>
      )}
    </Box>
  );
};

const TagEditor = ({
  tags,
  onChange,
  wide,
  busy,
}: {
  tags: string[];
  onChange(tags: string[]): void;
  wide: boolean;
  busy: boolean;
}) => {
  const { t } = useTranslation('contactCenter');
  const [input, setInput] = useState('');

  const add = (raw: string) => {
    if (busy) return; // the next change waits for the saved list (two quick taps would drop a tag)

    const tag = raw.trim().toLowerCase();

    setInput('');

    if (tag && !tags.includes(tag)) onChange([...tags, tag]);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && !e.nativeEvent.isComposing) {
      e.preventDefault();
      add(input);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <Box component="span" sx={{ fontSize: 12, fontWeight: 500, color: cc.text2 }}>
        {t('contact.tags')}
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
          p: '6px',
          minHeight: 38,
          border: `1px solid ${cc.field}`,
          borderRadius: '8px',
          bgcolor: '#FFFFFF',
        }}
      >
        {tags.map(tag => (
          <Pill key={tag} colors={[cc.tagBg, cc.tagFg]} sx={{ fontWeight: 500, pr: '2px' }}>
            {tag}
            <Box
              component="button"
              type="button"
              aria-label={t('removeTag', { tag })}
              disabled={busy}
              onClick={() => onChange(tags.filter(x => x !== tag))}
              sx={{
                border: 0,
                bgcolor: 'transparent',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: 13,
                lineHeight: 1,
                px: '4px',
                fontFamily: 'inherit',
              }}
            >
              ×
            </Box>
          </Pill>
        ))}
        <Box
          component="input"
          aria-label={t('contact.addTag')}
          placeholder={`${t('contact.addTag')}…`}
          value={input}
          maxLength={TAG_MAX}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
          onKeyDown={onKey}
          sx={{
            flex: 1,
            minWidth: 80,
            border: 0,
            outline: 'none',
            fontSize: { xs: 16, md: 13 },
            fontFamily: 'inherit',
            color: cc.ink,
            bgcolor: 'transparent',
          }}
        />
      </Box>
      <Box component="span" sx={{ fontSize: 11.5, color: cc.muted }}>
        {`${t('tagSuggestions')}: `}
        {SUGGESTED_TAGS.map((tag, i) => (
          <Box component="span" key={tag}>
            {i > 0 && ' · '}
            <Box
              component="button"
              type="button"
              onClick={() => add(tag)}
              sx={{
                border: 0,
                p: 0,
                bgcolor: 'transparent',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 11.5,
                ...linkSx,
              }}
            >
              {tag}
            </Box>
          </Box>
        ))}
        {!wide && ` ${t('spamTagHint')}`}
      </Box>
    </Box>
  );
};

const Block = ({ title, children, page }: { title: string; children: ReactNode; page: boolean }) => (
  <Box
    sx={
      page
        ? { display: 'flex', flexDirection: 'column' }
        : { p: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px', borderBottom: `1px solid ${cc.hair}` }
    }
  >
    <SectionLabel sx={page ? { mb: '4px' } : undefined}>{title}</SectionLabel>
    {children}
  </Box>
);

const ClientCard = ({
  contactId,
  layout,
  onMerged,
  onClose,
}: {
  contactId: number | null;
  layout: CardLayout;
  onMerged?(): void;
  onClose?(): void;
}) => {
  const { t } = useTranslation('contactCenter');
  const [card, setCard] = useState<ContactCard | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', note: '' });
  const [saving, setSaving] = useState(false);
  const [tagsSaving, setTagsSaving] = useState(false);
  const page = layout === 'page';

  /** keepForm: after a status or tag save, unsaved edits of name, e-mail, phone and note stay in the fields. */
  const load = useCallback(
    async (keepForm = false) => {
      if (contactId == null) {
        setCard(null);

        return;
      }

      try {
        const { data } = await ContactCenterService.contact(contactId);

        setCard(data);

        if (keepForm) return;

        setForm({
          name: data.contact.name ?? '',
          email: data.contact.email ?? '',
          phone: data.contact.phone ?? '',
          note: data.note ?? '',
        });
      } catch {
        setCard(null);
      }
    },
    [contactId]
  );

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const c = card?.contact;
  const dirty =
    !!card &&
    !!c &&
    (form.name !== (c.name ?? '') ||
      form.email !== (c.email ?? '') ||
      form.phone !== (c.phone ?? '') ||
      form.note !== (card.note ?? ''));

  const errorText = (e: unknown) =>
    isAxiosError(e) && e.response?.data?.error ? String(e.response.data.error) : t('saveFailed');

  const save = async (patch: ContactPatch, keepForm = false) => {
    if (!c) return;

    setSaving(true);
    try {
      await ContactCenterService.updateContact(c.id, patch);
      await load(keepForm);
    } catch (e) {
      showToast({ status: 'error', text: errorText(e) });
    } finally {
      setSaving(false);
    }
  };

  const saveForm = () => save({ name: form.name, email: form.email, phone: form.phone, note: form.note });

  const saveTags = async (tags: string[]) => {
    if (!c || tagsSaving) return;

    setTagsSaving(true);
    try {
      await ContactCenterService.setTags(c.id, tags);
      await load(true);
    } catch (e) {
      showToast({ status: 'error', text: errorText(e) });
    } finally {
      setTagsSaving(false);
    }
  };

  const merge = async (sourceId: number) => {
    if (!c || !window.confirm(t('confirmMerge'))) return;

    try {
      await ContactCenterService.merge(c.id, sourceId);
      await load();
      onMerged?.();
    } catch (e) {
      showToast({ status: 'error', text: errorText(e) });
    }
  };

  const header =
    layout === 'page' ? null : (
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          minHeight: 52,
          px: '16px',
          bgcolor: '#FFFFFF',
          borderBottom: `1px solid ${cc.hair}`,
          flex: 'none',
        }}
      >
        <Box component="h2" sx={{ m: 0, fontSize: 15, fontWeight: 700, color: cc.ink }}>
          {t('clientCard')}
        </Box>
        {layout === 'column' && dirty && (
          <CcButton kind="primary" disabled={saving} onClick={saveForm} sx={{ ml: 'auto', minHeight: 32, px: '12px' }}>
            {t('save')}
          </CcButton>
        )}
        {layout === 'drawer' && (
          <IconButton
            aria-label={t('closePanel')}
            onClick={onClose}
            sx={{ ml: 'auto', width: 44, height: 44, color: cc.ink }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </Box>
    );

  if (contactId == null || !card || !c) {
    return (
      <>
        {header}
        {contactId == null && (
          <Box sx={{ p: '24px 16px', fontSize: 13, color: cc.muted, lineHeight: 1.5 }}>{t('noContact')}</Box>
        )}
      </>
    );
  }

  const fields = (
    <>
      <Labeled label={t('contact.name')}>
        <Box
          component="input"
          value={form.name}
          maxLength={120}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })}
          sx={fieldSx}
        />
      </Labeled>
      <Labeled label={t('contact.email')}>
        <Box
          component="input"
          type="email"
          value={form.email}
          maxLength={254}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, email: e.target.value })}
          sx={fieldSx}
        />
      </Labeled>
      <Labeled label={t('contact.phone')}>
        <Box
          component="input"
          type="tel"
          value={form.phone}
          maxLength={40}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, phone: e.target.value })}
          sx={fieldSx}
        />
      </Labeled>
      <Labeled label={t('contact.status')} hint={t('savesNow')}>
        <Box
          component="select"
          value={c.status}
          disabled={saving}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            save({ status: e.target.value as ContactStatus }, true)
          }
          sx={fieldSx}
        >
          {CONTACT_STATUSES.map(s => (
            <option key={s} value={s}>
              {t(`contactStatus.${s}`)}
            </option>
          ))}
        </Box>
      </Labeled>
      <TagEditor tags={c.tags} onChange={tags => saveTags(tags)} wide={page} busy={tagsSaving} />
      <Labeled label={t('contact.note')}>
        <Box
          component="textarea"
          rows={page ? 4 : 3}
          value={form.note}
          maxLength={5000}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, note: e.target.value })}
          sx={textareaSx}
        />
      </Labeled>
    </>
  );

  const lineSx = page
    ? { fontSize: 13, color: cc.text, lineHeight: 1.5, py: '6px', borderBottom: '1px solid #F1F3F5' }
    : { fontSize: 12.5, color: cc.text, lineHeight: 1.5 };

  const duplicates = card.possibleDuplicates.length > 0 && (
    <Box
      sx={
        page
          ? { display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }
          : { p: '14px 16px 18px', display: 'flex', flexDirection: 'column', gap: 1 }
      }
    >
      <SectionLabel>{t('contact.duplicates')}</SectionLabel>
      {card.possibleDuplicates.map(d => (
        <Box
          key={d.id}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: '8px 10px',
            border: `1px dashed ${cc.field}`,
            borderRadius: '8px',
          }}
        >
          <Box
            component={RouterLink}
            to={`/contact-center/contacts/${d.id}`}
            sx={{ ...linkSx, flex: 1, minWidth: 0, fontSize: page ? 13 : 12.5, lineHeight: 1.4 }}
          >
            {[d.name, d.email, d.phone].filter(Boolean).join(' · ') || `#${d.id}`}
          </Box>
          <CcButton kind="out" onClick={() => merge(d.id)} sx={{ minHeight: 32, px: '10px', fontSize: 12 }}>
            {t('merge')}
          </CcButton>
        </Box>
      ))}
    </Box>
  );

  const history = (
    <>
      <Block title={t('contact.visits', { count: card.visits.length })} page={page}>
        {!card.visits.length && <Box sx={{ ...lineSx, color: cc.muted }}>—</Box>}
        {card.visits.slice(0, 10).map(v => (
          <Box key={v.id} sx={lineSx}>
            {formatAt(v.startedAt)} · {siteLabel(v.siteId)} · {t('pages', { count: v.pageCount })} ·{' '}
            {t(`channel.${v.channel}`, { defaultValue: v.channel })} · {countryText(v.countryCode)}
          </Box>
        ))}
      </Block>
      <Block title={t('contact.conversations', { count: card.conversations.length })} page={page}>
        {!card.conversations.length && <Box sx={{ ...lineSx, color: cc.muted }}>—</Box>}
        {card.conversations.map(r => (
          <Box key={r.id} sx={lineSx}>
            <Box component={RouterLink} to={`/contact-center/c/${r.id}`} sx={linkSx}>
              {formatAt(r.lastActivityAt)} · {siteLabel(r.siteId)} ·{' '}
              {t(`status.${r.status}`, { defaultValue: r.status })}
            </Box>
          </Box>
        ))}
      </Block>
      <Block title={t('contact.searches')} page={page}>
        {!card.searches.length && <Box sx={{ ...lineSx, color: cc.muted }}>—</Box>}
        {card.searches.slice(0, 15).map((s, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <Box key={`${s.at}-${i}`} sx={lineSx}>
            {formatAt(s.at, 'DD.MM.')} · {[s.location, s.countryCode].filter(Boolean).join(', ') || '—'}
            {s.startDate && ` · ${formatAt(s.startDate, 'DD.MM.YYYY')}`}
            {s.minPersons != null && ` · ${t('persons', { count: s.minPersons })}`}
            {s.vesselType && ` · ${s.vesselType}`}
            {s.resultCount != null && ` · ${t('results', { count: s.resultCount })}`}
          </Box>
        ))}
      </Block>
      <Block title={t('contact.boats')} page={page}>
        {!card.boatsViewed.length && <Box sx={{ ...lineSx, color: cc.muted }}>—</Box>}
        <Box
          sx={{ display: 'flex', flexWrap: 'wrap', gap: page ? '4px 12px' : '4px 10px', fontSize: page ? 13 : 12.5 }}
        >
          {card.boatsViewed.map(slug => (
            <PageLink key={slug} siteId="boat4you" path={`/boat/${encodeURIComponent(slug)}`} label={slug} />
          ))}
        </Box>
      </Block>
    </>
  );

  const sources = (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: page ? { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' } : '1fr',
        gap: 1,
      }}
    >
      <Source kind={t('contact.firstSource')} s={card.firstSource} />
      <Source kind={t('contact.lastSource')} s={card.lastSource} />
      {!card.firstSource && !card.lastSource && <Box sx={{ fontSize: 12.5, color: cc.muted }}>—</Box>}
    </Box>
  );

  if (page) {
    return (
      <Box
        component="article"
        sx={{ mt: 1, bgcolor: '#FFFFFF', border: `1px solid ${cc.border}`, borderRadius: '12px', overflow: 'hidden' }}
      >
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '12px',
            p: { xs: '16px', md: '18px 22px' },
            borderBottom: `1px solid ${cc.hair}`,
          }}
        >
          <Box
            aria-hidden="true"
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              bgcolor: '#E8EEFF',
              color: '#1E3FA8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
            }}
          >
            {initials(c.name, c.email)}
          </Box>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Box component="h2" sx={{ m: 0, fontSize: 20, fontWeight: 700, color: cc.ink, wordBreak: 'break-word' }}>
              {c.name || c.email || `#${c.id}`}
            </Box>
            <Box sx={{ fontSize: 13, color: cc.muted, mt: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {t('clientCard')} · <ContactStatusChip status={c.status} />
            </Box>
          </Box>
          <CcButton kind="primary" disabled={saving || !dirty} onClick={saveForm}>
            {t('save')}
          </CcButton>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
          <Box
            sx={{
              flex: '1 1 320px',
              p: { xs: '16px', md: '18px 22px' },
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              borderRight: { md: `1px solid ${cc.hair}` },
            }}
          >
            {fields}
            {duplicates}
          </Box>
          <Box
            sx={{
              flex: '1 1 360px',
              p: { xs: '16px', md: '18px 22px' },
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              minWidth: 0,
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <SectionLabel>{t('contact.sources')}</SectionLabel>
              {sources}
            </Box>
            {history}
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: layout === 'drawer' ? '100%' : undefined }}>
      {header}
      <Box sx={{ flex: 1 }}>
        <Box
          sx={{
            p: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            borderBottom: `1px solid ${cc.hair}`,
          }}
        >
          {fields}
        </Box>
        <Box
          sx={{
            p: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            borderBottom: `1px solid ${cc.hair}`,
          }}
        >
          <SectionLabel>{t('contact.sources')}</SectionLabel>
          {sources}
        </Box>
        {history}
        {duplicates}
      </Box>
      {layout === 'drawer' && dirty && (
        <Box
          sx={{
            position: 'sticky',
            bottom: 0,
            p: '12px 16px 16px',
            bgcolor: '#FFFFFF',
            borderTop: `1px solid ${cc.hair}`,
          }}
        >
          <CcButton
            kind="primary"
            disabled={saving}
            onClick={saveForm}
            sx={{ width: '100%', minHeight: 48, fontSize: 15, borderRadius: '10px' }}
          >
            {t('saveChanges')}
          </CcButton>
        </Box>
      )}
    </Box>
  );
};

export default ClientCard;
