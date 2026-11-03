/* "What to fix" (P6 R3): the strongest findings of a site and device over the last 30 days — dead and rage clicks, elements
 * the visitors who sent an inquiry click far more, how many get as far as the inquiry button, pages whose lower half is
 * rarely seen — each with a link to its heatmap. */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Box } from '@mui/material';
import dayjs from 'dayjs';

import ContactCenterService from '@/services/contactCenter.service';
import { RecInsight } from '@/types/contactCenter.type';
import { elementLabel } from '@/utils/contactCenter/heatmap';
import { SITE_IDS, siteLabel } from '@/utils/contactCenter/safeLink';
import { CcButton, Empty, LoadAlert, cc, fieldSx } from '@/views/ContactCenter/ui';

const DEVICES = ['MOBILE', 'DESKTOP', 'TABLET'] as const;
const DAYS = 30;

const InsightsView = () => {
  const { t } = useTranslation('contactCenter');
  const navigate = useNavigate();
  const [siteId, setSiteId] = useState('boat4you');
  const [device, setDevice] = useState('MOBILE');
  const [rows, setRows] = useState<RecInsight[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let current = true;

    setRows(null);
    ContactCenterService.insights({ siteId, device, from: dayjs().subtract(DAYS, 'day').toISOString() })
      .then(({ data }) => {
        if (!current) return;

        setRows(data);
        setFailed(false);
      })
      .catch(() => current && setFailed(true));

    return () => {
      current = false;
    };
  }, [siteId, device]);

  const page = (p: string) => t(`funnel.pageType.${p}`, { defaultValue: p });

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 14px', mb: '12px' }}>
        <Box
          component="select"
          aria-label={t('filter.site')}
          value={siteId}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSiteId(e.target.value)}
          sx={{ ...fieldSx, width: 'auto', minWidth: 170 }}
        >
          {SITE_IDS.map(s => (
            <option key={s} value={s}>
              {siteLabel(s)}
            </option>
          ))}
        </Box>
        <Box
          component="select"
          aria-label={t('rec.heat.device')}
          value={device}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDevice(e.target.value)}
          sx={{ ...fieldSx, width: 'auto', minWidth: 130 }}
        >
          {DEVICES.map(d => (
            <option key={d} value={d}>
              {t(`funnel.devices.${d}`)}
            </option>
          ))}
        </Box>
        <Box component="span" sx={{ fontSize: 12.5, color: cc.muted }}>
          {t('range.30d')}
        </Box>
      </Box>
      {failed && <LoadAlert text={t('loadFailed')} />}
      {rows && rows.length === 0 && <Empty>{t('rec.ins.empty')}</Empty>}
      {rows && rows.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {rows.map(r => (
            <Box
              key={`${r.kind}|${r.pageType}|${r.hash ?? ''}`}
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '8px 14px',
                p: '12px 14px',
                bgcolor: '#FFFFFF',
                border: `1px solid ${cc.border}`,
                borderRadius: '10px',
              }}
            >
              <Box sx={{ flex: '1 1 420px', fontSize: 13.5, color: cc.ink, lineHeight: 1.5 }}>
                {t(`rec.ins.kind.${r.kind}`, {
                  label: elementLabel(r),
                  page: page(r.pageType),
                  count: r.count,
                  percent: r.percent ?? 0,
                })}
                <Box component="span" sx={{ ml: '8px', fontSize: 12, color: cc.muted }}>
                  {t('rec.ins.pageViews', { count: r.pageViews })}
                </Box>
              </Box>
              <CcButton
                onClick={() =>
                  navigate(`/contact-center/recording?siteId=${siteId}&pageType=${r.pageType}&device=${device}`)
                }
              >
                {t('rec.ins.openHeatmap')}
              </CcButton>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default InsightsView;
