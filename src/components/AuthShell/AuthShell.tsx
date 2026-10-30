import React from 'react';

import { Box, Stack, Typography } from '@mui/material';

import Layout from '@/components/Layout';
import { bbColors, bbFont, bbTexture } from '@/styles/bb';

interface AuthShellProps {
  children: React.ReactNode;
}

/**
 * Split-screen shell shared by the auth pages (login, signup, password
 * flows): left = white form column with the brand row, right = navy brand
 * panel (hidden below md; on a phone a textured banner sits on top
 * instead). Submit buttons are the themed yellow primary.
 */
const AuthShell: React.FC<AuthShellProps> = ({ children }) => (
  <Layout>
    <Box sx={{ display: 'flex', minHeight: '100vh', fontFamily: bbFont.stack, backgroundColor: bbColors.white }}>
      <Box
        sx={{
          flex: '1 1 50%',
          display: 'flex',
          flexDirection: 'column',
          px: { xs: 2.5, sm: 6 },
          py: { xs: 0, sm: 4 },
          '& a': { color: bbColors.navy700, fontWeight: 600 },
        }}
      >
        {/* Phone: textured banner with the B4 tile, flush with the screen edges. */}
        <Box
          sx={{
            display: { xs: 'flex', sm: 'none' },
            flexDirection: 'column',
            justifyContent: 'flex-end',
            gap: 1,
            mx: -2.5,
            mb: 1,
            p: '24px 20px 18px',
            minHeight: 148,
            background: bbTexture.chart,
            color: bbColors.white,
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              boxShadow: 'inset 0 -2px 0 rgba(59,41,0,.16)',
              backgroundColor: bbColors.yellow500,
              color: bbColors.yellowText,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 12,
            }}
          >
            B4
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: 16, color: bbColors.white }}>Broker Desk</Typography>
        </Box>
        <Stack direction="row" alignItems="center" gap={1.25} sx={{ display: { xs: 'none', sm: 'flex' } }}>
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: '8px',
              boxShadow: 'inset 0 -2px 0 rgba(59,41,0,.16)',
              backgroundColor: bbColors.yellow500,
              color: bbColors.yellowText,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: '-0.02em',
            }}
          >
            B4
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: 14, color: bbColors.navy900 }}>
            boat4you
            <Box component="span" sx={{ color: bbColors.gray500, fontWeight: 500 }}>
              {' · Broker Desk'}
            </Box>
          </Typography>
        </Stack>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' } }}>
          <Box sx={{ width: '100%', maxWidth: 420, mx: 'auto', py: { xs: 3, sm: 5 } }}>{children}</Box>
        </Box>
      </Box>
      {/* Brand panel: aerial islands photo on navy, text bottom-left on a dark fade (hidden below md). */}
      <Box
        sx={{
          flex: '1 1 50%',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'flex-end',
          background: `linear-gradient(180deg, rgba(11,26,43,0) 45%, rgba(11,26,43,.85) 100%), ${bbColors.navy900} url('/images/brand/islands-hero.webp') center / cover no-repeat`,
          position: 'relative',
          overflow: 'hidden',
          px: 8,
          pb: 8,
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '12px',
            backgroundColor: bbColors.yellow500,
            color: bbColors.yellowText,
            boxShadow: 'inset 0 -2px 0 rgba(59,41,0,.16)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 17,
          }}
        >
          B4
        </Box>
        <Typography
          sx={{
            color: bbColors.white,
            fontSize: 34,
            fontWeight: 800,
            mt: 2.5,
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
          }}
        >
          Broker Desk
        </Typography>
        <Typography sx={{ color: bbColors.navyMist, fontSize: 15, mt: 1, maxWidth: 380, lineHeight: 1.6 }}>
          Bookings, offers, invoices and the fleet — one desk for the whole charter day.
        </Typography>
      </Box>
    </Box>
  </Layout>
);

export default AuthShell;
