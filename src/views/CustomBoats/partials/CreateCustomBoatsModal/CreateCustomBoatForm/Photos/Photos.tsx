import { useTranslation } from 'react-i18next';

import { Divider, Typography } from '@mui/material';

import DocumentsUpload from '@/components/DocumentsUpload';
import Image from '@/components/SvgIcons/Uploads/Image';
import { acceptedImageTypes } from '@/utils/static/FormValidator';

const Photos = () => {
  const { t } = useTranslation();

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
        maxFiles={1000}
      />
      <Divider sx={{ paddingBlock: 1 }} />
    </>
  );
};

export default Photos;
