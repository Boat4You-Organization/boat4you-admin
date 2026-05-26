import { useTranslation } from 'react-i18next';

import { Divider, Typography } from '@mui/material';

import DocumentsUpload from '@/components/DocumentsUpload';
import Image from '@/components/SvgIcons/Uploads/Image';
import CustomYachtService from '@/services/custom-yacht.service';
import { acceptedImageTypes } from '@/utils/static/FormValidator';
import { useCustomYachtsStore } from '@/valtio/customYachts/customYachts.store';
import { showToast } from '@/valtio/global/global.actions';

const Photos = () => {
  const { selectedCustomYacht } = useCustomYachtsStore();
  const { t } = useTranslation();

  const handleImagesUpload = async (files: File[]): Promise<number[] | boolean> => {
    if (!selectedCustomYacht || !files.length) {
      return false;
    }

    const { payload, message } = await CustomYachtService.uploadCustomYachtUploadImages(selectedCustomYacht.id, files);

    const success = !!payload;

    showToast({
      status: success ? 'success' : 'error',
      text: success
        ? t('toast-messages.upload-images-successfully')
        : message || t('toast-messages.upload-images-failed'),
    });

    return success ? payload : false;
  };

  const handleImageDelete = async (fileId: string): Promise<boolean> => {
    if (!selectedCustomYacht) {
      return false;
    }

    let imageId = fileId;

    imageId = imageId.replace(/\.[^/.]+$/, '');

    if (imageId.startsWith('yacht-image-')) {
      imageId = imageId.replace('yacht-image-', '');
    }

    if (isNaN(Number(imageId))) {
      const [firstMatch] = fileId.match(/\d+/) || [];

      if (firstMatch) {
        imageId = firstMatch;
      }
    }

    const { payload, message } = await CustomYachtService.deleteCustomYachtImage(selectedCustomYacht.id, imageId);

    const success = !!payload;

    showToast({
      status: success ? 'success' : 'error',
      text: success
        ? t('toast-messages.delete-image-successfully')
        : message || t('toast-messages.delete-image-failed'),
    });

    return success;
  };

  return (
    <>
      <Typography variant="h3" fontWeight={700} pb={3}>
        {t('common.photos')}
      </Typography>
      <DocumentsUpload
        fieldName="images"
        title={t('common.dragAndDrop')}
        description={t('common.browsePhoto')}
        icon={Image}
        multiple
        acceptedFileTypes={acceptedImageTypes}
        uploadMethod={handleImagesUpload}
        deleteMethod={handleImageDelete}
        maxFiles={10}
      />
      <Divider sx={{ paddingBlock: 1 }} />
    </>
  );
};

export default Photos;
