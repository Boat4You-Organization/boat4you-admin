/* Proactive message to a visitor on the site: queued on the server, delivered with the widget's next heartbeat. */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';

import ContactCenterService from '@/services/contactCenter.service';
import { LiveRow } from '@/types/contactCenter.type';
import { showToast } from '@/valtio/global/global.actions';

const ProactiveDialog = ({ row, onClose }: { row: LiveRow | null; onClose(): void }) => {
  const { t } = useTranslation('contactCenter');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!row || !text.trim()) return;

    setBusy(true);
    try {
      const { data } = await ContactCenterService.sendProactive(row.visitor.visitorKey, text.trim());

      showToast({ status: data.result === 'QUEUED' ? 'success' : 'warning', text: t(`proactive.${data.result}`) });

      if (data.result === 'QUEUED') {
        setText('');
        onClose();
      }
    } catch {
      showToast({ status: 'error', text: t('proactive.INVALID_TEXT') });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!row} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('proactive.title')}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={3}
          value={text}
          onChange={e => setText(e.target.value)}
          inputProps={{ maxLength: 1000 }}
          helperText={`${text.length} / 1000`}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('cancel')}</Button>
        <Button variant="contained" disabled={busy || !text.trim()} onClick={send}>
          {t('send')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProactiveDialog;
