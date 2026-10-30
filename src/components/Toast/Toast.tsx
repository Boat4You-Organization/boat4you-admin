'use client';

import React, { useEffect } from 'react';

import CloseRounded from '@mui/icons-material/CloseRounded';
import { Box, IconButton, Snackbar } from '@mui/material';

import { bbColors, bbFont, bbShadow } from '@/styles/bb';
import { resetToast } from '@/valtio/global/global.actions';
import { useGlobalStore } from '@/valtio/global/global.store';

// Dark toast with an icon in the semantic colour: bottom-right on desktop, bottom-centre on a phone.
const ICON: Record<string, { bg: string; glyph: string }> = {
  success: { bg: bbColors.green600, glyph: '✓' },
  error: { bg: bbColors.red600, glyph: '!' },
  warning: { bg: bbColors.amber700, glyph: '!' },
  info: { bg: bbColors.navy700, glyph: 'i' },
};

const Toast: React.FC = () => {
  const { toast } = useGlobalStore();

  useEffect(() => {
    if (toast) {
      setTimeout(() => {
        resetToast();
      }, 3000);
    }
  }, [toast]);

  if (!toast) {
    return null;
  }

  const icon = ICON[toast.status] ?? ICON.info;

  return (
    <Snackbar
      open={Boolean(toast)}
      sx={{
        '@media (max-width: 767px)': {
          left: 12,
          right: 12,
          bottom: 16,
          justifyContent: 'center',
        },
      }}
    >
      <Box
        role={toast.status === 'error' ? 'alert' : 'status'}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          width: { xs: '100%', sm: 340 },
          maxWidth: '100%',
          p: '11px 8px 11px 12px',
          borderRadius: '10px',
          backgroundColor: bbColors.navy900,
          color: bbColors.white,
          fontFamily: bbFont.stack,
          fontSize: 13,
          lineHeight: 1.4,
          boxShadow: bbShadow.raised,
        }}
      >
        <Box
          aria-hidden
          sx={{
            flex: 'none',
            width: 18,
            height: 18,
            borderRadius: '50%',
            backgroundColor: icon.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 800,
          }}
        >
          {icon.glyph}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>{toast.text}</Box>
        <IconButton
          size="small"
          aria-label="Close"
          onClick={() => resetToast()}
          sx={{
            color: bbColors.navyDim,
            '&:hover': { color: bbColors.white, backgroundColor: 'rgba(255,255,255,.08)' },
          }}
        >
          <CloseRounded sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>
    </Snackbar>
  );
};

export default Toast;
