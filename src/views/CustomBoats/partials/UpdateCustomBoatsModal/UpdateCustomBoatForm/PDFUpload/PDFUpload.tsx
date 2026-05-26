import { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Typography } from '@mui/material';

import SingleDocumentUpload from '@/components/SingleDocumentUpload';
import { CustomYachtFormValues } from '@/config/forms/form-models.config';
import CustomYachtService from '@/services/custom-yacht.service';
import { acceptedPDFTypes } from '@/utils/static/FormValidator';
import { useCustomYachtsStore } from '@/valtio/customYachts/customYachts.store';
import { showToast } from '@/valtio/global/global.actions';

const PDFUpload = () => {
  const { selectedCustomYacht } = useCustomYachtsStore();

  const { t } = useTranslation();
  const { setValue } = useFormContext<CustomYachtFormValues>();

  const handlePDFDownload = useCallback(() => {
    if (!selectedCustomYacht?.pdf) return;

    const link = document.createElement('a');

    link.href = selectedCustomYacht.pdf;
    link.download = `yacht-brochure-${selectedCustomYacht.id}.pdf`;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [selectedCustomYacht]);

  const handlePDFUpload = async (file: File) => {
    if (!selectedCustomYacht) {
      return;
    }

    const { payload, message } = await CustomYachtService.uploadCustomYachtPDFFile(selectedCustomYacht.id, file);

    if (payload) {
      const renamedFile = new File([file], `yacht-brochure-${selectedCustomYacht.id}`, { type: file.type });

      setValue('pdf', renamedFile);

      showToast({
        status: 'success',
        text: t('toast-messages.upload-pdf-successfully'),
      });
    } else {
      showToast({
        status: 'error',
        text: message || t('toast-messages.upload-pdf-failed'),
      });
    }
  };

  const handlePDFDelete = async () => {
    if (!selectedCustomYacht) {
      return;
    }

    const { payload, message } = await CustomYachtService.deleteCustomPDF(selectedCustomYacht.id);

    showToast({
      status: payload ? 'success' : 'error',
      text: payload ? t('toast-messages.delete-pdf-successfully') : message || t('toast-messages.delete-pdf-failed'),
    });
  };

  return (
    <>
      <Typography variant="h3" fontWeight={700} pb={3}>
        {t('common.pdf-upload')}
      </Typography>
      <SingleDocumentUpload
        fieldName="pdf"
        title={t('common.dragAndDrop')}
        description={t('common.browsePdf')}
        acceptedFileTypes={acceptedPDFTypes}
        uploadMethod={handlePDFUpload}
        deleteMethod={handlePDFDelete}
        downloadMethod={handlePDFDownload}
        hasDownloadButton
      />
    </>
  );
};

export default PDFUpload;
