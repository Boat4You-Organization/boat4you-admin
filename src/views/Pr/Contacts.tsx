/* PR → Mediji i kontakti: journalists by market and status, CSV import, a contact by hand, and "Odjavi" / "Bounce"
 * (both put the address on the suppression list: every contact with that address stops receiving mail). */
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Button, MenuItem, Stack, TextField } from '@mui/material';

import { FilterBar, Pager, SkeletonRows, TableCard, TableMessageRow, Th, cellSubSx, tdSx } from '@/components/Desk';
import PrService from '@/services/pr.service';
import { StatusTone, bbColors } from '@/styles/bb';
import { PrContact, PrContactStatus, PrOutlet } from '@/types/pr.type';
import { showToast } from '@/valtio/global/global.actions';

import ContactDialog from './ContactDialog';
import ContactImport from './ContactImport';
import { ConfirmDialog, ExtLink, Pill, useDates, usePrError } from './ui';

const STATUSES: PrContactStatus[] = ['ACTIVE', 'CONSENT_REQUESTED', 'CONSENTED', 'DO_NOT_CONTACT', 'OPTED_OUT'];

const TONES: Record<PrContactStatus, StatusTone> = {
  ACTIVE: 'info',
  CONSENT_REQUESTED: 'progress',
  CONSENTED: 'success',
  DO_NOT_CONTACT: 'neutral',
  OPTED_OUT: 'danger',
};

const PAGE_SIZE = 100;

type Suppress = { kind: 'optOut' | 'bounce'; contact: PrContact };

const Contacts = () => {
  const { t } = useTranslation('pr');
  const prError = usePrError();
  const dates = useDates();
  const [market, setMarket] = useState('');
  const [status, setStatus] = useState<PrContactStatus | ''>('');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<PrContact[]>([]);
  const [total, setTotal] = useState({ elements: 0, pages: 1 });
  const [outlets, setOutlets] = useState<PrOutlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<PrContact | null | undefined>(undefined);
  const [importOpen, setImportOpen] = useState(false);
  const [suppress, setSuppress] = useState<Suppress | null>(null);

  // The search box filters after a short pause, not on every key.
  useEffect(() => {
    const id = window.setTimeout(() => {
      setQuery(q.trim());
      setPage(0);
    }, 350);

    return () => window.clearTimeout(id);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await PrService.contacts({
        market: market.trim().length === 2 ? market.trim().toUpperCase() : null,
        status: status || null,
        q: query,
        page,
        size: PAGE_SIZE,
      });

      setRows(res.content);
      setTotal({ elements: res.page.totalElements, pages: Math.max(1, res.page.totalPages) });
      setError(null);
    } catch (e) {
      setError(prError(e, t('ui.loadError')));
    } finally {
      setLoading(false);
    }
  }, [market, status, query, page, prError, t]);

  const loadOutlets = useCallback(async () => {
    try {
      setOutlets(await PrService.outlets());
    } catch (e) {
      showToast({ status: 'error', text: prError(e, t('ui.loadError')) });
    }
  }, [prError, t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadOutlets();
  }, [loadOutlets]);

  const doSuppress = async () => {
    if (!suppress) return;

    try {
      const updated =
        suppress.kind === 'optOut'
          ? await PrService.optOut(suppress.contact.id)
          : await PrService.bounce(suppress.contact.id);

      showToast({ status: 'success', text: t(suppress.kind === 'optOut' ? 'contacts.optedOut' : 'contacts.bounced') });
      setSuppress(null);
      setRows(list => list.map(c => (c.id === updated.id ? updated : c)));
      // Other contacts with the same address are opted out too.
      load();
    } catch (e) {
      showToast({ status: 'error', text: prError(e) });
    }
  };

  return (
    <Stack gap={1.5}>
      <FilterBar>
        <TextField
          size="small"
          label={t('contacts.search')}
          value={q}
          onChange={e => setQ(e.target.value)}
          sx={{ flex: '1 1 240px' }}
        />
        <TextField
          size="small"
          label={t('contacts.market')}
          placeholder="GB"
          value={market}
          onChange={e => {
            setMarket(e.target.value);
            setPage(0);
          }}
          inputProps={{ maxLength: 2 }}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 110 }}
        />
        <TextField
          select
          size="small"
          label={t('contacts.status')}
          value={status}
          onChange={e => {
            setStatus(e.target.value as PrContactStatus | '');
            setPage(0);
          }}
          SelectProps={{ displayEmpty: true }}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 170 }}
        >
          <MenuItem value="">{t('ui.all')}</MenuItem>
          {STATUSES.map(s => (
            <MenuItem key={s} value={s}>
              {t(`contactStatus.${s}`)}
            </MenuItem>
          ))}
        </TextField>
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" onClick={() => setImportOpen(true)}>
          {t('contacts.import')}
        </Button>
        <Button variant="contained" onClick={() => setEditing(null)}>
          {t('contacts.new')}
        </Button>
      </FilterBar>

      <TableCard
        minWidth={980}
        footer={
          <Pager
            page={page + 1}
            totalPages={total.pages}
            onChange={p => setPage(p - 1)}
            range={t('contacts.total', { count: total.elements })}
            prevLabel={t('ui.prev')}
            nextLabel={t('ui.next')}
            pageLabel={t('ui.page', { page: page + 1, total: total.pages })}
          />
        }
      >
        <thead>
          <tr>
            <Th>{t('contacts.name')}</Th>
            <Th>{t('contacts.outlet')}</Th>
            <Th>{t('contacts.email')}</Th>
            <Th>{t('contacts.market')}</Th>
            <Th>{t('contacts.source')}</Th>
            <Th>{t('contacts.status')}</Th>
            <Th>{t('contacts.lastContacted')}</Th>
            <Th align="right"> </Th>
          </tr>
        </thead>
        <tbody>
          {loading && rows.length === 0 && <SkeletonRows cols={8} />}
          {error && <TableMessageRow cols={8} tone="error" title={error} />}
          {!loading && !error && rows.length === 0 && <TableMessageRow cols={8} title={t('contacts.empty')} />}
          {rows.map(c => (
            <tr key={c.id}>
              <Box component="td" sx={{ ...tdSx, fontWeight: 600 }}>
                {c.name || '—'}
                {c.role && (
                  <Box component="span" sx={cellSubSx}>
                    {c.role}
                  </Box>
                )}
              </Box>
              <Box component="td" sx={tdSx}>
                {c.outletName ?? '—'}
              </Box>
              <Box component="td" sx={tdSx}>
                {c.email}
              </Box>
              <Box component="td" sx={tdSx}>
                {c.market ?? (
                  <Box component="span" sx={{ color: bbColors.red700 }}>
                    {t('contacts.noMarket')}
                  </Box>
                )}
              </Box>
              <Box component="td" sx={{ ...tdSx, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {c.emailSourceUrl && c.emailFoundOn ? (
                  <>
                    <ExtLink href={c.emailSourceUrl}>{t('contacts.sourceLink')}</ExtLink>
                    <Box component="span" sx={cellSubSx}>
                      {dates.day(c.emailFoundOn)}
                    </Box>
                  </>
                ) : (
                  <Box component="span" sx={{ color: bbColors.red700 }}>
                    {t('contacts.noSource')}
                  </Box>
                )}
              </Box>
              <Box component="td" sx={tdSx}>
                <Pill tone={TONES[c.status]}>{t(`contactStatus.${c.status}`)}</Pill>
              </Box>
              <Box component="td" sx={tdSx}>
                {dates.dateTime(c.lastContactedAt)}
              </Box>
              <Box component="td" sx={{ ...tdSx, textAlign: 'right' }}>
                <Button size="small" variant="text" onClick={() => setEditing(c)}>
                  {t('ui.edit')}
                </Button>
                {c.status !== 'OPTED_OUT' && (
                  <>
                    <Button size="small" variant="text" onClick={() => setSuppress({ kind: 'optOut', contact: c })}>
                      {t('contacts.optOut')}
                    </Button>
                    <Button
                      size="small"
                      variant="text"
                      color="error"
                      onClick={() => setSuppress({ kind: 'bounce', contact: c })}
                    >
                      {t('contacts.bounce')}
                    </Button>
                  </>
                )}
              </Box>
            </tr>
          ))}
        </tbody>
      </TableCard>

      <ContactDialog
        open={editing !== undefined}
        contact={editing ?? null}
        outlets={outlets}
        onClose={() => setEditing(undefined)}
        onSaved={() => {
          setEditing(undefined);
          load();
        }}
      />
      <ContactImport
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onDone={() => {
          load();
          loadOutlets();
        }}
      />
      <ConfirmDialog
        open={!!suppress}
        danger
        title={suppress?.kind === 'bounce' ? t('contacts.confirmBounceTitle') : t('contacts.confirmOptOutTitle')}
        confirmLabel={suppress?.kind === 'bounce' ? t('contacts.bounce') : t('contacts.optOut')}
        onConfirm={doSuppress}
        onClose={() => setSuppress(null)}
      >
        {t('contacts.confirmSuppress', { email: suppress?.contact.email ?? '' })}
      </ConfirmDialog>
    </Stack>
  );
};

export default Contacts;
