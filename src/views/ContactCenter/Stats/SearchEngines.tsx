/* Search engines (F1, backend SearchEngineQuery): Google Search Console and Bing Webmaster Tools next to our organic visits.
 * Same range and site as the rest of Statistics; country and device filter only this section (Bing has neither). The Google
 * query table has its own order and landing page: anything but clicks for the whole site asks /search-engines/queries. */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, TableSortLabel } from '@mui/material';
import dayjs from 'dayjs';

import ContactCenterService from '@/services/contactCenter.service';
import { CcSearchEngines, EngineTotals, SearchQuerySort, SearchQueryStat } from '@/types/contactCenter.type';
import { siteLabel } from '@/utils/contactCenter/safeLink';
import { Bars, Metric, barGrid, cardSx, kpiGrid } from '@/views/ContactCenter/Stats/parts';
import { InfoIcon, LoadAlert, SectionLabel, cc, fieldSx, tableSx } from '@/views/ContactCenter/ui';

const DEVICES = ['DESKTOP', 'TABLET', 'MOBILE'] as const;
/** The markets worth a filter; any other country still counts in "all". */
const COUNTRIES = [
  'US',
  'GB',
  'DE',
  'AT',
  'CH',
  'FR',
  'IT',
  'NL',
  'BE',
  'PL',
  'CZ',
  'SK',
  'HU',
  'SI',
  'HR',
  'SE',
  'NO',
  'DK',
  'ES',
  'CA',
  'AU',
];

/** The sortable columns with their translation key; position starts best first, the rest most first. */
const SORTS: Array<[SearchQuerySort, 'clicks' | 'impressions' | 'ctr' | 'position']> = [
  ['CLICKS', 'clicks'],
  ['IMPRESSIONS', 'impressions'],
  ['CTR', 'ctr'],
  ['POSITION', 'position'],
];
const MIN_IMPRESSIONS = 10; // backend SearchEngineQuery.MIN_IMPRESSIONS

type Sort = { key: SearchQuerySort; asc: boolean };

const BY_CLICKS: Sort = { key: 'CLICKS', asc: false };

const titleSx = { m: 0, fontSize: 14, fontWeight: 700, color: cc.ink } as const;
const sortSx = { color: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', flexDirection: 'row-reverse' } as const;
const ellipsisSx = { maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as const;

const SearchEngines = ({ from, to, siteId }: { from: string; to: string; siteId?: string }) => {
  const { t, i18n } = useTranslation('contactCenter');
  const [country, setCountry] = useState('');
  const [device, setDevice] = useState('');
  const [data, setData] = useState<CcSearchEngines | null>(null);
  const [failed, setFailed] = useState(false);
  const [page, setPage] = useState(''); // `${siteId}|${path}` of the landing page, '' = whole site
  const [pageOf, setPageOf] = useState(siteId);
  const [sort, setSort] = useState<Sort>(BY_CLICKS);
  const [own, setOwn] = useState<{ key: string; rows: SearchQueryStat[] } | null>(null);

  if (pageOf !== siteId) {
    // A page of another site does not fit the new site filter.
    setPageOf(siteId);
    setPage('');
  }

  const cut = page.indexOf('|');
  const pageSite = page ? page.slice(0, cut) : undefined;
  const pagePath = page ? page.slice(cut + 1) : undefined;
  const custom = page !== '' || sort.key !== BY_CLICKS.key || sort.asc !== BY_CLICKS.asc;
  const ownKey = [from, to, siteId, country, device, page, sort.key, sort.asc].join('~');

  useEffect(() => {
    let current = true;

    ContactCenterService.searchEngines({ from, to, siteId, country: country || undefined, device: device || undefined })
      .then(({ data: d }) => {
        if (!current) return;

        setData(d);
        setFailed(false);
      })
      .catch(() => current && setFailed(true));

    return () => {
      current = false;
    };
  }, [from, to, siteId, country, device]);

  useEffect(() => {
    if (!custom) return undefined;

    let current = true;

    ContactCenterService.searchEngineQueries({
      from,
      to,
      siteId: pageSite ?? siteId,
      country: country || undefined,
      device: device || undefined,
      path: pagePath,
      sort: sort.key,
      dir: sort.asc ? 'asc' : 'desc',
    })
      .then(({ data: rows }) => current && setOwn({ key: ownKey, rows }))
      .catch(() => current && setFailed(true));

    return () => {
      current = false;
    };
  }, [custom, ownKey]); // eslint-disable-line react-hooks/exhaustive-deps -- ownKey carries every input

  const fmt = new Intl.NumberFormat(i18n.language);
  const fmt1 = new Intl.NumberFormat(i18n.language, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const countryName = (code: string) => new Intl.DisplayNames([i18n.language], { type: 'region' }).of(code) ?? code;
  const pos = (p: number | null) => (p === null ? '—' : fmt1.format(p));
  const ctr = (x: { clicks: number; impressions: number }) =>
    x.impressions ? `${fmt1.format((x.clicks / x.impressions) * 100)} %` : '—';
  const dayFmt = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'numeric' });
  const day = (d?: string) => (d ? dayFmt.format(dayjs(d).toDate()) : t('searchEngines.none'));
  const engine = (k: string) => t(`searchEngines.engine.${k}`, { defaultValue: k });
  const hidden =
    data && data.google.clicks ? Math.round((1 - data.googleClicksWithQuery / data.google.clicks) * 100) : null;

  const ariaDir = sort.asc ? 'ascending' : 'descending';
  const onSort = (key: SearchQuerySort) =>
    setSort(s => (s.key === key ? { key, asc: !s.asc } : { key, asc: key === 'POSITION' }));
  const pageOptions = data ? data.pages.map(p => ({ siteId: p.siteId, path: p.path })) : [];

  if (pageSite && pagePath && !pageOptions.some(p => p.siteId === pageSite && p.path === pagePath)) {
    pageOptions.unshift({ siteId: pageSite, path: pagePath });
  }

  /** A query table; [sortable] (Google) adds the landing page choice and the column order. */
  const queryTable = (title: string, rows: SearchQueryStat[], sortable = false, pending = false) => (
    <Box sx={{ ...cardSx, mb: '12px', overflowX: 'auto' }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 14px' }}>
        <Box component="h3" sx={titleSx}>
          {title}
        </Box>
        {sortable && (
          <Box
            component="select"
            aria-label={t('searchEngines.page')}
            value={page}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPage(e.target.value)}
            sx={{ ...fieldSx, width: { xs: '100%', sm: 340 } }}
          >
            <option value="">{t('searchEngines.pageAll')}</option>
            {pageOptions.map(p => (
              <option key={`${p.siteId}|${p.path}`} value={`${p.siteId}|${p.path}`}>
                {siteId ? p.path : `${siteLabel(p.siteId)} ${p.path}`}
              </option>
            ))}
          </Box>
        )}
      </Box>
      <Box component="table" sx={{ ...tableSx, opacity: pending ? 0.5 : 1 }}>
        <thead>
          <tr>
            <th>{t('searchEngines.query')}</th>
            {!siteId && <th>{t('filter.site')}</th>}
            {SORTS.map(([key, label]) =>
              sortable ? (
                <th key={key} className="num" aria-sort={sort.key === key ? ariaDir : undefined}>
                  <TableSortLabel
                    active={sort.key === key}
                    direction={(sort.key === key ? sort.asc : key === 'POSITION') ? 'asc' : 'desc'}
                    onClick={() => onSort(key)}
                    sx={sortSx}
                  >
                    {t(`searchEngines.${label}`)}
                  </TableSortLabel>
                </th>
              ) : (
                <th key={key} className="num">
                  {t(`searchEngines.${label}`)}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map(q => (
            <tr key={q.query}>
              <Box component="td" sx={ellipsisSx} title={q.query}>
                {q.query}
              </Box>
              {!siteId && <td className="soft">{q.siteIds.map(siteLabel).join(', ')}</td>}
              <td className="num">{fmt.format(q.clicks)}</td>
              <td className="num">{fmt.format(q.impressions)}</td>
              <td className="num">{ctr(q)}</td>
              <td className="num">{pos(q.position)}</td>
            </tr>
          ))}
        </tbody>
      </Box>
      {!rows.length && <Box sx={{ fontSize: 12.5, color: cc.muted }}>—</Box>}
      {sortable && (sort.key === 'CTR' || sort.key === 'POSITION') && (
        <Box sx={{ fontSize: 12, color: cc.muted, lineHeight: 1.5 }}>
          {t('searchEngines.minImpressions', { n: MIN_IMPRESSIONS })}
        </Box>
      )}
    </Box>
  );

  const totals = (e: EngineTotals | null) => (e ? `${fmt.format(e.clicks)} / ${fmt.format(e.impressions)}` : '—');

  return (
    <Box sx={{ mt: '26px' }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 14px', mb: '10px' }}>
        <SectionLabel>{t('searchEngines.title')}</SectionLabel>
        <Box
          component="select"
          aria-label={t('searchEngines.country')}
          value={country}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCountry(e.target.value)}
          sx={{ ...fieldSx, width: 'auto', minWidth: 170 }}
        >
          <option value="">{t('searchEngines.countryAll')}</option>
          {COUNTRIES.map(c => (
            <option key={c} value={c}>
              {countryName(c)}
            </option>
          ))}
        </Box>
        <Box
          component="select"
          aria-label={t('liveTable.device')}
          value={device}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDevice(e.target.value)}
          sx={{ ...fieldSx, width: 'auto', minWidth: 150 }}
        >
          <option value="">{t('funnel.deviceAll')}</option>
          {DEVICES.map(d => (
            <option key={d} value={d}>
              {t(`funnel.devices.${d}`)}
            </option>
          ))}
        </Box>
      </Box>
      {failed && (
        <Box sx={{ mb: 2 }}>
          <LoadAlert text={t('loadFailed')} />
        </Box>
      )}
      {data && (
        <>
          <Box
            sx={{
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
              p: '10px 14px',
              mb: '12px',
              borderRadius: '10px',
              bgcolor: cc.note,
              color: cc.text,
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            <Box component="span" sx={{ mt: '2px', display: 'flex' }}>
              <InfoIcon />
            </Box>
            <span>
              {t('searchEngines.note', { google: day(data.lastDay.GOOGLE), bing: day(data.lastDay.BING) })}
              {!data.lastDay.GOOGLE && ` ${t('searchEngines.firstImport')}`}
              {hidden !== null && ` ${t('searchEngines.hidden', { n: hidden })}`}
              {!data.bing && ` ${t('searchEngines.bingNoFilter')}`}
            </span>
          </Box>
          <Box sx={{ ...kpiGrid, mb: '12px' }}>
            <Metric label={t('searchEngines.googleClicks')} value={fmt.format(data.google.clicks)} />
            <Metric label={t('searchEngines.googleImpressions')} value={fmt.format(data.google.impressions)} />
            <Metric label={t('searchEngines.googleCtr')} value={ctr(data.google)} />
            <Metric label={t('searchEngines.googlePosition')} value={pos(data.google.position)} />
            <Metric label={t('searchEngines.bingClicks')} value={data.bing ? fmt.format(data.bing.clicks) : '—'} />
            <Metric
              label={t('searchEngines.bingImpressions')}
              value={data.bing ? fmt.format(data.bing.impressions) : '—'}
            />
            <Metric label={t('searchEngines.organicVisits')} value={fmt.format(data.organicVisits)} />
            <Metric
              label={t('searchEngines.organicInquiries')}
              value={fmt.format(data.organicInquiries)}
              color={cc.greenKpi}
            />
          </Box>
          <Box sx={{ ...barGrid, mb: '12px' }}>
            <Bars title={t('searchEngines.byEngine')} rows={data.engines} label={engine} color={cc.searchBar} />
          </Box>
          {!siteId && (
            <Box sx={{ ...cardSx, mb: '12px', overflowX: 'auto' }}>
              <Box component="h3" sx={titleSx}>
                {t('searchEngines.bySite')}
              </Box>
              <Box component="table" sx={tableSx}>
                <thead>
                  <tr>
                    <th>{t('filter.site')}</th>
                    <th className="num">{t('searchEngines.googleShort')}</th>
                    <th className="num">{t('searchEngines.position')}</th>
                    <th className="num">{t('searchEngines.bingShort')}</th>
                    <th className="num">{t('searchEngines.visits')}</th>
                    <th className="num">{t('searchEngines.inquiries')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sites.map(s => (
                    <tr key={s.siteId}>
                      <td className="nowrap">{siteLabel(s.siteId)}</td>
                      <td className="num">{totals(s.google)}</td>
                      <td className="num">{pos(s.google.position)}</td>
                      <td className="num">{totals(s.bing)}</td>
                      <td className="num">{fmt.format(s.organicVisits)}</td>
                      <td className="num">{fmt.format(s.organicInquiries)}</td>
                    </tr>
                  ))}
                </tbody>
              </Box>
            </Box>
          )}
          {queryTable(
            t('searchEngines.googleQueries'),
            custom ? (own?.rows ?? []) : data.googleQueries,
            true,
            custom && own?.key !== ownKey
          )}
          {data.bing && queryTable(t('searchEngines.bingQueries'), data.bingQueries)}
          <Box sx={{ ...cardSx, overflowX: 'auto' }}>
            <Box component="h3" sx={titleSx}>
              {t('searchEngines.pages')}
            </Box>
            <Box component="table" sx={tableSx}>
              <thead>
                <tr>
                  {!siteId && <th>{t('filter.site')}</th>}
                  <th>{t('funnel.path')}</th>
                  <th className="num">{t('searchEngines.clicks')}</th>
                  <th className="num">{t('searchEngines.impressions')}</th>
                  <th className="num">{t('searchEngines.position')}</th>
                  <th>{t('searchEngines.topQueries')}</th>
                  <th className="num">{t('searchEngines.visits')}</th>
                  <th className="num">{t('searchEngines.inquiries')}</th>
                </tr>
              </thead>
              <tbody>
                {data.pages.map(p => (
                  <tr key={`${p.siteId}|${p.path}`}>
                    {!siteId && <td className="soft nowrap">{siteLabel(p.siteId)}</td>}
                    <Box component="td" sx={ellipsisSx} title={p.path}>
                      {p.path}
                    </Box>
                    <td className="num">{fmt.format(p.clicks)}</td>
                    <td className="num">{fmt.format(p.impressions)}</td>
                    <td className="num">{pos(p.position)}</td>
                    <Box component="td" className="soft" sx={ellipsisSx} title={p.queries.join(' · ')}>
                      {p.queries.join(' · ') || '—'}
                    </Box>
                    <td className="num">{fmt.format(p.visits)}</td>
                    <td className="num">{fmt.format(p.inquiries)}</td>
                  </tr>
                ))}
              </tbody>
            </Box>
            {!data.pages.length && <Box sx={{ fontSize: 12.5, color: cc.muted }}>—</Box>}
            <Box sx={{ fontSize: 12, color: cc.muted, lineHeight: 1.5 }}>{t('searchEngines.pagesNote')}</Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default SearchEngines;
