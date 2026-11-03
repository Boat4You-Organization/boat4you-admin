/* Inquiry funnel, exit pages and top clicks (P6 R0, backend FunnelQuery): where visitors who consented stop before an
 * inquiry. Same range and site as the rest of Statistics; device and source filter only this section. */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box } from '@mui/material';

import ContactCenterService from '@/services/contactCenter.service';
import { CcFunnel, FunnelClick } from '@/types/contactCenter.type';
import { exitRate, funnelRows } from '@/utils/contactCenter/funnel';
import { siteLabel } from '@/utils/contactCenter/safeLink';
import { Bars, barGrid, cardSx } from '@/views/ContactCenter/Stats/parts';
import { PageLink, SiteChip } from '@/views/ContactCenter/common';
import { LoadAlert, SectionLabel, cc, fieldSx, tableSx } from '@/views/ContactCenter/ui';

const DEVICES = ['DESKTOP', 'TABLET', 'MOBILE'] as const;
const NAV_AREAS: Array<FunnelClick['area']> = ['gallery', 'slider', 'nav', 'header', 'footer'];
const CHANNELS = ['ORGANIC', 'ADS', 'SISTER', 'DIRECT', 'REFERRAL', 'SOCIAL', 'EMAIL', 'OTHER'];

const titleSx = { m: 0, fontSize: 14, fontWeight: 700, color: cc.ink } as const;
const ellipsisSx = { maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as const;

const Funnel = ({ from, to, siteId }: { from: string; to: string; siteId?: string }) => {
  const { t } = useTranslation('contactCenter');
  const [device, setDevice] = useState('');
  const [channel, setChannel] = useState('');
  const [data, setData] = useState<CcFunnel | null>(null);
  const [failed, setFailed] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    let current = true;

    ContactCenterService.funnel({ from, to, siteId, device: device || undefined, channel: channel || undefined })
      .then(({ data: d }) => {
        if (!current) return;

        setData(d);
        setFailed(false);
      })
      .catch(() => current && setFailed(true));

    return () => {
      current = false;
    };
  }, [from, to, siteId, device, channel]);

  const pageType = (k: string) => t(`funnel.pageType.${k}`, { defaultValue: k });

  // Gallery, slider and menu clicks fold into one collapsed group so the CTAs lead the list.
  const clicks = data?.clicks ?? [];
  const isNav = (c: FunnelClick) => !!c.area && NAV_AREAS.includes(c.area);
  const ctaClicks = clicks.filter(c => !isNav(c));
  const navClicks = clicks.filter(isNav);

  const clickRow = (c: FunnelClick) => (
    <tr key={`${c.pageType}|${c.label}|${c.kind ?? ''}|${c.area ?? ''}`}>
      <td className="soft nowrap">{pageType(c.pageType)}</td>
      <Box component="td" className="soft" sx={{ ...ellipsisSx, maxWidth: 280 }} title={c.path ?? undefined}>
        {!siteId && c.siteId && (
          <Box component="span" sx={{ mr: '6px' }}>
            <SiteChip siteId={c.siteId} small />
          </Box>
        )}
        {c.siteId ? <PageLink siteId={c.siteId} path={c.path} /> : (c.path ?? '—')}
      </Box>
      <Box component="td" sx={ellipsisSx} title={c.label}>
        {c.label}
        {c.kind && (
          <Box component="span" sx={{ ml: '6px', fontSize: 11.5, color: cc.muted }}>
            {`(${t(`funnel.kind.${c.kind}`)})`}
          </Box>
        )}
      </Box>
      <Box component="td" className="soft" sx={{ ...ellipsisSx, maxWidth: 220 }} title={c.target ?? undefined}>
        {c.target || '—'}
      </Box>
      <td className="num nowrap">
        {c.clicks}
        {(c.pages ?? 0) > 1 && (
          <Box component="span" sx={{ ml: '6px', fontSize: 11.5, color: cc.muted }}>
            {t('funnel.onPages', { count: c.pages })}
          </Box>
        )}
      </td>
    </tr>
  );

  return (
    <Box sx={{ mt: '26px' }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 14px', mb: '10px' }}>
        <SectionLabel>{t('funnel.title')}</SectionLabel>
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
        <Box
          component="select"
          aria-label={t('liveTable.source')}
          value={channel}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setChannel(e.target.value)}
          sx={{ ...fieldSx, width: 'auto', minWidth: 170 }}
        >
          <option value="">{t('funnel.channelAll')}</option>
          {CHANNELS.map(c => (
            <option key={c} value={c}>
              {t(`channel.${c}`, { defaultValue: c })}
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
          <Box sx={{ ...cardSx, gap: '12px', mb: '12px' }}>
            {funnelRows(data.steps).map(r => (
              <Box
                key={r.key}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) auto',
                  gap: '4px 12px',
                  alignItems: 'baseline',
                }}
              >
                <Box component="span" sx={{ fontSize: 13, fontWeight: 600, color: cc.ink }}>
                  {t(`funnel.steps.${r.key}`, { defaultValue: r.key })}
                </Box>
                <Box component="span" sx={{ fontSize: 12.5, color: cc.text, fontVariantNumeric: 'tabular-nums' }}>
                  <Box component="strong" sx={{ fontSize: 15, color: cc.ink, mr: '8px' }}>
                    {r.value}
                  </Box>
                  {r.ofVisits !== null && t('funnel.ofVisits', { n: r.ofVisits })}
                  {r.drop !== null && (
                    <Box component="span" sx={{ ml: '8px', color: r.drop > 0 ? cc.red : cc.muted }}>
                      {`−${r.drop} %`}
                    </Box>
                  )}
                </Box>
                <Box sx={{ gridColumn: '1 / -1', height: 10, borderRadius: '5px', bgcolor: cc.hover }}>
                  <Box sx={{ height: 10, borderRadius: '5px', bgcolor: cc.searchBar, width: `${r.ofVisits ?? 0}%` }} />
                </Box>
              </Box>
            ))}
            <Box sx={{ fontSize: 12.5, color: cc.text }}>{t('funnel.chatOpened', { count: data.chatOpened })}</Box>
            <Box sx={{ fontSize: 12, color: cc.muted, lineHeight: 1.5 }}>{t('funnel.note')}</Box>
          </Box>
          <Box sx={{ ...barGrid, mb: '12px' }}>
            <Bars title={t('funnel.exitsByType')} rows={data.exitsByType} label={pageType} color={cc.red} />
          </Box>
          <Box sx={{ ...cardSx, mb: '12px', overflowX: 'auto' }}>
            <Box component="h3" sx={titleSx}>
              {t('funnel.exitPages')}
            </Box>
            <Box component="table" sx={tableSx}>
              <thead>
                <tr>
                  {!siteId && <th>{t('filter.site')}</th>}
                  <th>{t('funnel.path')}</th>
                  <th>{t('funnel.type')}</th>
                  <th className="num">{t('funnel.views')}</th>
                  <th className="num">{t('funnel.exits')}</th>
                  <th className="num">{t('funnel.exitRate')}</th>
                </tr>
              </thead>
              <tbody>
                {data.exits.map(e => (
                  <tr key={`${e.siteId}|${e.path}`}>
                    {!siteId && <td className="soft nowrap">{siteLabel(e.siteId)}</td>}
                    <Box component="td" sx={ellipsisSx} title={e.path}>
                      {e.path}
                    </Box>
                    <td className="soft nowrap">{pageType(e.pageType)}</td>
                    <td className="num">{e.views}</td>
                    <td className="num">{e.exits}</td>
                    <td className="num">{exitRate(e.exits, e.views) ?? '—'} %</td>
                  </tr>
                ))}
              </tbody>
            </Box>
            {!data.exits.length && <Box sx={{ fontSize: 12.5, color: cc.muted }}>—</Box>}
          </Box>
          <Box sx={{ ...cardSx, overflowX: 'auto' }}>
            <Box component="h3" sx={titleSx}>
              {t('funnel.clicks')}
            </Box>
            <Box component="table" sx={tableSx}>
              <thead>
                <tr>
                  <th>{t('funnel.type')}</th>
                  <th>{t('funnel.path')}</th>
                  <th>{t('funnel.element')}</th>
                  <th>{t('funnel.target')}</th>
                  <th className="num">{t('funnel.clickCount')}</th>
                </tr>
              </thead>
              <tbody>
                {ctaClicks.map(clickRow)}
                {navClicks.length > 0 && (
                  <tr className="click" onClick={() => setNavOpen(o => !o)}>
                    <Box component="td" colSpan={5} sx={{ fontWeight: 600, color: cc.text }}>
                      {`${navOpen ? '▾' : '▸'} ${t('funnel.navGroup', { count: navClicks.length })}`}
                      <Box component="span" sx={{ ml: '8px', fontWeight: 400, fontSize: 12, color: cc.muted }}>
                        {t('funnel.navGroupHint')}
                      </Box>
                    </Box>
                  </tr>
                )}
                {navOpen && navClicks.map(clickRow)}
              </tbody>
            </Box>
            {!data.clicks.length && <Box sx={{ fontSize: 12.5, color: cc.muted }}>—</Box>}
          </Box>
        </>
      )}
    </Box>
  );
};

export default Funnel;
