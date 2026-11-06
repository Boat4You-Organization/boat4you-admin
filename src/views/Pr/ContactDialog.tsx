/* PR → Mediji i kontakti: one contact by hand (new or edit). The address, where it was found (URL) and the day it was
 * found are required here: the backend stores a contact without them, but never mails it. */
import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';

import PrService from '@/services/pr.service';
import { PrContact, PrContactRequest, PrContactStatus, PrOutlet } from '@/types/pr.type';
import { contactFormMissing } from '@/utils/pr/format';
import { showToast } from '@/valtio/global/global.actions';

import { usePrError } from './ui';

/** OPTED_OUT is set only by the opt-out and bounce actions. */
const SETTABLE: PrContactStatus[] = ['ACTIVE', 'DO_NOT_CONTACT', 'CONSENT_REQUESTED', 'CONSENTED'];

interface Form {
  outletId: string;
  name: string;
  role: string;
  email: string;
  market: string;
  emailSourceUrl: string;
  emailFoundOn: string;
  status: PrContactStatus;
  recentArticleUrl: string;
  notes: string;
}

const formOf = (c: PrContact | null): Form => ({
  outletId: c?.outletId != null ? String(c.outletId) : '',
  name: c?.name ?? '',
  role: c?.role ?? '',
  email: c?.email ?? '',
  market: c?.market ?? '',
  emailSourceUrl: c?.emailSourceUrl ?? '',
  emailFoundOn: c?.emailFoundOn ?? '',
  status: c?.status ?? 'ACTIVE',
  recentArticleUrl: c?.recentArticleUrl ?? '',
  notes: c?.notes ?? '',
});

const ContactDialog = ({
  open,
  contact,
  outlets,
  onClose,
  onSaved,
}: {
  open: boolean;
  /** null = a new contact. */
  contact: PrContact | null;
  outlets: PrOutlet[];
  onClose(): void;
  onSaved(c: PrContact): void;
}) => {
  const { t } = useTranslation('pr');
  const prError = usePrError();
  const [form, setForm] = useState<Form>(formOf(contact));
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(formOf(contact));
      setTried(false);
    }
  }, [open, contact]);

  const set = (k: keyof Form) => (e: { target: { value: string } }) => setForm(f => ({ ...f, [k]: e.target.value }));

  const optedOut = contact?.status === 'OPTED_OUT';
  const body: PrContactRequest = {
    outletId: form.outletId ? Number(form.outletId) : null,
    name: form.name,
    role: form.role,
    email: form.email.trim(),
    market: form.market.trim().toUpperCase(),
    emailSourceUrl: form.emailSourceUrl.trim(),
    emailFoundOn: form.emailFoundOn || null,
    // Sent only when it changed, and never for an opted-out contact (the backend refuses OPTED_OUT by hand).
    status: optedOut || form.status === contact?.status ? undefined : form.status,
    recentArticleUrl: form.recentArticleUrl,
    notes: form.notes,
  };
  const missing = contactFormMissing(body);
  const err = (k: (typeof missing)[number]) => tried && missing.includes(k);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);

    if (missing.length || busy) return;

    setBusy(true);
    try {
      const saved = contact ? await PrService.updateContact(contact.id, body) : await PrService.createContact(body);

      showToast({ status: 'success', text: t('contacts.saved') });
      onSaved(saved);
    } catch (x) {
      showToast({ status: 'error', text: prError(x) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
      <Box component="form" onSubmit={submit} noValidate>
        <DialogTitle>{contact ? t('contacts.editTitle') : t('contacts.newTitle')}</DialogTitle>
        <DialogContent>
          <Stack gap={1.5} sx={{ pt: 1 }}>
            <TextField
              select
              size="small"
              label={t('contacts.outlet')}
              value={form.outletId}
              onChange={set('outletId')}
              SelectProps={{ displayEmpty: true }}
              InputLabelProps={{ shrink: true }}
            >
              <MenuItem value="">{t('contacts.noOutlet')}</MenuItem>
              {outlets.map(o => (
                <MenuItem key={o.id} value={String(o.id)}>
                  {o.name} ({o.market})
                </MenuItem>
              ))}
            </TextField>
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5}>
              <TextField size="small" fullWidth label={t('contacts.name')} value={form.name} onChange={set('name')} />
              <TextField size="small" fullWidth label={t('contacts.role')} value={form.role} onChange={set('role')} />
            </Stack>
            <TextField
              size="small"
              type="email"
              required
              label={t('contacts.email')}
              value={form.email}
              onChange={set('email')}
              error={err('email')}
              helperText={err('email') ? t('contacts.required') : undefined}
            />
            <TextField
              size="small"
              required
              label={t('contacts.emailSourceUrl')}
              placeholder="https://"
              value={form.emailSourceUrl}
              onChange={set('emailSourceUrl')}
              error={err('emailSourceUrl')}
              helperText={err('emailSourceUrl') ? t('contacts.required') : t('contacts.emailSourceHint')}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5}>
              <TextField
                size="small"
                type="date"
                required
                fullWidth
                label={t('contacts.emailFoundOn')}
                value={form.emailFoundOn}
                onChange={set('emailFoundOn')}
                InputLabelProps={{ shrink: true }}
                error={err('emailFoundOn')}
                helperText={err('emailFoundOn') ? t('contacts.required') : undefined}
              />
              <TextField
                size="small"
                fullWidth
                required={!form.outletId}
                label={t('contacts.market')}
                placeholder="GB"
                value={form.market}
                onChange={set('market')}
                inputProps={{ maxLength: 2 }}
                error={err('market')}
                helperText={err('market') ? t('contacts.marketRequired') : t('contacts.marketHint')}
              />
            </Stack>
            <TextField
              select
              size="small"
              label={t('contacts.status')}
              value={optedOut ? 'OPTED_OUT' : form.status}
              onChange={set('status')}
              disabled={optedOut}
            >
              {(optedOut ? ['OPTED_OUT' as const] : SETTABLE).map(s => (
                <MenuItem key={s} value={s}>
                  {t(`contactStatus.${s}`)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              label={t('contacts.recentArticleUrl')}
              placeholder="https://"
              value={form.recentArticleUrl}
              onChange={set('recentArticleUrl')}
            />
            <TextField
              size="small"
              multiline
              minRows={2}
              label={t('contacts.notes')}
              value={form.notes}
              onChange={set('notes')}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={onClose} disabled={busy}>
            {t('ui.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={busy}>
            {busy ? <CircularProgress size={18} /> : t('ui.save')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default ContactDialog;
