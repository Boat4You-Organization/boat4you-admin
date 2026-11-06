/* Search engines (F1, backend SearchEngineQuery): Google Search Console and Bing Webmaster Tools next to our organic visits.
 * Same range and site as the rest of Statistics; country and device filter only this section (Bing has neither). Each query
 * table has its own site, order and (Google only) landing page: anything but clicks for all sites asks /search-engines/queries.
 * The landing pages have their own site too, and a page opens to its Google queries with each query's own position. */
import { Fragment, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, TableSortLabel } from '@mui/material';
import dayjs from 'dayjs';

import ContactCenterService from '@/services/contactCenter.service';
import { CcSearchEngines, EngineTotals, SearchQuerySort, SearchQueryStat } from '@/types/contactCenter.type';
import { SITE_IDS, siteLabel } from '@/utils/contactCenter/safeLink';
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
const PATH_MAX = 1000; // backend SearchText.PATH_MAX: a longer page (our tracker's) has no Google rows anyway

type Sort = { key: SearchQuerySort; asc: boolean };
type Engine = 'GOOGLE' | 'BING';
type Filters = { from: string; to: string; siteId?: string; country: string; device: string };

const BY_CLICKS: Sort = { key: 'CLICKS', asc: false };

const titleSx = { m: 0, fontSize: 14, fontWeight: 700, color: cc.ink } as const;
const sortSx = { color: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', flexDirection: 'row-reverse' } as const;
const ellipsisSx = { maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as const;
const headSx = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 14px' } as const;
const PAGE_QUERIES = 15; // the queries an opened landing page shows

/** Number formats of the section. */
const useFormats = () => {
  const { i18n } = useTranslation('contactCenter');
  const fmt = new Intl.NumberFormat(i18n.language);
  const fmt1 = new Intl.NumberFormat(i18n.language, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  return {
    fmt,
    pos: (p: number | null) => (p === null ? '—' : fmt1.format(p)),
    ctr: (x: { clicks: number; impressions: number }) =>
      x.impressions ? `${fmt1.format((x.clicks / x.impressions) * 100)} %` : '—',
  };
};

/** The table's own site: all sites, or one when the section has no site of its own. */
const SiteSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const { t } = useTranslation('contactCenter');

  return (
    <Box
      component="select"
      aria-label={t('filter.site')}
      value={value}
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
      sx={{ ...fieldSx, width: 'auto', minWidth: 190 }}
    >
      <option value="">{t('searchEngines.siteAll')}</option>
      {SITE_IDS.map(s => (
        <option key={s} value={s}>
          {siteLabel(s)}
        </option>
      ))}
    </Box>
  );
};

/**
 * One query table (Google or Bing) with its own site, order and, for Google, landing page; [base] are the section's rows for
 * all sites by clicks, any other choice asks the backend.
 */
const QueryTable = ({
  engine,
  title,
  base,
  filters,
  pages,
}: {
  engine: Engine;
  title: string;
  base: SearchQueryStat[];
  filters: Filters;
  pages: Array<{ siteId: string; path: string }>;
}) => {
  const { t } = useTranslation('contactCenter');
  const { fmt, pos, ctr } = useFormats();
  const { from, to, siteId, country, device } = filters;
  const google = engine === 'GOOGLE';
  const [site, setSite] = useState(''); // the table's own site, '' = all (only without the section's site)
  const [page, setPage] = useState(''); // `${siteId}|${path}` of the landing page, '' = whole site
  const [siteOf, setSiteOf] = useState(siteId);
  const [sort, setSort] = useState<Sort>(BY_CLICKS);
  // The table's own answer, tagged with the request it belongs to; failed = that request failed (the section stays).
  const [own, setOwn] = useState<{ key: string; rows: SearchQueryStat[]; failed?: boolean } | null>(null);

  if (siteOf !== siteId) {
    // A site or page of another site does not fit the new site filter.
    setSiteOf(siteId);
    setSite('');
    setPage('');
  }

  const cut = page.indexOf('|');
  const pageSite = page ? page.slice(0, cut) : undefined;
  const pagePath = page ? page.slice(cut + 1) : undefined;
  const tableSite = pageSite ?? (siteId || site || undefined);
  const custom = page !== '' || site !== '' || sort.key !== BY_CLICKS.key || sort.asc !== BY_CLICKS.asc;
  const ownKey = [engine, from, to, siteId, country, device, site, page, sort.key, sort.asc].join('~');

  useEffect(() => {
    if (!custom) return undefined;

    let current = true;

    ContactCenterService.searchEngineQueries({
      engine,
      from,
      to,
      siteId: tableSite,
      country: (google && country) || undefined,
      device: (google && device) || undefined,
      path: pagePath,
      sort: sort.key,
      dir: sort.asc ? 'asc' : 'desc',
    })
      .then(({ data: rows }) => current && setOwn({ key: ownKey, rows }))
      .catch(() => current && setOwn({ key: ownKey, rows: [], failed: true }));

    return () => {
      current = false;
    };
  }, [custom, ownKey]); // eslint-disable-line react-hooks/exhaustive-deps -- ownKey carries every input

  const rows = custom ? (own?.rows ?? []) : base;
  const pending = custom && own?.key !== ownKey;
  const broken = custom && own?.key === ownKey && !!own.failed;
  const ariaDir = sort.asc ? 'ascending' : 'descending';
  const onSort = (key: SearchQuerySort) =>
    setSort(s => (s.key === key ? { key, asc: !s.asc } : { key, asc: key === 'POSITION' }));
  const pageOptions = pages.filter(p => !site || p.siteId === site);

  if (pageSite && pagePath && !pageOptions.some(p => p.siteId === pageSite && p.path === pagePath)) {
    pageOptions.unshift({ siteId: pageSite, path: pagePath });
  }

  return (
    <Box sx={{ ...cardSx, mb: '12px', overflowX: 'auto' }}>
      <Box sx={headSx}>
        <Box component="h3" sx={titleSx}>
          {title}
        </Box>
        {!siteId && (
          <SiteSelect
            value={site}
            onChange={v => {
              setSite(v);
              setPage('');
            }}
          />
        )}
        {google && (
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
                {siteId || site ? p.path : `${siteLabel(p.siteId)} ${p.path}`}
              </option>
            ))}
          </Box>
        )}
      </Box>
      <Box component="table" sx={{ ...tableSx, opacity: pending ? 0.5 : 1 }}>
        <thead>
          <tr>
            <th>{t('searchEngines.query')}</th>
            {!tableSite && <th>{t('filter.site')}</th>}
            {SORTS.map(([key, label]) => (
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
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(q => (
            <tr key={q.query}>
              <Box component="td" sx={ellipsisSx} title={q.query}>
                {q.query}
              </Box>
              {!tableSite && <td className="soft">{q.siteIds.map(siteLabel).join(', ')}</td>}
              <td className="num">{fmt.format(q.clicks)}</td>
              <td className="num">{fmt.format(q.impressions)}</td>
              <td className="num">{ctr(q)}</td>
              <td className="num">{pos(q.position)}</td>
            </tr>
          ))}
        </tbody>
      </Box>
      {broken && <LoadAlert text={t('loadFailed')} />}
      {!rows.length && !broken && !pending && <Box sx={{ fontSize: 12.5, color: cc.muted }}>—</Box>}
      {(sort.key === 'CTR' || sort.key === 'POSITION') && (
        <Box sx={{ fontSize: 12, color: cc.muted, lineHeight: 1.5 }}>
          {t('searchEngines.minImpressions', { n: MIN_IMPRESSIONS })}
        </Box>
      )}
      {!google && <Box sx={{ fontSize: 12, color: cc.muted, lineHeight: 1.5 }}>{t('searchEngines.bingNoPage')}</Box>}
    </Box>
  );
};

/** One landing page opened: its Google queries, each with its own clicks, impressions and position. */
const PageQueries = ({
  filters,
  siteId,
  path,
  span,
}: {
  filters: Filters;
  siteId: string;
  path: string;
  span: number;
}) => {
  const { t } = useTranslation('contactCenter');
  const { fmt, pos, ctr } = useFormats();
  const { from, to, country, device } = filters;
  const [rows, setRows] = useState<SearchQueryStat[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let current = true;

    ContactCenterService.searchEngineQueries({
      engine: 'GOOGLE',
      from,
      to,
      siteId,
      country: country || undefined,
      device: device || undefined,
      path,
    })
      .then(({ data }) => current && setRows(data))
      .catch(() => current && setFailed(true));

    return () => {
      current = false;
    };
  }, [from, to, siteId, country, device, path]);

  return (
    <tr>
      <Box component="td" colSpan={span} sx={{ bgcolor: cc.hover, py: '10px !important' }}>
        {failed && <LoadAlert text={t('loadFailed')} />}
        {!rows && !failed && <Box sx={{ fontSize: 12.5, color: cc.muted }}>…</Box>}
        {rows && !rows.length && <Box sx={{ fontSize: 12.5, color: cc.muted }}>{t('searchEngines.pageNoQueries')}</Box>}
        {rows && rows.length > 0 && (
          <Box component="table" sx={tableSx}>
            <thead>
              <tr>
                <th>{t('searchEngines.query')}</th>
                <th className="num">{t('searchEngines.clicks')}</th>
                <th className="num">{t('searchEngines.impressions')}</th>
                <th className="num">{t('searchEngines.ctr')}</th>
                <th className="num">{t('searchEngines.position')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, PAGE_QUERIES).map(q => (
                <tr key={q.query}>
                  <Box component="td" sx={ellipsisSx} title={q.query}>
                    {q.query}
                  </Box>
                  <td className="num">{fmt.format(q.clicks)}</td>
                  <td className="num">{fmt.format(q.impressions)}</td>
                  <td className="num">{ctr(q)}</td>
                  <td className="num">{pos(q.position)}</td>
                </tr>
              ))}
            </tbody>
          </Box>
        )}
      </Box>
    </tr>
  );
};

/** The landing pages with their own site; [base] are the section's pages, another site asks /search-engines for its own. */
const LandingPages = ({ base, filters }: { base: CcSearchEngines['pages']; filters: Filters }) => {
  const { t } = useTranslation('contactCenter');
  const { fmt, pos } = useFormats();
  const { from, to, siteId, country, device } = filters;
  const [site, setSite] = useState('');
  const [siteOf, setSiteOf] = useState(siteId);
  const [open, setOpen] = useState(''); // `${siteId}|${path}` of the opened page
  const [own, setOwn] = useState<{ key: string; pages: CcSearchEngines['pages']; failed?: boolean } | null>(null);

  if (siteOf !== siteId) {
    setSiteOf(siteId);
    setSite('');
    setOpen('');
  }

  const ownKey = [from, to, country, device, site].join('~');

  useEffect(() => {
    if (!site) return undefined;

    let current = true;

    ContactCenterService.searchEngines({
      from,
      to,
      siteId: site,
      country: country || undefined,
      device: device || undefined,
    })
      .then(({ data }) => current && setOwn({ key: ownKey, pages: data.pages }))
      .catch(() => current && setOwn({ key: ownKey, pages: [], failed: true }));

    return () => {
      current = false;
    };
  }, [site, ownKey]); // eslint-disable-line react-hooks/exhaustive-deps -- ownKey carries every input

  const pages = site ? (own?.pages ?? []) : base;
  const pending = !!site && own?.key !== ownKey;
  const oneSite = !!(siteId || site);
  const span = oneSite ? 7 : 8;

  return (
    <Box sx={{ ...cardSx, overflowX: 'auto' }}>
      <Box sx={headSx}>
        <Box component="h3" sx={titleSx}>
          {t('searchEngines.pages')}
        </Box>
        {!siteId && (
          <SiteSelect
            value={site}
            onChange={v => {
              setSite(v);
              setOpen('');
            }}
          />
        )}
      </Box>
      <Box component="table" sx={{ ...tableSx, opacity: pending ? 0.5 : 1 }}>
        <thead>
          <tr>
            {!oneSite && <th>{t('filter.site')}</th>}
            <th>{t('funnel.path')}</th>
            <th className="num">{t('searchEngines.clicks')}</th>
            <th className="num">{t('searchEngines.impressions')}</th>
            <th className="num">{t('searchEngines.avgPosition')}</th>
            <th>{t('searchEngines.topQueries')}</th>
            <th className="num">{t('searchEngines.visits')}</th>
            <th className="num">{t('searchEngines.inquiries')}</th>
          </tr>
        </thead>
        <tbody>
          {pages.map(p => {
            const key = `${p.siteId}|${p.path}`;
            const opens = p.path.length <= PATH_MAX;

            return (
              <Fragment key={key}>
                <tr
                  className={opens ? 'click' : undefined}
                  onClick={() => opens && setOpen(o => (o === key ? '' : key))}
                >
                  {!oneSite && <td className="soft nowrap">{siteLabel(p.siteId)}</td>}
                  <Box component="td" sx={ellipsisSx} title={p.path}>
                    {opens && `${open === key ? '▾' : '▸'} `}
                    {p.path}
                  </Box>
                  <td className="num">{p.impressions ? fmt.format(p.clicks) : '—'}</td>
                  <td className="num">{p.impressions ? fmt.format(p.impressions) : '—'}</td>
                  <td className="num">{pos(p.position)}</td>
                  <Box component="td" className="soft" sx={ellipsisSx} title={p.queries.join(' · ')}>
                    {p.queries.join(' · ') || '—'}
                  </Box>
                  <td className="num">{fmt.format(p.visits)}</td>
                  <td className="num">{fmt.format(p.inquiries)}</td>
                </tr>
                {open === key && <PageQueries filters={filters} siteId={p.siteId} path={p.path} span={span} />}
              </Fragment>
            );
          })}
        </tbody>
      </Box>
      {site && own?.key === ownKey && own.failed && <LoadAlert text={t('loadFailed')} />}
      {!pages.length && !pending && <Box sx={{ fontSize: 12.5, color: cc.muted }}>—</Box>}
      <Box sx={{ fontSize: 12, color: cc.muted, lineHeight: 1.5 }}>{t('searchEngines.pagesNote')}</Box>
    </Box>
  );
};

const SearchEngines = ({ from, to, siteId }: { from: string; to: string; siteId?: string }) => {
  const { t, i18n } = useTranslation('contactCenter');
  const { fmt, pos, ctr } = useFormats();
  const [country, setCountry] = useState('');
  const [device, setDevice] = useState('');
  const [data, setData] = useState<CcSearchEngines | null>(null);
  const [failed, setFailed] = useState(false);

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

  const filters: Filters = { from, to, siteId, country, device };
  const countryName = (code: string) => new Intl.DisplayNames([i18n.language], { type: 'region' }).of(code) ?? code;
  const dayFmt = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'numeric' });
  const day = (d?: string) => (d ? dayFmt.format(dayjs(d).toDate()) : t('searchEngines.none'));
  const engine = (k: string) => t(`searchEngines.engine.${k}`, { defaultValue: k });
  const hidden =
    data && data.google.clicks ? Math.round((1 - data.googleClicksWithQuery / data.google.clicks) * 100) : null;
  const pageOptions = data
    ? data.pages.filter(p => p.path.length <= PATH_MAX).map(p => ({ siteId: p.siteId, path: p.path }))
    : [];
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
          <QueryTable
            engine="GOOGLE"
            title={t('searchEngines.googleQueries')}
            base={data.googleQueries}
            filters={filters}
            pages={pageOptions}
          />
          {data.bing && (
            <QueryTable
              engine="BING"
              title={t('searchEngines.bingQueries')}
              base={data.bingQueries}
              filters={filters}
              pages={[]}
            />
          )}
          <LandingPages base={data.pages} filters={filters} />
        </>
      )}
    </Box>
  );
};

export default SearchEngines;
