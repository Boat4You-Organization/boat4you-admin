import React, { JSX } from 'react';

import CloseRounded from '@mui/icons-material/CloseRounded';
import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace';
import { Box, Button, ButtonProps, DialogProps, IconButton, Stack, SwipeableDrawer, Typography } from '@mui/material';

import { bbColors, bbFont, bbShadow } from '@/styles/bb';

import styles from './SwipeableModal.module.scss';

interface SwipeableModalProps extends DialogProps {
  hideTitle?: boolean;
  title: string | undefined;
  onClose: () => void;
  description?: string;
  onConfirm?: () => void;
  confirmBtnText?: string;
  ConfirmBtnProps?: ButtonProps;
  hideConfirmButton?: boolean;
  onCancel?: () => void;
  cancelBtnText?: string;
  CancelBtnProps?: ButtonProps;
  hideCancelButton?: boolean;
  titleActions?: JSX.Element | null;
  icon?: React.ReactNode;
  customButton?: React.ReactNode;
  scrollRef?: React.Ref<HTMLDivElement>;
  arrowBack?: boolean;
  onBack?: () => void;
  removePadding?: boolean;
  zIndex?: number;
}

const SwipeableModal = ({
  hideTitle,
  open,
  title,
  onClose,
  description,
  onConfirm,
  confirmBtnText = 'Confirm',
  ConfirmBtnProps,
  hideConfirmButton = false,
  onCancel,
  cancelBtnText = 'Cancel',
  CancelBtnProps,
  hideCancelButton = false,
  titleActions,
  customButton,
  arrowBack,
  onBack,
  removePadding,
  zIndex = 1300,
  children,
}: SwipeableModalProps) => (
  <SwipeableDrawer
    anchor="bottom"
    open={open}
    onClose={onClose}
    onOpen={onClose}
    keepMounted
    title={title}
    disableScrollLock={false}
    sx={{
      '&.MuiDrawer-root': {
        zIndex,
      },
      '.MuiDrawer-paper ': {
        borderTopLeftRadius: '16px',
        borderTopRightRadius: '16px',
        border: `1px solid ${bbColors.gray200}`,
        borderBottom: 0,
        boxShadow: bbShadow.sheet,
        fontFamily: bbFont.stack,
        color: bbColors.navy900,
        maxHeight: '80dvh',
        overflowY: 'hidden',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
      },
    }}
  >
    {!hideTitle && (
      <>
        <Box className={styles.puller} />
        <Stack
          component="div"
          direction="row"
          justifyContent="space-between"
          alignItems={description ? 'flex-start' : 'center'}
          borderBottom={`1px solid ${bbColors.gray100}`}
          className={styles.swipeableContainer}
          sx={{ flexShrink: 0, '&&': { borderTop: 0, padding: '18px 8px 12px 16px' } }}
        >
          {arrowBack && (
            <IconButton size="large" onClick={onBack} sx={{ color: bbColors.gray500 }}>
              <KeyboardBackspaceIcon />
            </IconButton>
          )}
          <Stack sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.01em', color: bbColors.navy900 }}>
              {title}
            </Typography>
            {description && <Typography sx={{ fontSize: 12, color: bbColors.gray500 }}>{description}</Typography>}
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            {titleActions && <Box flex="none">{titleActions}</Box>}
            <IconButton size="large" onClick={onClose} aria-label={cancelBtnText} sx={{ color: bbColors.gray500 }}>
              <CloseRounded />
            </IconButton>
          </Stack>
        </Stack>
      </>
    )}

    <Box
      sx={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        minHeight: 0,

        '@media (max-width: 768px)': {
          padding: removePadding ? '0px' : '16px',
        },
      }}
    >
      {children}
    </Box>
    {(!hideCancelButton || !hideConfirmButton) && (
      <Stack
        direction="column"
        spacing={1}
        className={styles.swipeableContainer}
        sx={{ flexShrink: 0, '&&': { padding: '12px 16px 16px', borderTopColor: bbColors.gray100 } }}
      >
        {customButton ? (
          <Box sx={{ width: '100%' }}>{customButton}</Box>
        ) : (
          !hideConfirmButton && (
            <Button onClick={onConfirm} fullWidth size="large" {...ConfirmBtnProps}>
              {confirmBtnText}
            </Button>
          )
        )}
        {!hideCancelButton && (
          <Button onClick={onCancel} size="large" variant="outlined" fullWidth {...CancelBtnProps}>
            {cancelBtnText}
          </Button>
        )}
      </Stack>
    )}
  </SwipeableDrawer>
);

export default SwipeableModal;
