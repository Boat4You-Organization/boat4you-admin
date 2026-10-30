/* Proactive message to a visitor on the site: queued on the server, delivered with the widget's next heartbeat. */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Dialog } from '@mui/material';

import ContactCenterService from '@/services/contactCenter.service';
import { LiveRow } from '@/types/contactCenter.type';
import { siteLabel } from '@/utils/contactCenter/safeLink';
import { showToast } from '@/valtio/global/global.actions';
import { CcButton, cc, textareaSx } from '@/views/ContactCenter/ui';

const MAX = 1000;

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

  const about = row
    ? [
        row.contactName ?? t('anonymousVisitor'),
        siteLabel(row.visitor.siteId),
        row.visitor.currentTitle ?? row.visitor.currentPath,
      ]
        .filter(Boolean)
        .join(' · ')
    : '';

  return (
    <Dialog
      open={!!row}
      onClose={onClose}
      fullWidth
      maxWidth={false}
      aria-labelledby="cc-proactive-title"
      PaperProps={{ sx: { maxWidth: 520, borderRadius: '14px', boxShadow: '0 20px 50px rgba(11,29,58,0.3)', m: 2 } }}
    >
      <Box sx={{ p: '18px 20px 6px' }}>
        <Box component="h2" id="cc-proactive-title" sx={{ m: 0, fontSize: 17, fontWeight: 700, color: cc.ink }}>
          {t('proactive.title')}
        </Box>
        <Box component="p" sx={{ m: '6px 0 0', fontSize: 13, color: cc.muted }}>
          {about}
        </Box>
      </Box>
      <Box sx={{ p: '12px 20px' }}>
        <Box
          component="textarea"
          autoFocus
          aria-label={t('proactive.label')}
          rows={5}
          maxLength={MAX}
          value={text}
          placeholder={t('proactive.placeholder')}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
          sx={{ ...textareaSx, p: '10px 12px', borderRadius: '10px', fontSize: 14 }}
        />
        <Box sx={{ textAlign: 'right', fontSize: 12, color: cc.muted, mt: '4px' }}>
          {text.length} / {MAX}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, p: '12px 20px 18px' }}>
        <CcButton kind="txt" onClick={onClose}>
          {t('cancel')}
        </CcButton>
        <CcButton kind="fill" disabled={busy || !text.trim()} onClick={send}>
          {t('send')}
        </CcButton>
      </Box>
    </Dialog>
  );
};

export default ProactiveDialog;
