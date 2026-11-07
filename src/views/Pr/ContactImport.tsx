/* PR → Mediji i kontakti: CSV import (pasted text or a file), then what the backend did with it: contacts created,
 * updated and the skipped rows with their reason. */
import { ChangeEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';

import PrService from '@/services/pr.service';
import { bbColors } from '@/styles/bb';
import { PrImportResult } from '@/types/pr.type';

import { textAreaSx, usePrError } from './ui';

/** The columns PrContactService.importCsv reads (market, outlet, tier and email are required). */
const CSV_HEADER =
  'market,outlet,tier,email,person,role,email_source_url,found_on,desk_contact,recent_article_url,recent_article_title,notes';

const ContactImport = ({ open, onClose, onDone }: { open: boolean; onClose(): void; onDone(): void }) => {
  const { t } = useTranslation('pr');
  const prError = usePrError();
  const [csv, setCsv] = useState('');
  const [fileName, setFileName] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PrImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setCsv('');
      setFileName('');
      setResult(null);
      setError(null);
    }
  }, [open]);

  const pick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    e.target.value = '';

    if (!file) return;

    setFileName(file.name);
    setCsv(await file.text());
  };

  const run = async () => {
    if (!csv.trim() || busy) return;

    setBusy(true);
    setError(null);
    try {
      setResult(await PrService.importContacts(csv));
      onDone();
    } catch (x) {
      setError(prError(x, t('contacts.importError')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('contacts.importTitle')}</DialogTitle>
      <DialogContent>
        <Stack gap={1.5} sx={{ pt: 1 }}>
          <Typography sx={{ fontSize: 13, color: bbColors.gray600 }}>{t('contacts.importHint')}</Typography>
          <Box component="code" sx={{ fontSize: 12, color: bbColors.gray600, wordBreak: 'break-all' }}>
            {CSV_HEADER}
          </Box>
          <Stack direction="row" alignItems="center" gap={1}>
            <Button variant="outlined" component="label" size="small">
              {t('contacts.importFile')}
              <input hidden type="file" accept=".csv,text/csv,text/plain" onChange={pick} />
            </Button>
            {fileName && <Typography sx={{ fontSize: 13 }}>{fileName}</Typography>}
          </Stack>
          <Box
            component="textarea"
            aria-label={t('contacts.importText')}
            placeholder={CSV_HEADER}
            value={csv}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCsv(e.target.value)}
            sx={{ ...textAreaSx, minHeight: 200, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12.5 }}
          />
          {error && <Alert severity="error">{error}</Alert>}
          {result && (
            <Alert severity={result.skipped.length ? 'warning' : 'success'}>
              {t('contacts.importResult', {
                created: result.created,
                updated: result.updated,
                skipped: result.skipped.length,
              })}
              {result.skipped.length > 0 && (
                <Box
                  component="ul"
                  sx={{ m: '6px 0 0', pl: '18px', fontSize: 12.5, maxHeight: 220, overflowY: 'auto' }}
                >
                  {result.skipped.map(s => (
                    <li key={s}>{s}</li>
                  ))}
                </Box>
              )}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose} disabled={busy}>
          {t('ui.close')}
        </Button>
        <Button variant="contained" onClick={run} disabled={busy || !csv.trim()}>
          {busy ? <CircularProgress size={18} /> : t('contacts.importRun')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContactImport;
