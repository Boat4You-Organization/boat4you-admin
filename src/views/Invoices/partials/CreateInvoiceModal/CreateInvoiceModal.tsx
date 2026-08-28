import { useTranslation } from 'react-i18next';

import dayjs from 'dayjs';

import Form from '@/components/Forms/Form';
import ModalRoot from '@/components/ModalRoot';
import { PAGE_NUMBER } from '@/config/constants.config';
import { CountryIsoEnum } from '@/config/countries.config';
import { CreateInvoiceFormValues } from '@/config/forms/form-models.config';
import { CREATE_INVOICE } from '@/config/forms/form-names.config';
import { InvoiceLanguage, RecipientType } from '@/models/invoices.model';
import InvoicesService from '@/services/invoices.service';
import useBreakpoint from '@/utils/hooks/useBreakpoint';
import useQueryParams from '@/utils/hooks/useQueryParams';
import { showToast } from '@/valtio/global/global.actions';
import { getInvoices } from '@/valtio/invoices/invoices.actions';

import CreateInvoiceForm from './CreateInvoiceForm';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const defaultValues: CreateInvoiceFormValues = {
  reservationId: '',
  agencyId: '',
  recipientType: RecipientType.COMPANY,
  recipientName: '',
  recipientCity: '',
  recipientStreet: '',
  recipientZipCode: '',
  recipientVatCode: '',
  recipientCountry: CountryIsoEnum.HR,
  invoiceLanguage: InvoiceLanguage.HR,
  invoiceDate: dayjs().format('YYYY-MM-DD'),
  invoiceNumber: '',
  contractNumber: '',
  charterDateFrom: '',
  charterDateTo: '',
  invoiceItem: '',
  includeVat: false,
  vatPercentage: null,
  priceWithoutVat: null,
  vatAmount: null,
  totalPrice: null,
};

const CreateInvoiceModal = ({ isOpen, onClose }: CreateInvoiceModalProps) => {
  const { isMobile } = useBreakpoint();
  const { params: queryParams } = useQueryParams();
  const { page, sortBy, sortDirection } = queryParams;
  const { t } = useTranslation();

  const handleSubmit = async (formValues: CreateInvoiceFormValues) => {
    const { payload, message } = await InvoicesService.createInvoice({
      ...formValues,
      charterDateFrom: formValues.charterDateFrom || undefined,
      charterDateTo: formValues.charterDateTo || undefined,
    } as never);

    showToast({
      status: payload ? 'success' : 'error',
      text: payload
        ? t('toast-messages.create-invoice-successfully', { number: payload.invoiceNumber })
        : message || t('toast-messages.create-invoice-failed'),
    });

    if (payload) {
      onClose();
      getInvoices(page - PAGE_NUMBER, sortBy, sortDirection);
    }
  };

  return (
    <ModalRoot
      open={isOpen}
      onClose={onClose}
      fullScreen={isMobile}
      title={t('actions.newInvoice')}
      onCancel={onClose}
      confirmBtnText={t('actions.create')}
      cancelBtnText={t('actions.cancel')}
      ConfirmBtnProps={{
        form: CREATE_INVOICE,
        type: 'submit',
      }}
      slotProps={{ paper: { sx: { maxWidth: 670 } } }}
    >
      <Form defaultValues={defaultValues} onSubmit={handleSubmit} id={CREATE_INVOICE} mode="onBlur">
        <CreateInvoiceForm />
      </Form>
    </ModalRoot>
  );
};

export default CreateInvoiceModal;
