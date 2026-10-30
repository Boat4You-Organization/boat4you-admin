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
 * update, Inquiry status, Invoice preview, Agency update, …). v2.2:
 *
 *   - Radius 16, title bar 18/800 with an optional 12.5 description
 *   - Footer on gray.75: cancel (outlined) then confirm (yellow), right-aligned
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

// Footer buttons follow the theme (yellow contained primary, outlined tertiary); only the
// footer-specific sizing lives here.
const confirmBtnSx = {
  minWidth: 96,
};

const cancelBtnSx = {
  minWidth: 96,
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
        borderRadius: '16px',
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
          gap: 1.25,
          padding: '16px 20px',
          borderBottom: `1px solid ${bbColors.gray100}`,
        }}
      >
        {arrowBack && (
          <IconButton size="small" onClick={onBack} sx={{ color: bbColors.gray500, mr: 1 }}>
            <KeyboardBackspaceIcon fontSize="small" />
          </IconButton>
        )}
        <Stack sx={{ flex: 1, minWidth: 0 }}>
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
            <Typography sx={{ fontFamily: bbFont.stack, fontSize: 12.5, color: bbColors.gray500, mt: 0.25 }}>
              {description}
            </Typography>
          )}
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {titleActions && <Box flex="none">{titleActions}</Box>}
          <IconButton
            onClick={onClose}
            aria-label={cancelBtnText}
            sx={{ width: 32, height: 32, color: bbColors.gray500 }}
          >
            <CloseRounded fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>
    )}
    {children && (
      <DialogContent
        ref={scrollRef}
        sx={{
          '&&': { pt: '18px', pb: '20px', px: '20px' },
          fontFamily: bbFont.stack,
          color: bbColors.navy900,
        }}
      >
        {children}
      </DialogContent>
    )}
    {(!hideCancelButton || !hideConfirmButton) && (
      <DialogActions
        disableSpacing
        sx={{
          gap: 1,
          padding: '14px 20px',
          // Primary action last, on the right; the cancel button sits before it
          // (row-reverse, so flex-start is the right edge).
          flexDirection: 'row-reverse',
          justifyContent: 'flex-start',
          '& > .MuiButton-root': { flex: '0 1 auto' },
        }}
      >
        {customButton ? (
          <Box sx={{ width: '100%' }}>{customButton}</Box>
        ) : (
          !hideConfirmButton && (
            <Button onClick={onConfirm} {...ConfirmBtnProps} sx={{ ...confirmBtnSx, ...(ConfirmBtnProps?.sx || {}) }}>
              {confirmBtnText}
            </Button>
          )
        )}
        {!hideCancelButton && (
          <Button
            onClick={onCancel}
            variant="outlined"
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
