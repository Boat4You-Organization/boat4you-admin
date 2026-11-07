/* PR → Pitchevi: one pitch — recipient, subject, the text exactly as it goes out (body + the backend's footer), the
 * send decision, and what may be done now (pitchActions). "Pošalji" only for a DRAFT the rules allow, always through a
 * confirmation that shows recipient and full text; the backend freezes DRAFT → SENDING atomically, and the confirm
 * button is off while the request runs, so one click is one request. */
import { ChangeEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import PrService from '@/services/pr.service';
import { bbColors } from '@/styles/bb';
import { PrPitch, PrPitchStatus } from '@/types/pr.type';
import { decisionLabelKey, optOutDefaultFor, pitchActions, sendPreviewText } from '@/utils/pr/format';
import { showToast } from '@/valtio/global/global.actions';

import { ConfirmDialog, Label, PITCH_TONES, Pill, preSx, textAreaSx, useDates, usePrError } from './ui';

export const Recipient = ({ pitch }: { pitch: PrPitch }) => (
  <Box sx={{ fontSize: 14 }}>
    <strong>{pitch.contactName || pitch.contactEmail}</strong>
    {pitch.contactName && <> &lt;{pitch.contactEmail}&gt;</>}
    {pitch.outletName && (
      <Box component="span" sx={{ color: bbColors.gray500 }}>
        {' '}
        · {pitch.outletName}
      </Box>
    )}
  </Box>
);

const PitchDetail = ({
  pitch,
  hasFollowUp,
  onClose,
  onChanged,
}: {
  pitch: PrPitch;
  hasFollowUp: boolean;
  onClose(): void;
  /** The pitch as the backend answered it (or nothing after an error): the list reloads either way. */
  onChanged(p?: PrPitch): void;
}) => {
  const { t } = useTranslation('pr');
  const prError = usePrError();
  const dates = useDates();
  const a = pitchActions(pitch, hasFollowUp, new Date().toISOString());

  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState(pitch.subject);
  const [body, setBody] = useState(pitch.body);
  const [saving, setSaving] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
  const [confirmRetry, setConfirmRetry] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [followUpBody, setFollowUpBody] = useState('');
  const [nextStatus, setNextStatus] = useState<PrPitchStatus | ''>('');
  const [replyNote, setReplyNote] = useState(pitch.replyNote ?? '');
  const [optOut, setOptOut] = useState(false);
  const [confirmBounce, setConfirmBounce] = useState(false);
  /** null = the opt-out box is not offered for the chosen status. */
  const optOutOffered = optOutDefaultFor(nextStatus) !== null;

  useEffect(() => {
    setEditing(false);
    setSubject(pitch.subject);
    setBody(pitch.body);
    setNextStatus('');
    setOptOut(false);
    setReplyNote(pitch.replyNote ?? '');
  }, [pitch]);

  const chooseStatus = (s: PrPitchStatus) => {
    setNextStatus(s);
    setOptOut(optOutDefaultFor(s) ?? false);
  };

  /** One call; on error the list reloads (the pitch may have moved on), except for an edit, which keeps the typing. */
  const run = async (call: () => Promise<PrPitch>, done: string, reloadOnError = true) => {
    setSaving(true);
    try {
      const p = await call();

      showToast({ status: 'success', text: done });
      onChanged(p);

      return true;
    } catch (e) {
      showToast({ status: 'error', text: prError(e) });

      if (reloadOnError) onChanged();

      return false;
    } finally {
      setSaving(false);
    }
  };

  const send = async () => {
    try {
      const p = await PrService.send(pitch.id);

      // An SMTP failure answers 200 with the pitch FAILED: never report that as sent.
      if (p.status === 'SENT') {
        showToast({ status: 'success', text: t('pitches.sent') });
      } else if (p.status === 'FAILED') {
        showToast({ status: 'error', text: t('pitches.sendFailed', { error: p.error ?? '' }) });
      } else {
        showToast({ status: 'warning', text: t('pitches.sendUnclear', { status: t(`status.${p.status}`) }) });
      }

      setConfirmSend(false);
      onChanged(p);
    } catch (e) {
      // Without a backend answer (network drop, proxy 504) the send may still have gone: the text says "unknown", and
      // the list reloads so the pitch's real status shows.
      showToast({ status: 'error', text: prError(e, t('pitches.sendError')) });
      setConfirmSend(false);
      onChanged();
    }
  };

  const saveStatus = async () => {
    if (!nextStatus) return;

    await run(
      () =>
        PrService.setPitchStatus(pitch.id, {
          status: nextStatus,
          replyNote: replyNote.trim() || null,
          optOut: optOutOffered && optOut,
        }),
      t('pitches.statusSaved')
    );
    setConfirmBounce(false);
  };

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        {pitch.parentPitchId ? t('pitches.followUpOf', { id: pitch.parentPitchId }) : t('pitches.detailTitle')}
        <Pill tone={PITCH_TONES[pitch.status]}>{t(`status.${pitch.status}`)}</Pill>
        <Typography component="span" sx={{ fontSize: 12.5, color: bbColors.gray500 }}>
          {t(`template.${pitch.template}`)}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack gap={1.5}>
          <Box>
            <Label>{t('pitches.recipient')}</Label>
            <Recipient pitch={pitch} />
          </Box>

          {a.stuck && <Alert severity="warning">{t('pitches.stuck')}</Alert>}

          {a.canRetry && (
            <>
              <Alert severity="error">
                <strong>{t('pitches.failedTitle')}</strong>
                <Box sx={{ mt: 0.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {pitch.error || t('pitches.noError')}
                </Box>
              </Alert>
              <Alert severity="warning">{t('pitches.failedWarning')}</Alert>
            </>
          )}

          {a.blockedBy && (
            <Alert severity="warning">
              {t('pitches.blocked')} <strong>{t(decisionLabelKey(a.blockedBy))}</strong>
            </Alert>
          )}

          {editing ? (
            <>
              <TextField
                size="small"
                label={t('pitches.subject')}
                value={subject}
                onChange={e => setSubject(e.target.value)}
                inputProps={{ maxLength: 300 }}
              />
              <Box
                component="textarea"
                aria-label={t('pitches.body')}
                value={body}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setBody(e.target.value)}
                sx={{ ...textAreaSx, minHeight: 260 }}
              />
              <Box>
                <Label>{t('pitches.footer')}</Label>
                <Box component="pre" sx={{ ...preSx, color: bbColors.gray500 }}>
                  {pitch.footer}
                </Box>
              </Box>
            </>
          ) : (
            <>
              <Box>
                <Label>{t('pitches.subject')}</Label>
                <Box sx={{ fontSize: 15, fontWeight: 700 }}>{pitch.subject}</Box>
              </Box>
              <Box>
                <Label>{t('pitches.asSent')}</Label>
                <Box component="pre" sx={preSx}>
                  {sendPreviewText(pitch)}
                </Box>
              </Box>
            </>
          )}

          {(pitch.sentAt || pitch.messageId) && (
            <Typography sx={{ fontSize: 12.5, color: bbColors.gray500 }}>
              {t('pitches.sentAt', { date: dates.dateTime(pitch.sentAt) })}
              {pitch.messageId && ` · Message-ID ${pitch.messageId}`}
            </Typography>
          )}
          {pitch.replyNote && (
            <Box>
              <Label>{t('pitches.replyNote')}</Label>
              <Box sx={{ fontSize: 13.5, whiteSpace: 'pre-wrap' }}>{pitch.replyNote}</Box>
            </Box>
          )}

          {a.followUp !== 'hidden' && (
            <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
              <Button variant="outlined" disabled={a.followUp !== 'ready'} onClick={() => setFollowUpOpen(true)}>
                {t('pitches.followUp')}
              </Button>
              <Typography sx={{ fontSize: 13, color: bbColors.gray600 }}>
                {t('pitches.followUpFrom', { date: dates.day(a.followUpOn) })}
              </Typography>
            </Stack>
          )}

          {a.statusTargets.length > 0 && (
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} alignItems={{ sm: 'flex-start' }}>
              <TextField
                select
                size="small"
                label={t('pitches.newStatus')}
                value={nextStatus}
                onChange={e => chooseStatus(e.target.value as PrPitchStatus)}
                sx={{ minWidth: 180 }}
              >
                {a.statusTargets.map(s => (
                  <MenuItem key={s} value={s}>
                    {t(`status.${s}`)}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                size="small"
                fullWidth
                multiline
                maxRows={4}
                label={t('pitches.replyNote')}
                value={replyNote}
                onChange={e => setReplyNote(e.target.value)}
              />
              <Button
                variant="outlined"
                disabled={!nextStatus || saving}
                onClick={() => (nextStatus === 'BOUNCED' ? setConfirmBounce(true) : saveStatus())}
              >
                {t('pitches.saveStatus')}
              </Button>
            </Stack>
          )}
          {a.statusTargets.length > 0 && optOutOffered && (
            <Box>
              <FormControlLabel
                control={<Checkbox checked={optOut} onChange={e => setOptOut(e.target.checked)} />}
                label={t('pitches.optOut')}
              />
              {optOut && (
                <Typography sx={{ fontSize: 12.5, color: bbColors.gray600 }}>
                  {t('pitches.optOutHint', { email: pitch.contactEmail })}
                </Typography>
              )}
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ flexWrap: 'wrap', gap: 1 }}>
        <Button variant="outlined" onClick={onClose}>
          {t('ui.close')}
        </Button>
        {a.canRetry && (
          <Button variant="outlined" color="warning" onClick={() => setConfirmRetry(true)}>
            {t('pitches.backToDraft')}
          </Button>
        )}
        {a.canEdit && !editing && (
          <Button variant="outlined" onClick={() => setEditing(true)}>
            {t('ui.edit')}
          </Button>
        )}
        {editing && (
          <>
            <Button variant="outlined" onClick={() => setEditing(false)} disabled={saving}>
              {t('ui.cancel')}
            </Button>
            <Button
              variant="contained"
              disabled={saving || !subject.trim() || !body.trim()}
              onClick={() => run(() => PrService.updatePitch(pitch.id, { subject, body }), t('pitches.saved'), false)}
            >
              {saving ? <CircularProgress size={18} /> : t('ui.save')}
            </Button>
          </>
        )}
        {a.canEdit && !editing && (
          <Button variant="contained" disabled={!a.canSend} onClick={() => setConfirmSend(true)}>
            {t('pitches.send')}
          </Button>
        )}
      </DialogActions>

      <ConfirmDialog
        open={confirmSend}
        title={t('pitches.confirmSendTitle')}
        confirmLabel={t('pitches.confirmSend')}
        onConfirm={send}
        onClose={() => setConfirmSend(false)}
      >
        <Stack gap={1.5}>
          <Box>
            <Label>{t('pitches.recipient')}</Label>
            <Recipient pitch={pitch} />
          </Box>
          <Box>
            <Label>{t('pitches.subject')}</Label>
            <Box sx={{ fontSize: 15, fontWeight: 700, color: bbColors.navy900 }}>{pitch.subject}</Box>
          </Box>
          <Box>
            <Label>{t('pitches.asSent')}</Label>
            <Box component="pre" sx={{ ...preSx, maxHeight: 360, overflowY: 'auto' }}>
              {sendPreviewText(pitch)}
            </Box>
          </Box>
          <Typography sx={{ fontSize: 12.5 }}>{t('pitches.confirmSendHint')}</Typography>
        </Stack>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmRetry}
        danger
        title={t('pitches.confirmRetryTitle')}
        confirmLabel={t('pitches.backToDraft')}
        onConfirm={async () => {
          if (await run(() => PrService.setPitchStatus(pitch.id, { status: 'DRAFT' }), t('pitches.backInDraft'))) {
            setConfirmRetry(false);
          }
        }}
        onClose={() => setConfirmRetry(false)}
      >
        {t('pitches.failedWarning')}
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmBounce}
        danger
        title={t('pitches.confirmBounceTitle')}
        confirmLabel={t('status.BOUNCED')}
        onConfirm={saveStatus}
        onClose={() => setConfirmBounce(false)}
      >
        {t('pitches.confirmBounce', { email: pitch.contactEmail })}
      </ConfirmDialog>

      <ConfirmDialog
        open={followUpOpen}
        title={t('pitches.followUpTitle')}
        confirmLabel={t('pitches.followUpCreate')}
        confirmDisabled={!followUpBody.trim()}
        onConfirm={async () => {
          const created = await run(
            () => PrService.followUp(pitch.id, { body: followUpBody }),
            t('pitches.followUpCreated'),
            false
          );

          if (created) {
            setFollowUpOpen(false);
            setFollowUpBody('');
          }
        }}
        onClose={() => setFollowUpOpen(false)}
      >
        <Stack gap={1}>
          <Typography sx={{ fontSize: 13 }}>{t('pitches.followUpHint', { subject: pitch.subject })}</Typography>
          <Box
            component="textarea"
            aria-label={t('pitches.body')}
            value={followUpBody}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFollowUpBody(e.target.value)}
            sx={{ ...textAreaSx, minHeight: 180 }}
          />
        </Stack>
      </ConfirmDialog>
    </Dialog>
  );
};

export default PitchDetail;
