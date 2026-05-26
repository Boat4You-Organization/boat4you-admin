import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Stack } from '@mui/material';

import Form from '@/components/Forms/Form';
import FormInput, { FormInputProps } from '@/components/Forms/FormInput';
import ModalRoot from '@/components/ModalRoot';
import Select from '@/components/Select';
import { PAGE_NUMBER } from '@/config/constants.config';
import { UpdateInquiryStatusFormValues } from '@/config/forms/form-models.config';
import { CHANGE_INQUIRY_STATUS_FORM } from '@/config/forms/form-names.config';
import { INQUIRIES_STATUS_ARRAY, INQUIRIES_STATUS_LABEL_MAP, InquiriesStatus } from '@/models/inquiries.model';
import InquiriesService from '@/services/inquiries.service';
import useBreakpoint from '@/utils/hooks/useBreakpoint';
import useQueryParams from '@/utils/hooks/useQueryParams';
import { FormValidator } from '@/utils/static/FormValidator';
import { showToast } from '@/valtio/global/global.actions';
import { clearSelectedInquiry, getInquiries, getSelectedInquiry } from '@/valtio/inquiries/inquiries.actions';
import { useInquiriesStore } from '@/valtio/inquiries/inquiries.store';

interface StatusInquiryModalProps {
  isSinglePage?: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const defaultValues: UpdateInquiryStatusFormValues = {
  status: InquiriesStatus.NEW,
};

const StatusInquiryModal = ({ isSinglePage = false, isOpen, onClose }: StatusInquiryModalProps) => {
  const { params: queryParams } = useQueryParams();
  const { page, sortBy, sortDirection, inquiryStatus } = queryParams;

  const { isMobile } = useBreakpoint();
  const { selectedInquiry } = useInquiriesStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const initialValues: UpdateInquiryStatusFormValues = selectedInquiry
    ? {
        status: selectedInquiry.status,
      }
    : defaultValues;

  const refreshView = () => {
    const pageNumber = page - PAGE_NUMBER;
    const status = (inquiryStatus as InquiriesStatus) || INQUIRIES_STATUS_ARRAY[0];

    if (isSinglePage && selectedInquiry) {
      getSelectedInquiry(selectedInquiry?.id);

      return;
    }

    getInquiries(pageNumber, '', sortBy, sortDirection, status);
  };

  const handleSubmit = async (formValues: UpdateInquiryStatusFormValues): Promise<void> => {
    if (!selectedInquiry) {
      return;
    }

    const { payload, message } = await InquiriesService.updateInquiryStatus(selectedInquiry.id, formValues);

    showToast({
      status: payload ? 'success' : 'error',
      text: payload
        ? t('toast-messages.update-inquiry-status-successfully')
        : message || t('toast-messages.update-inquiry-status-failed'),
    });

    if (payload) {
      onClose();
      refreshView();
    }
  };

  const handleClose = () => {
    onClose();

    if (!isSinglePage) {
      clearSelectedInquiry();
      navigate(`/inquiries?${searchParams.toString()}`);
    }
  };

  const renderStatusInput: FormInputProps['renderInput'] = ({ field, error }) => (
    <Select
      value={field.value}
      onChange={field.onChange}
      options={INQUIRIES_STATUS_ARRAY.map(item => ({
        id: item,
        label: t(INQUIRIES_STATUS_LABEL_MAP[item]),
      }))}
      label={t('form.inquiry.status')}
      placeholder={t('form.inquiry.choose-status')}
      error={error}
    />
  );

  return (
    <ModalRoot
      open={isOpen}
      fullScreen={isMobile}
      onClose={handleClose}
      title={t('actions.changeStatus')}
      onCancel={handleClose}
      confirmBtnText={t('actions.update')}
      cancelBtnText={t('actions.cancel')}
      ConfirmBtnProps={{
        form: CHANGE_INQUIRY_STATUS_FORM,
        type: 'submit',
      }}
    >
      <Form
        key={selectedInquiry?.id}
        defaultValues={initialValues}
        onSubmit={handleSubmit}
        id={CHANGE_INQUIRY_STATUS_FORM}
        mode="onBlur"
      >
        <Stack sx={{ minWidth: { xs: 'auto', md: 480 } }}>
          <FormInput name="status" renderInput={renderStatusInput} validate={FormValidator.isNotEmpty} />
        </Stack>
      </Form>
    </ModalRoot>
  );
};

export default StatusInquiryModal;
