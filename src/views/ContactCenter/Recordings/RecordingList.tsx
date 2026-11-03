/* The recordings list (P6 R2): closed recordings of the last days, newest first, with device, duration, clicks, rage clicks,
 * errors and whether the visit sent an inquiry or chatted. Opened from a conversation it shows that visit's recordings. */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box } from '@mui/material';
import dayjs from 'dayjs';

import ContactCenterService from '@/services/contactCenter.service';
import { RecFilter, RecRow } from '@/types/contactCenter.type';
import { formatClock } from '@/utils/contactCenter/replay';
import { SITE_IDS, siteLabel } from '@/utils/contactCenter/safeLink';
import { SiteChip, formatAt } from '@/views/ContactCenter/common';
import { CcButton, Empty, LoadAlert, Segmented, cc, fieldSx, tableSx } from '@/views/ContactCenter/ui';

const DEVICES = ['DESKTOP', 'TABLET', 'MOBILE'] as const;
const PAGE_TYPES = ['HOME', 'BOAT', 'SEARCH', 'DESTINATION', 'BLOG', 'ITINERARY', 'BOOKING', 'OTHER'] as const;
const PAGE_SIZE = 50;

type Range = 'today' | '7d' | '30d';

const RANGES: Range[] = ['today', '7d', '30d'];

export interface RecScope {
  visitId?: number;
  conversationId?: number;
}

const startOf = (range: Range) =>
  range === 'today' ? dayjs().startOf('day') : dayjs().subtract(range === '7d' ? 7 : 30, 'day');

const pathOf = (url: string | null) => {
  if (!url) return '—';

  try {
    const u = new URL(url);

    return `${u.pathname}${u.search}`;
  } catch {
    return url;
  }
};

const RecordingList = ({
  scope,
  onOpen,
  onClearScope,
}: {
  scope: RecScope;
  onOpen(id: number): void;
  onClearScope(): void;
}) => {
  const { t } = useTranslation('contactCenter');
  const scoped = scope.visitId !== undefined || scope.conversationId !== undefined;
  const [range, setRange] = useState<Range>('7d');
  const [siteId, setSiteId] = useState('');
  const [device, setDevice] = useState('');
  const [pageType, setPageType] = useState('');
  const [rageOnly, setRageOnly] = useState(false);
  const [noInquiry, setNoInquiry] = useState(false);
  const [rows, setRows] = useState<RecRow[] | null>(null);
  const [more, setMore] = useState(false);
  const [failed, setFailed] = useState(false);

  const filter = (): RecFilter => ({
    // From a conversation: the visit's recordings whatever their age (the API allows 400 days back).
    from: (scoped ? dayjs().subtract(399, 'day') : startOf(range)).toISOString(),
    siteId: siteId || undefined,
    device: device || undefined,
    pageType: pageType || undefined,
    rageOnly: rageOnly || undefined,
    noInquiry: noInquiry || undefined,
    visitId: scope.visitId,
    conversationId: scope.conversationId,
    size: PAGE_SIZE,
  });

  useEffect(() => {
    let current = true;

    setRows(null);
    ContactCenterService.recordings(filter())
      .then(({ data }) => {
        if (!current) return;

        setRows(data);
        setMore(data.length === PAGE_SIZE);
        setFailed(false);
      })
      .catch(() => current && setFailed(true));

    return () => {
      current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filter() reads exactly these values
  }, [range, siteId, device, pageType, rageOnly, noInquiry, scope.visitId, scope.conversationId]);

  const loadMore = () => {
    const last = rows?.[rows.length - 1];

    if (!last) return;

    ContactCenterService.recordings({ ...filter(), before: last.startedAt, beforeId: last.id })
      .then(({ data }) => {
        setRows(r => [...(r ?? []), ...data]);
        setMore(data.length === PAGE_SIZE);
      })
      .catch(() => setFailed(true));
  };

  const check = (label: string, on: boolean, set: (v: boolean) => void) => (
    <Box
      component="label"
      sx={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 12.5, color: cc.text }}
    >
      <input type="checkbox" checked={on} onChange={e => set(e.target.checked)} />
      {label}
    </Box>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 14px', mb: '12px' }}>
        {scoped ? (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: 13,
              color: cc.ink,
              fontWeight: 600,
            }}
          >
            {scope.conversationId !== undefined
              ? t('rec.list.conversationScope', { id: scope.conversationId })
              : t('rec.list.visitScope', { id: scope.visitId })}
            <CcButton onClick={onClearScope}>{t('rec.list.clearScope')}</CcButton>
          </Box>
        ) : (
          <Segmented<Range>
            label={t('rangeLabel')}
            value={range}
            onChange={setRange}
            options={RANGES.map(r => ({ value: r, label: t(`range.${r}`) }))}
          />
        )}
        <Box
          component="select"
          aria-label={t('filter.site')}
          value={siteId}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSiteId(e.target.value)}
          sx={{ ...fieldSx, width: 'auto', minWidth: 170 }}
        >
          <option value="">{t('siteAll')}</option>
          {SITE_IDS.map(s => (
            <option key={s} value={s}>
              {siteLabel(s)}
            </option>
          ))}
        </Box>
        <Box
          component="select"
          aria-label={t('rec.list.col.device')}
          value={device}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDevice(e.target.value)}
          sx={{ ...fieldSx, width: 'auto', minWidth: 140 }}
        >
          <option value="">{t('rec.list.deviceAll')}</option>
          {DEVICES.map(d => (
            <option key={d} value={d}>
              {t(`funnel.devices.${d}`)}
            </option>
          ))}
        </Box>
        <Box
          component="select"
          aria-label={t('rec.list.col.page')}
          value={pageType}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPageType(e.target.value)}
          sx={{ ...fieldSx, width: 'auto', minWidth: 160 }}
        >
          <option value="">{t('rec.list.pageTypeAll')}</option>
          {PAGE_TYPES.map(p => (
            <option key={p} value={p}>
              {t(`funnel.pageType.${p}`, { defaultValue: p })}
            </option>
          ))}
        </Box>
        {check(t('rec.list.rageOnly'), rageOnly, setRageOnly)}
        {check(t('rec.list.noInquiry'), noInquiry, setNoInquiry)}
      </Box>
      <Box sx={{ fontSize: 12, color: cc.muted, mb: '10px' }}>{t('rec.player.privacy')}</Box>
      {failed && (
        <Box sx={{ mb: 2 }}>
          <LoadAlert text={t('loadFailed')} />
        </Box>
      )}
      {rows && rows.length === 0 && <Empty>{t('rec.list.empty')}</Empty>}
      {rows && rows.length > 0 && (
        <Box sx={{ overflowX: 'auto' }}>
          <Box component="table" sx={tableSx}>
            <thead>
              <tr>
                <th>{t('rec.list.col.started')}</th>
                <th>{t('rec.list.col.site')}</th>
                <th>{t('rec.list.col.page')}</th>
                <th>{t('rec.list.col.device')}</th>
                <th className="num">{t('rec.list.col.duration')}</th>
                <th className="num">{t('rec.list.col.clicks')}</th>
                <th className="num">{t('rec.list.col.rage')}</th>
                <th className="num">{t('rec.list.col.errors')}</th>
                <th>{t('rec.list.col.inquiry')}</th>
                <th>{t('rec.list.col.chat')}</th>
                <th aria-label={t('rec.list.watch')} />
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatAt(r.startedAt)}</td>
                  <td>
                    <SiteChip siteId={r.siteId} small />
                  </td>
                  <td>
                    <Box
                      component="span"
                      title={r.url ?? undefined}
                      sx={{
                        display: 'inline-block',
                        maxWidth: 320,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {pathOf(r.url)}
                    </Box>
                    {r.pageType && (
                      <Box component="span" sx={{ ml: '6px', color: cc.muted, fontSize: 11.5 }}>
                        {t(`funnel.pageType.${r.pageType}`, { defaultValue: r.pageType })}
                      </Box>
                    )}
                  </td>
                  <td>{t(`funnel.devices.${r.device}`, { defaultValue: r.device })}</td>
                  <td className="num">{formatClock(r.durationMs ?? 0)}</td>
                  <td className="num">{r.clicks}</td>
                  <td className="num" style={r.rageClicks > 0 ? { color: cc.red, fontWeight: 700 } : undefined}>
                    {r.rageClicks}
                  </td>
                  <td className="num" style={r.errors > 0 ? { color: cc.red } : undefined}>
                    {r.errors}
                  </td>
                  <td>{r.inquiry ? '✓' : ''}</td>
                  <td>{r.chat ? '✓' : ''}</td>
                  <td>
                    <CcButton kind="primary" onClick={() => onOpen(r.id)}>
                      {t('rec.list.watch')}
                    </CcButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </Box>
          {more && (
            <Box sx={{ mt: '12px' }}>
              <CcButton onClick={loadMore}>{t('loadMore')}</CcButton>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default RecordingList;
