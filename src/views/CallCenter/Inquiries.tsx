/* Upiti: the inquiries Nika can call, with consent, the last call and the next scheduled one. A row opens Mario's
 * actions (call now, I will call, offer sent, do not call). */
import { Fragment, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box } from '@mui/material';

import CallCenterService from '@/services/callCenter.service';
import { CallInquiryListItem, Paged } from '@/types/callCenter.type';
import { SITE_IDS, siteLabel } from '@/utils/contactCenter/safeLink';
import { SiteChip } from '@/views/ContactCenter/common';
import { CcButton, LoadAlert, Pill, SearchField, cc, fieldSx, panelSx, tableSx } from '@/views/ContactCenter/ui';

import { InquiryActions, OutcomeChip, StatusChip, formatAt } from './parts';

const SIZE = 50;

const Inquiries = () => {
  const { t } = useTranslation('callCenter');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [site, setSite] = useState('');
  const [page, setPage] = useState(0);
  const [reload, setReload] = useState(0);
  const [openId, setOpenId] = useState<number | null>(null);
  const [data, setData] = useState<Paged<CallInquiryListItem> | null>(null);
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

    CallCenterService.inquiries({ q: query, site, page, size: SIZE })
      .then(({ data: body }) => {
        if (!current) return;

        setData(body);
        setFailed(false);
      })
      .catch(() => current && setFailed(true));

    return () => {
      current = false;
    };
  }, [query, site, page, reload]);

  const rows = data?.content ?? [];
  const totalPages = data?.page.totalPages ?? 0;

  return (
    <Box component="section" sx={panelSx}>
      <Box
        sx={{ display: 'flex', flexWrap: 'wrap', gap: '10px', p: '14px 16px', borderBottom: `1px solid ${cc.hair}` }}
      >
        <SearchField
          value={q}
          onChange={setQ}
          placeholder={t('inq.search')}
          label={t('inq.search')}
          sx={{ flex: '1 1 320px' }}
        />
        <Box
          component="select"
          aria-label={t('filter.site')}
          value={site}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            setSite(e.target.value);
            setPage(0);
          }}
          sx={{ ...fieldSx, flex: '0 1 220px' }}
        >
          <option value="">{t('filter.site')}</option>
          {SITE_IDS.map(s => (
            <option key={s} value={s}>
              {siteLabel(s)}
            </option>
          ))}
        </Box>
      </Box>
      {failed && (
        <Box sx={{ p: '12px 16px' }}>
          <LoadAlert text={t('loadFailed')} />
        </Box>
      )}
      <Box sx={{ overflowX: 'auto' }}>
        <Box component="table" sx={{ ...tableSx, minWidth: 1080 }}>
          <thead>
            <tr>
              <th>{t('inq.received')}</th>
              <th>{t('inq.contact')}</th>
              <th>{t('inq.boat')}</th>
              <th>{t('inq.consent')}</th>
              <th>{t('inq.lastCall')}</th>
              <th>{t('inq.next')}</th>
              <th aria-label={t('inq.actions')} />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ inquiry: i, lastCallStatus, lastOutcome, nextScheduledAt }) => (
              <Fragment key={i.id}>
                <tr>
                  <td className="nowrap tnum">{formatAt(i.createdAt)}</td>
                  <td>
                    <Box sx={{ fontWeight: 600, color: cc.ink, wordBreak: 'break-all' }}>{i.email ?? '—'}</Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', mt: '3px' }}>
                      <Box component="span" className="tnum" sx={{ fontSize: 12, color: cc.text }}>
                        {i.phoneE164 ?? i.phone ?? '—'}
                      </Box>
                      {i.site && <SiteChip siteId={i.site} small />}
                      {i.locale && (
                        <Box component="span" sx={{ fontSize: 11.5, color: cc.muted, textTransform: 'uppercase' }}>
                          {i.locale}
                        </Box>
                      )}
                    </Box>
                  </td>
                  <td className="soft">
                    <Box>{i.yachtLabel ?? '—'}</Box>
                    {i.dateFrom && (
                      <Box className="tnum" sx={{ fontSize: 12, color: cc.muted }}>
                        {formatAt(i.dateFrom, 'DD.MM.YYYY.')} – {formatAt(i.dateTo, 'DD.MM.YYYY.')}
                      </Box>
                    )}
                  </td>
                  <td>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      <Pill colors={i.contactConsent ? [cc.greenBg, cc.greenInk] : undefined}>
                        {i.contactConsent ? t('inq.consentYes') : t('inq.consentNo')}
                      </Pill>
                      {i.doNotCall && <Pill colors={[cc.redBg, cc.red]}>{t('inq.doNotCall')}</Pill>}
                      {i.humanTakeoverAt && <Pill>{t('inq.takenOver')}</Pill>}
                      {i.offerSentAt && <Pill>{t('inq.offerSent')}</Pill>}
                    </Box>
                  </td>
                  <td>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      <StatusChip status={lastCallStatus} />
                      {lastOutcome && <OutcomeChip outcome={lastOutcome} />}
                    </Box>
                  </td>
                  <td className="nowrap tnum soft">{formatAt(nextScheduledAt)}</td>
                  <td className="nowrap">
                    <CcButton
                      aria-expanded={openId === i.id}
                      onClick={() => setOpenId(id => (id === i.id ? null : i.id))}
                      sx={{ minHeight: 30 }}
                    >
                      {t('inq.actions')}
                    </CcButton>
                  </td>
                </tr>
                {openId === i.id && (
                  <tr>
                    <td colSpan={7} style={{ background: cc.softer }}>
                      {i.message && (
                        <Box sx={{ mb: '10px', maxWidth: 820, color: cc.text, whiteSpace: 'pre-wrap' }}>
                          {i.message}
                        </Box>
                      )}
                      <InquiryActions inquiry={i} onDone={() => setReload(n => n + 1)} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </Box>
        {data && !rows.length && (
          <Box sx={{ p: '32px 16px', textAlign: 'center', fontSize: 13, color: cc.muted }}>{t('inq.empty')}</Box>
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

export default Inquiries;
