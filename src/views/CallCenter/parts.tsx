/* Call centar shared bits. Everything a client or Nika said is rendered as a React text node (never HTML), like the
 * Contact Center (ADMIN-12). Colours and building blocks come from the Contact Center board (one admin token set). */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box } from '@mui/material';
import dayjs from 'dayjs';

import CallCenterService from '@/services/callCenter.service';
import { bbTones } from '@/styles/bb';
import { CallInquiry, OfferEmailPreview } from '@/types/callCenter.type';
import { CcButton, Pill, cc, textareaSx } from '@/views/ContactCenter/ui';

type Tone = keyof typeof bbTones;

const tone = (t: Tone): [string, string] => [bbTones[t].bg, bbTones[t].fg];

const STATUS_TONE: Record<string, Tone> = {
  SCHEDULED: 'info',
  DIALING: 'progress',
  IN_PROGRESS: 'progress',
  DONE: 'success',
  NO_ANSWER: 'warning',
  BUSY: 'warning',
  VOICEMAIL: 'warning',
  FAILED: 'danger',
  CANCELLED: 'neutral',
  SKIPPED: 'neutral',
};

const OUTCOME_TONE: Record<string, Tone> = {
  CONFIRMED: 'success',
  WANTS_CHANGES: 'attention',
  READY_TO_BOOK: 'success',
  TRANSFERRED: 'success',
  CALL_BACK: 'attention',
  NOT_INTERESTED: 'neutral',
  BOOKED_ELSEWHERE: 'neutral',
  DO_NOT_CALL: 'danger',
  NO_CONSENT_TO_RECORD: 'danger',
  UNCLEAR: 'warning',
};

export const StatusChip = ({ status }: { status: string | null }) => {
  const { t } = useTranslation('callCenter');

  if (!status) return <span>—</span>;

  return (
    <Pill dot colors={tone(STATUS_TONE[status] ?? 'neutral')}>
      {t(`status.${status}`, { defaultValue: status })}
    </Pill>
  );
};

export const OutcomeChip = ({ outcome }: { outcome: string | null }) => {
  const { t } = useTranslation('callCenter');

  if (!outcome) return <span>—</span>;

  return (
    <Pill colors={tone(OUTCOME_TONE[outcome] ?? 'neutral')}>{t(`outcome.${outcome}`, { defaultValue: outcome })}</Pill>
  );
};

export const formatAt = (at: string | null | undefined, pattern = 'DD.MM.YYYY. HH:mm') =>
  at ? dayjs(at).format(pattern) : '—';

/** 174 → "2:54". */
export const formatSecs = (secs: number | null | undefined) =>
  secs === null || secs === undefined
    ? '—'
    : `${Math.floor(secs / 60)}:${String(Math.round(secs % 60)).padStart(2, '0')}`;

/** The message the interceptor rejected with (the response body), if it carries one. */
const refusal = (error: unknown): { skipReason?: string; message?: string } =>
  (error ?? {}) as { skipReason?: string; message?: string };

/** Mario's four actions on an inquiry (design §2.5). `onDone` reloads the caller's data. */
export const InquiryActions = ({ inquiry, onDone }: { inquiry: CallInquiry; onDone(): void }) => {
  const { t } = useTranslation('callCenter');
  const [busy, setBusy] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [note, setNote] = useState('');
  const [email, setEmail] = useState('');
  const [emailSentAt, setEmailSentAt] = useState<string | null>(null);
  const [preview, setPreview] = useState<OfferEmailPreview | null>(null);
  const [searching, setSearching] = useState(false);

  /** Looks for the offer Mario sent this client in the site mailboxes and puts its text in the box. */
  const findEmail = async () => {
    setSearching(true);
    setPreview(null);

    try {
      const { data } = await CallCenterService.offerEmail(inquiry.id);

      setPreview(data);

      if (data.found && data.text) {
        setEmail(data.text);
        setEmailSentAt(data.sentAt);
      }
    } catch {
      setPreview({
        configured: true,
        found: false,
        mailbox: null,
        subject: null,
        sentAt: null,
        text: null,
        removed: [],
        searchedMailboxes: 0,
        failedMailboxes: [],
      });
    } finally {
      setSearching(false);
    }
  };

  const toggleOffer = () => {
    const opening = !offerOpen;

    setOfferOpen(opening);

    if (opening) {
      setEmail('');
      setEmailSentAt(null);
      findEmail();
    }
  };
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const run = async (action: () => Promise<unknown>, done: string) => {
    setBusy(true);
    setNotice(null);

    try {
      await action();
      setNotice({ ok: true, text: done });
      onDone();
    } catch (error) {
      const { skipReason, message } = refusal(error);

      setNotice({
        ok: false,
        text: skipReason
          ? t('action.refused', { reason: t(`skip.${skipReason}`, { defaultValue: skipReason }) })
          : (message ?? t('action.failed')),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <CcButton
          kind="fill"
          disabled={busy || inquiry.doNotCall}
          onClick={() =>
            window.confirm(t('action.callNowConfirm')) &&
            run(() => CallCenterService.callNow(inquiry.id), t('action.callNowDone'))
          }
        >
          {t('action.callNow')}
        </CcButton>
        <CcButton
          disabled={busy || !!inquiry.humanTakeoverAt}
          onClick={() =>
            window.confirm(t('action.takeoverConfirm')) &&
            run(() => CallCenterService.humanTakeover(inquiry.id), t('action.takeoverDone'))
          }
        >
          {t('action.takeover')}
        </CcButton>
        <CcButton disabled={busy} onClick={toggleOffer}>
          {t('action.offerSent')}
        </CcButton>
        <CcButton
          kind="red"
          disabled={busy || inquiry.doNotCall}
          onClick={() =>
            window.confirm(t('action.doNotCallConfirm')) &&
            run(() => CallCenterService.doNotCall(inquiry.id), t('action.doNotCallDone'))
          }
        >
          {t('action.doNotCall')}
        </CcButton>
      </Box>
      {offerOpen && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Box sx={{ fontSize: 13, fontWeight: 600 }}>{t('action.offerEmail')}</Box>
          <Box role="status" sx={{ fontSize: 13, color: cc.muted }}>
            {searching && t('action.offerEmailSearching')}
            {!searching && preview && !preview.configured && t('action.offerEmailOff')}
            {!searching &&
              preview?.found &&
              t('action.offerEmailFound', {
                subject: preview.subject ?? '—',
                mailbox: preview.mailbox ?? '—',
                at: formatAt(preview.sentAt),
              })}
            {!searching &&
              preview?.configured &&
              !preview.found &&
              t('action.offerEmailNotFound', { count: preview.searchedMailboxes })}
          </Box>
          {!searching && !!preview?.removed.length && (
            <Box sx={{ fontSize: 13, color: cc.muted }}>
              {t('action.offerEmailRemoved', { names: preview.removed.join(', ') })}
            </Box>
          )}
          {!searching && !!preview?.failedMailboxes.length && (
            <Box sx={{ fontSize: 13, color: cc.red }}>
              {t('action.offerEmailFailed', { mailboxes: preview.failedMailboxes.join(', ') })}
            </Box>
          )}
          <Box
            component="textarea"
            rows={12}
            maxLength={9000}
            aria-label={t('action.offerEmail')}
            placeholder={t('action.offerEmailPlaceholder')}
            value={email}
            disabled={searching}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEmail(e.target.value)}
            sx={textareaSx}
          />
          <Box>
            <CcButton disabled={busy || searching} onClick={findEmail}>
              {t('action.offerEmailRetry')}
            </CcButton>
          </Box>
          <Box
            component="textarea"
            rows={2}
            maxLength={300}
            aria-label={t('action.offerNote')}
            placeholder={t('action.offerNotePlaceholder')}
            value={note}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
            sx={textareaSx}
          />
          <Box>
            <CcButton
              kind="fill"
              disabled={busy || searching}
              onClick={() =>
                run(
                  () => CallCenterService.offerSent(inquiry.id, note, email, emailSentAt),
                  t('action.offerSentDone')
                ).then(() =>
                  setOfferOpen(false)
                )
              }
            >
              {t('action.offerSave')}
            </CcButton>
          </Box>
        </Box>
      )}
      {notice && (
        <Box role="status" sx={{ fontSize: 13, fontWeight: 500, color: notice.ok ? cc.greenInk : cc.red }}>
          {notice.text}
        </Box>
      )}
    </Box>
  );
};
