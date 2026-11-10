import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

import { Box, Typography } from '@mui/material';

import Layout from '@/components/Layout';
import { bbColors, bbFont, bbTabSx, bbTabsTrackSx } from '@/styles/bb';

import BookingPaymentsTab from './partials/BookingPaymentsTab';
import LinkPaymentsTab from './partials/LinkPaymentsTab';
import MolliePaymentDetailsModal from './partials/MolliePaymentDetailsModal';

/**
 * Payments (Mollie): card payments of online bookings and payments through the secret /pay link.
 * The tab lives in `?tab=bookings|link`. A link without `tab` but with `?q=` opens the link tab:
 * the office notification e-mail for /pay payments links here as `/custom-payments?q=<reference>`.
 */

const PAGE_TABS = ['bookings', 'link'] as const;

type PageTab = (typeof PAGE_TABS)[number];

const CustomPayments = () => {
  const { t } = useTranslation('custom-payments');
  const [searchParams, setSearchParams] = useSearchParams();
  const [detailsId, setDetailsId] = useState<string | null>(null);

  const tabParam = searchParams.get('tab');
  let tab: PageTab = 'bookings';

  if (tabParam === 'link' || (!tabParam && searchParams.has('q'))) tab = 'link';

  const onTab = (next: PageTab) => {
    if (next === tab) return;

    // The search belongs to one list: switching tabs starts the other list unfiltered.
    setSearchParams({ tab: next }, { replace: true });
  };

  return (
    <>
      <MolliePaymentDetailsModal paymentId={detailsId} onClose={() => setDetailsId(null)} />
      <Layout>
        <Box
          sx={{
            backgroundColor: bbColors.gray50,
            minHeight: '100vh',
            fontFamily: bbFont.stack,
            color: bbColors.navy900,
            pt: '74px',
            pb: 4,
            px: { xs: 2, sm: 3 },
          }}
        >
          {/* Page head */}
          <Box sx={{ mb: 2 }}>
            <Typography component="h1" sx={{ fontSize: { xs: 20, sm: 22 }, fontWeight: 800, letterSpacing: '-0.01em' }}>
              {t('title')}
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: bbColors.gray500, mt: 0.5 }}>
              {t(tab === 'bookings' ? 'subtitleBookings' : 'subtitle')}
            </Typography>
          </Box>

          <Box role="tablist" sx={{ ...bbTabsTrackSx, mb: 1.75 }}>
            {PAGE_TABS.map(id => (
              <Box
                key={id}
                component="button"
                type="button"
                role="tab"
                aria-selected={id === tab}
                onClick={() => onTab(id)}
                sx={bbTabSx(id === tab)}
              >
                {t(id === 'bookings' ? 'tabBookings' : 'tabLink')}
              </Box>
            ))}
          </Box>

          {tab === 'bookings' ? (
            <BookingPaymentsTab key="bookings" onDetails={setDetailsId} />
          ) : (
            <LinkPaymentsTab key="link" onDetails={setDetailsId} />
          )}
        </Box>
      </Layout>
    </>
  );
};

export default CustomPayments;
