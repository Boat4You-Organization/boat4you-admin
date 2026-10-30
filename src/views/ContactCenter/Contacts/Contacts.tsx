/* Contacts list: search name, email and phone; status and tag filters; pages of 50. */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import {
  Box,
  Button,
  Chip,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

import ContactCenterService from '@/services/contactCenter.service';
import { bbColors } from '@/styles/bb';
import { CONTACT_STATUSES, ContactRow } from '@/types/contactCenter.type';
import { formatAt } from '@/views/ContactCenter/common';

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

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
        <TextField
          size="small"
          placeholder={t('contactsSearch')}
          value={q}
          onChange={e => setQ(e.target.value)}
          sx={{ minWidth: 260 }}
        />
        <TextField
          select
          size="small"
          label={t('filter.contactStatus')}
          value={status}
          onChange={e => {
            setStatus(e.target.value);
            setPage(0);
          }}
          sx={{ minWidth: 170 }}
        >
          <MenuItem value="">{t('filter.all')}</MenuItem>
          {CONTACT_STATUSES.map(s => (
            <MenuItem key={s} value={s}>
              {t(`contactStatus.${s}`)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          label={t('filter.tag')}
          value={tag}
          onChange={e => {
            setTag(e.target.value.trim().toLowerCase());
            setPage(0);
          }}
          sx={{ minWidth: 140 }}
        />
      </Box>
      <Box sx={{ bgcolor: '#fff', border: `1px solid ${bbColors.gray100}`, borderRadius: 2, overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('contact.name')}</TableCell>
              <TableCell>{t('contact.email')}</TableCell>
              <TableCell>{t('contact.phone')}</TableCell>
              <TableCell>{t('contact.status')}</TableCell>
              <TableCell>{t('contact.tags')}</TableCell>
              <TableCell>{t('contactsTable.conversations')}</TableCell>
              <TableCell>{t('contactsTable.lastActivity')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(rows ?? []).map(c => (
              <TableRow
                key={c.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/contact-center/contacts/${c.id}`)}
              >
                <TableCell>{c.name ?? `#${c.id}`}</TableCell>
                <TableCell>{c.email ?? '—'}</TableCell>
                <TableCell>{c.phone ?? '—'}</TableCell>
                <TableCell>{t(`contactStatus.${c.status}`, { defaultValue: c.status })}</TableCell>
                <TableCell>
                  {c.tags.map(tg => (
                    <Chip key={tg} size="small" label={tg} sx={{ mr: 0.5, height: 20, fontSize: 11 }} />
                  ))}
                </TableCell>
                <TableCell>{c.conversations}</TableCell>
                <TableCell>{formatAt(c.lastActivityAt ?? c.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {rows && !rows.length && (
          <Typography sx={{ fontSize: 13, color: bbColors.gray500, p: 2 }}>{t('contactsEmpty')}</Typography>
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
        <Button size="small" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
          ← {t('prev')}
        </Button>
        <Typography sx={{ fontSize: 13, alignSelf: 'center' }}>{page + 1}</Typography>
        <Button size="small" disabled={(rows?.length ?? 0) < SIZE} onClick={() => setPage(p => p + 1)}>
          {t('next')} →
        </Button>
      </Box>
    </Box>
  );
};

export default Contacts;
