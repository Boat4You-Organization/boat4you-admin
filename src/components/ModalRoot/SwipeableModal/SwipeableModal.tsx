import React, { JSX } from 'react';

import CloseRounded from '@mui/icons-material/CloseRounded';
import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace';
import { Box, Button, ButtonProps, DialogProps, IconButton, Stack, SwipeableDrawer, Typography } from '@mui/material';

import colors from '@/styles/themes/colors';

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
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px',
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
          borderBottom={`1px solid ${colors.black200}`}
          className={styles.swipeableContainer}
          sx={{ flexShrink: 0 }}
        >
          {arrowBack && (
            <IconButton size="large" onClick={onBack} sx={{ color: colors.black400 }}>
              <KeyboardBackspaceIcon />
            </IconButton>
          )}
          <Stack>
            <Typography variant="h2">{title}</Typography>
            {description && (
              <Typography variant="body1" color={colors.blue500}>
                {description}
              </Typography>
            )}
          </Stack>
          <Stack direction="row" alignItems="center" spacing={3}>
            {titleActions && <Box flex="none">{titleActions}</Box>}
            <IconButton size="large" onClick={onClose} sx={{ color: colors.black400 }}>
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
      <Stack direction="column" spacing={2} className={styles.swipeableContainer} sx={{ flexShrink: 0 }}>
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
          <Button onClick={onCancel} size="large" color="secondary" fullWidth {...CancelBtnProps}>
            {cancelBtnText}
          </Button>
        )}
      </Stack>
    )}
  </SwipeableDrawer>
);

export default SwipeableModal;
