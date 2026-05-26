import { useTranslation } from 'react-i18next';

import { Divider, Typography } from '@mui/material';

import SingleDocumentUpload from '@/components/SingleDocumentUpload';
import Image from '@/components/SvgIcons/Uploads/Image';
import { acceptedImageTypes } from '@/utils/static/FormValidator';

const MainImage = () => {
  const { t } = useTranslation();

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
      />
      <Divider sx={{ paddingBlock: 1 }} />
    </>
  );
};

export default MainImage;
