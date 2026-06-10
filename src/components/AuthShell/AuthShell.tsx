import React from 'react';

import { Box, Stack, Typography } from '@mui/material';

import Layout from '@/components/Layout';
import { bbColors, bbFont, bbShadow } from '@/styles/bb';

interface AuthShellProps {
  children: React.ReactNode;
}

/**
 * Split-screen shell shared by the auth pages (login, signup, password
 * flows): left = white form column with the brand row, right = navy brand
 * panel (hidden below md). Submit buttons inside get the yellow Broker
 * Desk CTA via a scoped override so the form components stay untouched.
 */
const AuthShell: React.FC<AuthShellProps> = ({ children }) => (
  <Layout>
    <Box sx={{ display: 'flex', minHeight: '100vh', fontFamily: bbFont.stack, backgroundColor: bbColors.white }}>
      <Box
        sx={{
          flex: '1 1 50%',
          display: 'flex',
          flexDirection: 'column',
          px: { xs: 3, sm: 6 },
          py: { xs: 3, sm: 4 },
          '& .MuiButton-contained': {
            backgroundColor: bbColors.yellow500,
            color: bbColors.yellowText,
            boxShadow: bbShadow.yellowCta,
            fontWeight: 800,
            borderRadius: '8px',
            '&:hover': { backgroundColor: '#f7c83d', boxShadow: bbShadow.yellowCta },
            '&:active': { backgroundColor: '#efbe2f' },
            '&.Mui-disabled': { backgroundColor: '#f6e8bd', color: '#a08a45', boxShadow: 'none' },
          },
          '& a': { color: bbColors.navy700, fontWeight: 600 },
        }}
      >
        <Stack direction="row" alignItems="center" gap={1.25}>
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: '7px',
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
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: '100%', maxWidth: 420, mx: 'auto', py: 5 }}>{children}</Box>
        </Box>
      </Box>
      <Box
        sx={{
          flex: '1 1 50%',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: bbColors.navy900,
          position: 'relative',
          overflow: 'hidden',
          px: 8,
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '13px',
            backgroundColor: bbColors.yellow500,
            color: bbColors.yellowText,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 22,
            letterSpacing: '-0.02em',
          }}
        >
          B4
        </Box>
        <Typography sx={{ color: bbColors.white, fontSize: 30, fontWeight: 800, mt: 3, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
          Broker Desk
        </Typography>
        <Typography sx={{ color: bbColors.navyDim, fontSize: 15, mt: 1, maxWidth: 380, lineHeight: 1.6 }}>
          Bookings, offers, invoices and the fleet — one desk for the whole charter day.
        </Typography>
        <Box sx={{ position: 'absolute', left: 64, right: 64, bottom: 64 }}>
          <Box sx={{ height: 3, borderRadius: '2px', backgroundColor: '#1a4fa8', width: '72%' }} />
          <Box sx={{ height: 3, borderRadius: '2px', backgroundColor: '#16406e', width: '52%', mt: 1.5 }} />
          <Box sx={{ height: 3, borderRadius: '2px', backgroundColor: '#122f4e', width: '62%', mt: 1.5 }} />
        </Box>
      </Box>
    </Box>
  </Layout>
);

export default AuthShell;
