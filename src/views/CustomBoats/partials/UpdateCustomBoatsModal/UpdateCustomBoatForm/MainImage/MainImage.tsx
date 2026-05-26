import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Divider, Typography } from '@mui/material';

import SingleDocumentUpload from '@/components/SingleDocumentUpload';
import Image from '@/components/SvgIcons/Uploads/Image';
import CustomYachtService from '@/services/custom-yacht.service';
import { acceptedImageTypes } from '@/utils/static/FormValidator';
import { useCustomYachtsStore } from '@/valtio/customYachts/customYachts.store';
import { showToast } from '@/valtio/global/global.actions';

const MainImage = () => {
  const { selectedCustomYacht } = useCustomYachtsStore();
  const { t } = useTranslation();
  const { setValue } = useFormContext();

  const handleImageUpload = async (file: File) => {
    if (!selectedCustomYacht) {
      return;
    }

    const { payload, message } = await CustomYachtService.uploadCustomYachtMainImage(selectedCustomYacht.id, file);

    if (payload && typeof payload === 'number') {
      const renamedFile = new File([file], `yacht-image-${payload}`, { type: file.type });

      setValue('mainImage', renamedFile);

      showToast({
        status: 'success',
        text: t('toast-messages.upload-image-successfully'),
      });
    } else {
      showToast({
        status: 'error',
        text: message || t('toast-messages.upload-image-failed'),
      });
    }
  };

  const handleImageDelete = async (fileId: string) => {
    if (!selectedCustomYacht) {
      return;
    }

    const imageId = fileId.replace(/^yacht-image-/, '') || fileId;

    const { payload, message } = await CustomYachtService.deleteCustomYachtImage(selectedCustomYacht.id, imageId);

    showToast({
      status: payload ? 'success' : 'error',
      text: payload
        ? t('toast-messages.delete-image-successfully')
        : message || t('toast-messages.delete-image-failed'),
    });
  };

  return (
    <>
      <Typography variant="h3" fontWeight={700} pb={3}>
        {t('common.main-image')}
      </Typography>
      <SingleDocumentUpload
        fieldName="mainImage"
        title={t('common.dragAndDrop')}
        description={t('common.browsePhoto')}
        icon={Image}
        acceptedFileTypes={acceptedImageTypes}
        uploadMethod={handleImageUpload}
        deleteMethod={handleImageDelete}
      />
      <Divider sx={{ paddingBlock: 1 }} />
    </>
  );
};

export default MainImage;
