/* One call: summary, the collected data, the whole transcript with times, the recording, technical data, the inquiry
 * and Mario's actions (design §2.5). Transcript text is rendered as text nodes only. */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';

import { Box } from '@mui/material';

import CallCenterService from '@/services/callCenter.service';
import { CallDetail as CallDetailModel } from '@/types/callCenter.type';
import { SiteChip, linkSx } from '@/views/ContactCenter/common';
import { CcButton, Pill, SectionLabel, Sk, cc, panelSx, scrollSx, tableSx } from '@/views/ContactCenter/ui';

import { InquiryActions, OutcomeChip, StatusChip, formatAt, formatSecs } from './parts';

const padSx = { p: '16px 18px' } as const;

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Box sx={{ display: 'flex', gap: '12px', py: '5px', fontSize: 13, borderBottom: `1px solid ${cc.hair}` }}>
    <Box sx={{ flex: '0 0 44%', color: cc.muted }}>{label}</Box>
    <Box sx={{ flex: 1, minWidth: 0, color: cc.ink, wordBreak: 'break-word' }}>{children}</Box>
  </Box>
);

const Recording = ({ id }: { id: number }) => {
  const { t } = useTranslation('callCenter');
  const [url, setUrl] = useState<string | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'failed'>('idle');
  const made = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (made.current) window.URL.revokeObjectURL(made.current);
    },
    []
  );

  const load = () => {
    setState('loading');
    CallCenterService.audio(id)
      .then(({ data }) => {
        made.current = window.URL.createObjectURL(data);
        setUrl(made.current);
        setState('idle');
      })
      .catch(() => setState('failed'));
  };

  if (url) {
    return (
      <Box component="audio" controls autoPlay src={url} aria-label={t('detail.recording')} sx={{ width: '100%' }} />
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <CcButton disabled={state === 'loading'} onClick={load}>
        {state === 'loading' ? t('detail.recordingLoading') : t('detail.recordingLoad')}
      </CcButton>
      {state === 'failed' && (
        <Box role="alert" sx={{ fontSize: 13, color: cc.red }}>
          {t('detail.recordingFailed')}
        </Box>
      )}
    </Box>
  );
};

const CallDetail = ({ id }: { id: number }) => {
  const { t } = useTranslation('callCenter');
  const [detail, setDetail] = useState<CallDetailModel | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [reload, setReload] = useState(0);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    let current = true;

    CallCenterService.call(id)
      .then(({ data }) => {
        if (!current) return;

        setDetail(data);
        setState('ready');
      })
      // The interceptor rejects with the response body only, so a 404 and a network error look the same here.
      .catch(() => current && setState('missing'));

    return () => {
      current = false;
    };
  }, [id, reload]);

  const back = (
    <Box component={RouterLink} to="/call-center/calls" sx={{ ...linkSx, fontSize: 13, fontWeight: 600 }}>
      ← {t('detail.back')}
    </Box>
  );

  if (state !== 'ready' || !detail) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {back}
        {state === 'loading' && <Sk h={220} w="100%" r={14} />}
        {state === 'missing' && (
          <Box sx={{ ...panelSx, ...padSx, color: cc.muted, fontSize: 14 }}>{t('detail.missing')}</Box>
        )}
      </Box>
    );
  }

  const { call, inquiry } = detail;
  const value = (v: unknown): string => {
    if (v === true) return t('yes');

    if (v === false) return t('no');

    return typeof v === 'object' ? JSON.stringify(v) : String(v);
  };
  const collected = Object.entries(detail.data ?? {}).filter(([, v]) => v !== null && v !== undefined && v !== '');
  const quality = Object.entries(detail.quality ?? {});
  const transcript = detail.transcript ?? [];
  const isTask = call.kind === 'HUMAN_CALLBACK' && call.status !== 'DONE' && call.status !== 'CANCELLED';

  const resolve = () => {
    setResolving(true);
    CallCenterService.resolve(call.id)
      .then(() => setReload(n => n + 1))
      .finally(() => setResolving(false));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {back}
      <Box component="section" sx={{ ...panelSx, ...padSx }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 12px' }}>
          <Box component="h2" sx={{ m: 0, fontSize: 18, fontWeight: 800, color: cc.ink }}>
            {call.clientName || `#${call.inquiryId}`}
          </Box>
          <StatusChip status={call.status} />
          <OutcomeChip outcome={call.outcome} />
          {call.qualityFailed && <Pill colors={[cc.redBg, cc.red]}>{t('calls.quality')}</Pill>}
          {call.site && <SiteChip siteId={call.site} />}
          {isTask && (
            <CcButton kind="fill" disabled={resolving} onClick={resolve} sx={{ ml: 'auto' }}>
              {t('action.resolve')}
            </CcButton>
          )}
        </Box>
        <Box className="tnum" sx={{ mt: '6px', fontSize: 13, color: cc.text }}>
          {[
            call.kind ? t(`kind.${call.kind}`, { defaultValue: call.kind }) : null,
            formatAt(call.startedAt ?? call.scheduledAt),
            call.durationSecs !== null ? formatSecs(call.durationSecs) : null,
            call.phone,
            call.language?.toUpperCase(),
          ]
            .filter(Boolean)
            .join(' · ')}
        </Box>
        {call.skipReason && (
          <Box sx={{ mt: '6px', fontSize: 13, color: cc.muted }}>
            {t('detail.skipped', { reason: t(`skip.${call.skipReason}`, { defaultValue: call.skipReason }) })}
          </Box>
        )}
        {call.summary && (
          <Box sx={{ mt: '12px', maxWidth: 900, fontSize: 14, lineHeight: 1.55, color: cc.ink }}>{call.summary}</Box>
        )}
      </Box>

      <Box
        sx={{ display: 'grid', gap: '14px', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.5fr) minmax(0, 1fr)' } }}
      >
        <Box component="section" sx={{ ...panelSx, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ ...padSx, pb: '10px' }}>
            <SectionLabel>{t('detail.transcript')}</SectionLabel>
          </Box>
          {detail.hasAudio && (
            <Box sx={{ px: '18px', pb: '12px' }}>
              <Recording id={call.id} />
            </Box>
          )}
          <Box sx={{ ...scrollSx, maxHeight: { lg: 640 }, px: '18px', pb: '18px' }}>
            {!transcript.length && <Box sx={{ fontSize: 13, color: cc.muted }}>{t('detail.noTranscript')}</Box>}
            <Box
              component="ol"
              sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              {transcript.map((turn, index) => {
                const nika = turn.role !== 'user';

                return (
                  // eslint-disable-next-line react/no-array-index-key -- a transcript never reorders
                  <Box component="li" key={index} sx={{ alignSelf: nika ? 'flex-start' : 'flex-end', maxWidth: '86%' }}>
                    <Box
                      className="tnum"
                      sx={{ mb: '3px', fontSize: 11.5, color: cc.muted, textAlign: nika ? 'left' : 'right' }}
                    >
                      {nika ? t('detail.nika') : t('detail.client')} · {formatSecs(turn.time_in_call_secs ?? 0)}
                    </Box>
                    <Box
                      sx={{
                        p: '9px 12px',
                        borderRadius: '12px',
                        bgcolor: nika ? cc.softer : cc.tagBg,
                        border: `1px solid ${cc.hair}`,
                        fontSize: 13.5,
                        lineHeight: 1.5,
                        color: cc.ink,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {turn.message || '…'}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>
          <Box component="section" sx={{ ...panelSx, ...padSx }}>
            <SectionLabel sx={{ mb: '8px' }}>{t('detail.actions')}</SectionLabel>
            <InquiryActions inquiry={inquiry} onDone={() => setReload(n => n + 1)} />
          </Box>

          <Box component="section" sx={{ ...panelSx, ...padSx }}>
            <SectionLabel sx={{ mb: '6px' }}>{t('detail.collected')}</SectionLabel>
            {!collected.length && <Box sx={{ fontSize: 13, color: cc.muted }}>{t('detail.noData')}</Box>}
            {collected.map(([key, v]) => (
              <Row key={key} label={t(`data.${key}`, { defaultValue: key })}>
                {value(v)}
              </Row>
            ))}
          </Box>

          <Box component="section" sx={{ ...panelSx, ...padSx }}>
            <SectionLabel sx={{ mb: '6px' }}>{t('detail.inquiry')}</SectionLabel>
            <Row label={t('inq.received')}>{formatAt(inquiry.createdAt)}</Row>
            <Row label={t('detail.email')}>{inquiry.email ?? '—'}</Row>
            <Row label={t('detail.phone')}>{inquiry.phoneE164 ?? inquiry.phone ?? '—'}</Row>
            <Row label={t('inq.boat')}>{inquiry.yachtLabel ?? '—'}</Row>
            <Row label={t('detail.dates')}>
              {inquiry.dateFrom
                ? `${formatAt(inquiry.dateFrom, 'DD.MM.YYYY.')} – ${formatAt(inquiry.dateTo, 'DD.MM.YYYY.')}`
                : '—'}
            </Row>
            <Row label={t('inq.consent')}>
              {inquiry.contactConsent ? t('yes') : t('no')}
              {inquiry.consentTextVersion ? ` (${inquiry.consentTextVersion})` : ''}
            </Row>
            {inquiry.doNotCall && <Row label={t('inq.doNotCall')}>{t('yes')}</Row>}
            {inquiry.humanTakeoverAt && <Row label={t('inq.takenOver')}>{formatAt(inquiry.humanTakeoverAt)}</Row>}
            {inquiry.offerSentAt && (
              <Row label={t('inq.offerSent')}>
                {formatAt(inquiry.offerSentAt)}
                {inquiry.offerNote ? ` · ${inquiry.offerNote}` : ''}
              </Row>
            )}
            {inquiry.message && (
              <Box sx={{ mt: '10px', fontSize: 13, color: cc.text, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {inquiry.message}
              </Box>
            )}
          </Box>

          {!!quality.length && (
            <Box component="section" sx={{ ...panelSx, ...padSx }}>
              <SectionLabel sx={{ mb: '6px' }}>{t('detail.quality')}</SectionLabel>
              {quality.map(([key, q]) => (
                <Box key={key} sx={{ py: '6px', borderBottom: `1px solid ${cc.hair}`, fontSize: 13 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Pill colors={q?.result === 'success' ? [cc.greenBg, cc.greenInk] : [cc.redBg, cc.red]}>
                      {q?.result ?? '—'}
                    </Pill>
                    <Box sx={{ color: cc.ink, fontWeight: 600 }}>{t(`criterion.${key}`, { defaultValue: key })}</Box>
                  </Box>
                  {q?.rationale && <Box sx={{ mt: '4px', color: cc.text }}>{q.rationale}</Box>}
                </Box>
              ))}
            </Box>
          )}

          <Box component="section" sx={{ ...panelSx, ...padSx }}>
            <SectionLabel sx={{ mb: '6px' }}>{t('detail.technical')}</SectionLabel>
            <Row label={t('detail.termination')}>{detail.terminationReason ?? '—'}</Row>
            <Row label={t('detail.cost')}>{detail.costCredits ?? '—'}</Row>
            <Row label={t('detail.conversationId')}>{detail.conversationId ?? '—'}</Row>
            <Row label={t('detail.callSid')}>{detail.callSid ?? '—'}</Row>
          </Box>
        </Box>
      </Box>

      {detail.calls.length > 1 && (
        <Box component="section" sx={panelSx}>
          <Box sx={{ ...padSx, pb: '8px' }}>
            <SectionLabel>{t('detail.otherCalls')}</SectionLabel>
          </Box>
          <Box sx={{ overflowX: 'auto' }}>
            <Box component="table" sx={{ ...tableSx, minWidth: 640 }}>
              <tbody>
                {detail.calls.map(c => (
                  <tr key={c.id}>
                    <td className="nowrap tnum">
                      {c.id === call.id ? (
                        <Box component="span" sx={{ fontWeight: 700 }}>
                          {formatAt(c.startedAt ?? c.scheduledAt)}
                        </Box>
                      ) : (
                        <Box component={RouterLink} to={`/call-center/calls/${c.id}`} sx={linkSx}>
                          {formatAt(c.startedAt ?? c.scheduledAt)}
                        </Box>
                      )}
                    </td>
                    <td className="soft">{c.kind ? t(`kind.${c.kind}`, { defaultValue: c.kind }) : '—'}</td>
                    <td>
                      <StatusChip status={c.status} />
                    </td>
                    <td>
                      <OutcomeChip outcome={c.outcome} />
                    </td>
                    <td className="num">{formatSecs(c.durationSecs)}</td>
                  </tr>
                ))}
              </tbody>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CallDetail;
