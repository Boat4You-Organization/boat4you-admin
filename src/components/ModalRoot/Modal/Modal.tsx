import { JSX } from 'react';

import CloseRounded from '@mui/icons-material/CloseRounded';
import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace';
import {
  Box,
  Button,
  ButtonProps,
  Dialog,
  DialogActions,
  DialogContent,
  DialogProps,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';

import { bbColors, bbFont } from '@/styles/bb';

/**
 * Shared admin modal shell — used by every modal in the Broker Desk
 * (CreateReservation, Cancel/Confirm/Sync booking, Edit notes, User
 * update, Inquiry status, Invoice preview, Agency update, …). Styling
 * aligns with the rest of the redesign:
 *
 *   - Title: navy 18px/800 (no italic)
 *   - Description: gray500
 *   - Confirm (primary action): yellow button
 *   - Cancel: outlined, navy text
 *
 * When a modal passes `customButton`, the default action row is
 * suppressed and the caller provides its own footer.
 */

interface ModalProps extends DialogProps {
  hideTitle: boolean;
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
}

const confirmBtnSx = {
  backgroundColor: bbColors.yellow500,
  color: bbColors.yellowText,
  fontFamily: bbFont.stack,
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: '0.02em',
  textTransform: 'none' as const,
  borderRadius: '6px',
  boxShadow: '0 4px 10px -4px rgba(255,210,74,0.5)',
  '&:hover': { backgroundColor: '#ffca2e', boxShadow: '0 4px 10px -4px rgba(255,210,74,0.5)' },
  '&.Mui-disabled': {
    backgroundColor: '#fce8a3',
    color: bbColors.yellowText,
    boxShadow: 'none',
  },
};

const cancelBtnSx = {
  backgroundColor: bbColors.white,
  color: bbColors.navy900,
  border: `1px solid ${bbColors.gray300}`,
  fontFamily: bbFont.stack,
  fontSize: 13,
  fontWeight: 700,
  textTransform: 'none' as const,
  borderRadius: '6px',
  boxShadow: 'none',
  '&:hover': {
    backgroundColor: bbColors.gray75,
    border: `1px solid ${bbColors.gray300}`,
    boxShadow: 'none',
  },
};

const Modal = ({
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
  scrollRef,
  arrowBack,
  onBack,
  children,
  ...props
}: ModalProps) => (
  <Dialog
    open={open}
    onClose={onClose}
    fullWidth
    {...props}
    sx={{
      '& .MuiDialog-paper': {
        overflow: customButton ? 'visible' : 'hidden',
        borderRadius: '12px',
        fontFamily: bbFont.stack,
      },
    }}
  >
    {!hideTitle && (
      <DialogTitle
        component="div"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: `1px solid ${bbColors.gray200}`,
        }}
      >
        {arrowBack && (
          <IconButton size="small" onClick={onBack} sx={{ color: bbColors.gray500, mr: 1 }}>
            <KeyboardBackspaceIcon fontSize="small" />
          </IconButton>
        )}
        <Stack>
          <Typography
            sx={{
              fontFamily: bbFont.stack,
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: '-0.01em',
              color: bbColors.navy900,
            }}
          >
            {title}
          </Typography>
          {description && (
            <Typography
              sx={{ fontFamily: bbFont.stack, fontSize: 12.5, color: bbColors.gray500, mt: 0.25 }}
            >
              {description}
            </Typography>
          )}
        </Stack>
        <Stack direction="row" alignItems="center" spacing={2}>
          {titleActions && <Box flex="none">{titleActions}</Box>}
          <IconButton size="small" onClick={onClose} sx={{ color: bbColors.gray500 }}>
            <CloseRounded fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>
    )}
    {children && (
      <DialogContent
        ref={scrollRef}
        sx={{
          pb: 3,
          pt: 2.5,
          fontFamily: bbFont.stack,
          color: bbColors.navy900,
          borderBottom: `1px solid ${bbColors.gray200}`,
        }}
      >
        {children}
      </DialogContent>
    )}
    {(!hideCancelButton || !hideConfirmButton) && (
      <DialogActions
        disableSpacing
        sx={{ gap: 1, padding: '14px 20px', backgroundColor: bbColors.white }}
      >
        {customButton ? (
          <Box sx={{ width: '100%' }}>{customButton}</Box>
        ) : (
          !hideConfirmButton && (
            <Button
              onClick={onConfirm}
              fullWidth
              size="large"
              {...ConfirmBtnProps}
              sx={{ ...confirmBtnSx, ...(ConfirmBtnProps?.sx || {}) }}
            >
              {confirmBtnText}
            </Button>
          )
        )}
        {!hideCancelButton && (
          <Button
            onClick={onCancel}
            size="large"
            fullWidth
            {...CancelBtnProps}
            sx={{ ...cancelBtnSx, ...(CancelBtnProps?.sx || {}) }}
          >
            {cancelBtnText}
          </Button>
        )}
      </DialogActions>
    )}
  </Dialog>
);

export default Modal;
