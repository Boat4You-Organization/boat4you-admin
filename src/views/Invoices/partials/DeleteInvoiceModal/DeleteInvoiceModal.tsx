import { useTranslation } from 'react-i18next';

import { Typography } from '@mui/material';

import ModalRoot from '@/components/ModalRoot';
import { PAGE_NUMBER } from '@/config/constants.config';
import InvoicesService from '@/services/invoices.service';
import useQueryParams from '@/utils/hooks/useQueryParams';
import { showToast } from '@/valtio/global/global.actions';
import { clearSelectedInvoice, getInvoices } from '@/valtio/invoices/invoices.actions';
import { useInvoicesStore } from '@/valtio/invoices/invoices.store';

interface DeleteInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeleteInvoiceModal = ({ isOpen, onClose }: DeleteInvoiceModalProps) => {
  const { selectedInvoice } = useInvoicesStore();
  const { params: queryParams } = useQueryParams();
  const { page, sortBy, sortDirection } = queryParams;
  const { t } = useTranslation();

  const refreshView = () => {
    const pageNumber = page - PAGE_NUMBER;

    getInvoices(pageNumber, sortBy, sortDirection);
  };

  const handleClose = () => {
    onClose();
    clearSelectedInvoice();
  };

  const handleConfirm = async (): Promise<void> => {
    if (!selectedInvoice) {
      return;
    }

    const { payload, message } = await InvoicesService.deleteInvoice(selectedInvoice.id);

    showToast({
      status: payload ? 'success' : 'error',
      text: payload
        ? t('toast-messages.delete-invoice-successfully')
        : message || t('toast-messages.delete-invoice-failed'),
    });

    if (payload) {
      handleClose();
      refreshView();
    }
  };

  return (
    <ModalRoot
      open={isOpen}
      onClose={handleClose}
      title={t('actions.deleteInvoice')}
      confirmBtnText={t('actions.delete')}
      cancelBtnText={t('actions.cancel')}
      onConfirm={handleConfirm}
      onCancel={handleClose}
      width={480}
      ConfirmBtnProps={{
        color: 'error',
      }}
      CancelBtnProps={{
        color: 'info',
      }}
    >
      <Typography
        variant="body1"
        dangerouslySetInnerHTML={{
          __html: t('common.delete-confirmation-text-bulk', {
            value: `invoice ${selectedInvoice?.invoiceNumber || selectedInvoice?.id.toString()}`,
          }),
        }}
      />
    </ModalRoot>
  );
};

export default DeleteInvoiceModal;
