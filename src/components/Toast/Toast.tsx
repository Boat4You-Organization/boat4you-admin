'use client';

import React, { useEffect } from 'react';

import { Alert, Snackbar } from '@mui/material';

import { resetToast } from '@/valtio/global/global.actions';
import { useGlobalStore } from '@/valtio/global/global.store';

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

  return (
    <Snackbar open={Boolean(toast)}>
      <Alert severity={toast?.status}>{toast?.text}</Alert>
    </Snackbar>
  );
};

export default Toast;
