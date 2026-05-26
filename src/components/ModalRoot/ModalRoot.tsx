import React, { JSX } from 'react';

import { ButtonProps, DialogProps, Theme, useMediaQuery } from '@mui/material';

import Modal from './Modal';
import SwipeableModal from './SwipeableModal';

interface ModalRootProps extends DialogProps {
  hideTitle?: boolean;
  title?: string;
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
  width?: number;
  arrowBack?: boolean;
  zIndex?: number;
  onBack?: () => void;
}

const ModalRoot = ({
  hideTitle = false,
  open,
  title,
  onClose,
  width,
  arrowBack,
  onBack,
  zIndex,
  children,
  ...props
}: ModalRootProps) => {
  const isTablet = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'));

  if (isTablet) {
    return (
      <SwipeableModal
        hideTitle={hideTitle}
        open={open}
        onClose={onClose}
        title={title}
        hideCancelButton
        arrowBack={arrowBack}
        onBack={onBack}
        zIndex={zIndex}
        {...props}
      >
        {children}
      </SwipeableModal>
    );
  }

  return (
    <Modal
      hideTitle={hideTitle}
      open={open}
      title={title}
      onClose={onClose}
      arrowBack={arrowBack}
      onBack={onBack}
      {...props}
      slotProps={{ paper: { sx: { maxWidth: width } } }}
    >
      {children}
    </Modal>
  );
};

export default ModalRoot;
