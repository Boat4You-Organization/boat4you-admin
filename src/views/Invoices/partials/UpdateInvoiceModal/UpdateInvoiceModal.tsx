import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import Form from '@/components/Forms/Form';
import ModalRoot from '@/components/ModalRoot';
import { PAGE_NUMBER } from '@/config/constants.config';
import { CountryIsoEnum, getCountryCodeFromName } from '@/config/countries.config';
import { UpdateInvoiceFormValues } from '@/config/forms/form-models.config';
import { UPDATE_INVOICE } from '@/config/forms/form-names.config';
import { InvoiceLanguage, InvoiceStatus, RecipientType } from '@/models/invoices.model';
import InvoicesService from '@/services/invoices.service';
import useBreakpoint from '@/utils/hooks/useBreakpoint';
import useQueryParams from '@/utils/hooks/useQueryParams';
import { showToast } from '@/valtio/global/global.actions';
import { clearSelectedInvoice, getInvoices, getSelectedInvoice } from '@/valtio/invoices/invoices.actions';
import { useInvoicesStore } from '@/valtio/invoices/invoices.store';

import UpdateInvoiceForm from './UpdateInvoiceForm';

interface UpdateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const defaultValues: UpdateInvoiceFormValues = {
  reservationId: '',
  recipientType: RecipientType.PRIVATE_PERSON,
  recipientName: '',
  recipientCity: '',
  recipientStreet: '',
  recipientZipCode: '',
  recipientVatCode: '',
  recipientCountry: CountryIsoEnum.HR,
  invoiceLanguage: InvoiceLanguage.HR,
  invoiceStatus: InvoiceStatus.DRAFT,
  invoiceItem: '',
  includeVat: false,
  vatPercentage: null,
  priceWithoutVat: null,
  vatAmount: null,
  totalPrice: null,
};

const UpdateInvoiceModal = ({ isOpen, onClose }: UpdateInvoiceModalProps) => {
  const { selectedInvoice } = useInvoicesStore();
  const { isMobile } = useBreakpoint();
  const [searchParams] = useSearchParams();
  const { params: queryParams } = useQueryParams();
  const { page, sortBy, sortDirection } = queryParams;
  const navigate = useNavigate();
  const { t } = useTranslation();

  const initialValues: UpdateInvoiceFormValues = selectedInvoice
    ? {
        reservationId: selectedInvoice.reservationId.toString(),
        recipientType: selectedInvoice.recipientType,
        recipientName: selectedInvoice.recipientName,
        recipientCity: selectedInvoice.recipientCity,
        recipientStreet: selectedInvoice.recipientStreet,
        recipientZipCode: selectedInvoice.recipientZipCode,
        recipientCountry:
          typeof selectedInvoice.recipientCountry === 'string' &&
          !Object.values(CountryIsoEnum).includes(selectedInvoice.recipientCountry as CountryIsoEnum)
            ? getCountryCodeFromName(selectedInvoice.recipientCountry)
            : (selectedInvoice.recipientCountry as CountryIsoEnum),
        recipientVatCode: selectedInvoice.recipientVatCode,
        invoiceLanguage: selectedInvoice.invoiceLanguage,
        invoiceStatus: selectedInvoice.invoiceStatus,
        invoiceItem: selectedInvoice.invoiceItem,
        includeVat: selectedInvoice.includeVat,
        vatPercentage: selectedInvoice.vatPercentage,
        priceWithoutVat: selectedInvoice.priceWithoutVat,
        vatAmount: selectedInvoice.vatAmount,
        totalPrice: selectedInvoice.totalPrice,
      }
    : defaultValues;

  const refreshView = () => {
    const pageNumber = page - PAGE_NUMBER;

    getInvoices(pageNumber, sortBy, sortDirection);

    if (selectedInvoice) {
      getSelectedInvoice(selectedInvoice.id);
    }
  };

  const handleClose = () => {
    onClose();
    clearSelectedInvoice();
    navigate(`/invoices?${searchParams.toString()}`);
  };

  const handleSubmit = async (formValues: UpdateInvoiceFormValues) => {
    if (!selectedInvoice) {
      return;
    }

    const { payload, message } = await InvoicesService.updateInvoice(selectedInvoice.id, formValues);

    showToast({
      status: payload ? 'success' : 'error',
      text: payload
        ? t('toast-messages.update-invoice-successfully')
        : message || t('toast-messages.update-invoice-failed'),
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
      fullScreen={isMobile}
      title={t('actions.updateInvoice')}
      onCancel={handleClose}
      confirmBtnText={t('actions.update')}
      cancelBtnText={t('actions.cancel')}
      ConfirmBtnProps={{
        form: UPDATE_INVOICE,
        type: 'submit',
      }}
      slotProps={{ paper: { sx: { maxWidth: 670 } } }}
    >
      <Form
        key={selectedInvoice?.id}
        defaultValues={initialValues}
        onSubmit={handleSubmit}
        id={UPDATE_INVOICE}
        mode="onBlur"
      >
        <UpdateInvoiceForm />
      </Form>
    </ModalRoot>
  );
};

export default UpdateInvoiceModal;
