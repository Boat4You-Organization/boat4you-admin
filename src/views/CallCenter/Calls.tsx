/* Pozivi: every call row (dialled by Nika, scheduled, skipped, or a callback task for Mario), newest first. */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Box } from '@mui/material';
import dayjs from 'dayjs';

import CallCenterService from '@/services/callCenter.service';
import { CALL_KINDS, CALL_OUTCOMES, CALL_STATUSES, CallListItem, Paged } from '@/types/callCenter.type';
import { CALL_SITE_KEYS, callSiteId } from '@/utils/callCenter/callSite';
import { siteLabel } from '@/utils/contactCenter/safeLink';
import { SiteChip } from '@/views/ContactCenter/common';
import { CcButton, LoadAlert, Pill, SearchField, cc, fieldSx, panelSx, tableSx } from '@/views/ContactCenter/ui';

import { OutcomeChip, StatusChip, formatAt, formatSecs } from './parts';

const SIZE = 50;

const Calls = () => {
  const { t } = useTranslation('callCenter');
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [outcome, setOutcome] = useState('');
  const [site, setSite] = useState('');
  const [kind, setKind] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<Paged<CallListItem> | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setQuery(q.trim());
      setPage(0);
    }, 400);

    return () => window.clearTimeout(id);
  }, [q]);

  useEffect(() => {
    let current = true;

    CallCenterService.calls({
      q: query,
      status,
      outcome,
      site,
      kind,
      from: from ? dayjs(from).startOf('day').toISOString() : undefined,
      to: to ? dayjs(to).endOf('day').toISOString() : undefined,
      page,
      size: SIZE,
    })
      .then(({ data: body }) => {
        if (!current) return;

        setData(body);
        setFailed(false);
      })
      .catch(() => current && setFailed(true));

    return () => {
      current = false;
    };
  }, [query, status, outcome, site, kind, from, to, page]);

  const select = (
    label: string,
    value: string,
    set: (v: string) => void,
    options: { value: string; text: string }[]
  ) => (
    <Box
      component="select"
      aria-label={label}
      value={value}
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
        set(e.target.value);
        setPage(0);
      }}
      sx={{ ...fieldSx, flex: '0 1 170px' }}
    >
      <option value="">{label}</option>
      {options.map(o => (
        <option key={o.value} value={o.value}>
          {o.text}
        </option>
      ))}
    </Box>
  );

  const date = (label: string, value: string, set: (v: string) => void) => (
    <Box
      component="input"
      type="date"
      aria-label={label}
      title={label}
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        set(e.target.value);
        setPage(0);
      }}
      sx={{ ...fieldSx, flex: '0 1 150px' }}
    />
  );

  const rows = data?.content ?? [];
  const totalPages = data?.page.totalPages ?? 0;
  const open = (id: number) => navigate(`/call-center/calls/${id}`);

  return (
    <Box component="section" sx={panelSx}>
      <Box
        sx={{ display: 'flex', flexWrap: 'wrap', gap: '10px', p: '14px 16px', borderBottom: `1px solid ${cc.hair}` }}
      >
        <SearchField
          value={q}
          onChange={setQ}
          placeholder={t('calls.search')}
          label={t('calls.search')}
          sx={{ flex: '1 1 260px' }}
        />
        {select(
          t('filter.status'),
          status,
          setStatus,
          CALL_STATUSES.map(s => ({ value: s, text: t(`status.${s}`) }))
        )}
        {select(
          t('filter.outcome'),
          outcome,
          setOutcome,
          CALL_OUTCOMES.map(o => ({ value: o, text: t(`outcome.${o}`) }))
        )}
        {select(
          t('filter.kind'),
          kind,
          setKind,
          CALL_KINDS.map(k => ({ value: k, text: t(`kind.${k}`) }))
        )}
        {select(
          t('filter.site'),
          site,
          setSite,
          CALL_SITE_KEYS.map(s => ({ value: s, text: siteLabel(callSiteId(s)) }))
        )}
        {date(t('filter.from'), from, setFrom)}
        {date(t('filter.to'), to, setTo)}
      </Box>
      {failed && (
        <Box sx={{ p: '12px 16px' }}>
          <LoadAlert text={t('loadFailed')} />
        </Box>
      )}
      <Box sx={{ overflowX: 'auto' }}>
        <Box component="table" sx={{ ...tableSx, minWidth: 1120 }}>
          <thead>
            <tr>
              <th>{t('calls.when')}</th>
              <th>{t('calls.client')}</th>
              <th>{t('calls.kind')}</th>
              <th>{t('calls.status')}</th>
              <th>{t('calls.outcome')}</th>
              <th className="num">{t('calls.duration')}</th>
              <th>{t('calls.summary')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(c => (
              <tr key={c.id} className="click" onClick={() => open(c.id)}>
                <td className="nowrap tnum">
                  <Box
                    component="a"
                    href={`/call-center/calls/${c.id}`}
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      open(c.id);
                    }}
                    sx={{ color: cc.ink, fontWeight: 600, textDecoration: 'none' }}
                  >
                    {formatAt(c.startedAt ?? c.scheduledAt)}
                  </Box>
                  {!c.startedAt && c.scheduledAt && (
                    <Box sx={{ fontSize: 11.5, color: cc.muted }}>{t('calls.scheduled')}</Box>
                  )}
                </td>
                <td>
                  <Box sx={{ fontWeight: 600, color: cc.ink }}>{c.clientName || `#${c.inquiryId}`}</Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', mt: '3px' }}>
                    <Box component="span" className="tnum" sx={{ fontSize: 12, color: cc.text }}>
                      {c.phone ?? '—'}
                    </Box>
                    {c.site && <SiteChip siteId={callSiteId(c.site)} small />}
                    {c.language && (
                      <Box component="span" sx={{ fontSize: 11.5, color: cc.muted, textTransform: 'uppercase' }}>
                        {c.language}
                      </Box>
                    )}
                  </Box>
                </td>
                <td className="soft nowrap">
                  {c.kind ? t(`kind.${c.kind}`, { defaultValue: c.kind }) : '—'}
                  {c.attempt > 1 && (
                    <Box component="span" sx={{ color: cc.muted }}>{` · ${t('calls.attempt', { n: c.attempt })}`}</Box>
                  )}
                </td>
                <td>
                  <StatusChip status={c.status} />
                  {c.skipReason && (
                    <Box sx={{ mt: '3px', fontSize: 11.5, color: cc.muted }}>
                      {t(`skip.${c.skipReason}`, { defaultValue: c.skipReason })}
                    </Box>
                  )}
                </td>
                <td>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    <OutcomeChip outcome={c.outcome} />
                    {c.qualityFailed && (
                      <Pill title={t('calls.qualityHint')} colors={[cc.redBg, cc.red]}>
                        {t('calls.quality')}
                      </Pill>
                    )}
                  </Box>
                </td>
                <td className="num">{formatSecs(c.durationSecs)}</td>
                <td className="soft">
                  <Box
                    sx={{
                      maxWidth: 420,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {c.summary ?? '—'}
                  </Box>
                </td>
              </tr>
            ))}
          </tbody>
        </Box>
        {data && !rows.length && (
          <Box sx={{ p: '32px 16px', textAlign: 'center', fontSize: 13, color: cc.muted }}>{t('calls.empty')}</Box>
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', p: '12px 16px' }}>
        <CcButton disabled={page === 0} onClick={() => setPage(p => p - 1)}>
          ← {t('prev')}
        </CcButton>
        <Box component="span" sx={{ fontSize: 13, color: cc.text2 }}>
          {t('pageOf', { page: page + 1, pages: Math.max(totalPages, 1), total: data?.page.totalElements ?? 0 })}
        </Box>
        <CcButton disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}>
          {t('next')} →
        </CcButton>
      </Box>
    </Box>
  );
};

export default Calls;
