/* Contacts list: search name, email and phone; status and tag filters; pages of 50. */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Box } from '@mui/material';

import ContactCenterService from '@/services/contactCenter.service';
import { CONTACT_STATUSES, ContactRow } from '@/types/contactCenter.type';
import { ContactStatusChip, formatAt } from '@/views/ContactCenter/common';
import { CcButton, SearchField, TagPill, cc, fieldSx, panelSx, tableSx } from '@/views/ContactCenter/ui';

const SIZE = 50;

const Contacts = () => {
  const { t } = useTranslation('contactCenter');
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [tag, setTag] = useState('');
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<ContactRow[] | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setQuery(q.trim());
      setPage(0);
    }, 400);

    return () => window.clearTimeout(id);
  }, [q]);

  useEffect(() => {
    let current = true;

    ContactCenterService.contacts({
      q: query || undefined,
      status: status || undefined,
      tag: tag || undefined,
      page,
      size: SIZE,
    })
      .then(({ data }) => current && setRows(data))
      .catch(() => current && setRows([]));

    return () => {
      current = false;
    };
  }, [query, status, tag, page]);

  const open = (id: number) => navigate(`/contact-center/contacts/${id}`);

  return (
    <Box component="section" sx={panelSx}>
      <Box
        sx={{ display: 'flex', flexWrap: 'wrap', gap: '10px', p: '14px 16px', borderBottom: `1px solid ${cc.hair}` }}
      >
        <SearchField
          value={q}
          onChange={setQ}
          placeholder={t('contactsSearch')}
          label={t('contactsSearchLabel')}
          sx={{ flex: '1 1 320px' }}
        />
        <Box
          component="select"
          aria-label={t('filter.contactStatus')}
          value={status}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            setStatus(e.target.value);
            setPage(0);
          }}
          sx={{ ...fieldSx, flex: '0 1 200px' }}
        >
          <option value="">{t('contactStatusAll')}</option>
          {CONTACT_STATUSES.map(s => (
            <option key={s} value={s}>
              {t(`contactStatus.${s}`)}
            </option>
          ))}
        </Box>
        <Box
          component="input"
          aria-label={t('filter.tag')}
          placeholder={t('filter.tag')}
          value={tag}
          maxLength={40}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setTag(e.target.value.trim().toLowerCase());
            setPage(0);
          }}
          sx={{ ...fieldSx, flex: '0 1 160px' }}
        />
      </Box>
      <Box sx={{ overflowX: 'auto' }}>
        <Box component="table" sx={{ ...tableSx, minWidth: 980 }}>
          <thead>
            <tr>
              <th>{t('contact.name')}</th>
              <th>{t('contact.email')}</th>
              <th>{t('contact.phone')}</th>
              <th>{t('contact.status')}</th>
              <th>{t('contact.tags')}</th>
              <th className="num">{t('contactsTable.conversations')}</th>
              <th>{t('contactsTable.lastActivity')}</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map(c => (
              <tr key={c.id} className="click" onClick={() => open(c.id)}>
                <td>
                  <Box
                    component="a"
                    href={`/contact-center/contacts/${c.id}`}
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      open(c.id);
                    }}
                    sx={{ color: cc.ink, fontWeight: 600, textDecoration: 'none' }}
                  >
                    {c.name ?? `#${c.id}`}
                  </Box>
                </td>
                <td className="soft">{c.email ?? '—'}</td>
                <td className="soft nowrap">{c.phone ?? '—'}</td>
                <td>
                  <ContactStatusChip status={c.status} />
                </td>
                <td>
                  <Box sx={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {c.tags.map(tg => (
                      <TagPill key={tg}>{tg}</TagPill>
                    ))}
                  </Box>
                </td>
                <td className="num">{c.conversations}</td>
                <td className="muted nowrap">{formatAt(c.lastActivityAt ?? c.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </Box>
        {rows && !rows.length && (
          <Box sx={{ p: '32px 16px', textAlign: 'center', fontSize: 13, color: cc.muted }}>{t('contactsEmpty')}</Box>
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', p: '12px 16px' }}>
        <CcButton disabled={page === 0} onClick={() => setPage(p => p - 1)}>
          ← {t('prev')}
        </CcButton>
        <Box component="span" sx={{ fontSize: 13, color: cc.text2 }}>
          {t('pageOf', { page: page + 1, size: SIZE })}
        </Box>
        <CcButton disabled={(rows?.length ?? 0) < SIZE} onClick={() => setPage(p => p + 1)}>
          {t('next')} →
        </CcButton>
      </Box>
    </Box>
  );
};

export default Contacts;
