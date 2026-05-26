import { useTranslation } from 'react-i18next';

import { Divider, Stack, Typography } from '@mui/material';

import FormInput from '@/components/Forms/FormInput';
import SingleDocumentUpload from '@/components/SingleDocumentUpload/SingleDocumentUpload';
import TierPricing from '@/components/TierPricing';
import { CustomYachtFormValues } from '@/config/forms/form-models.config';
import { acceptedPDFTypes } from '@/utils/static/FormValidator';

import Details from './Details';
import GeneralInfo from './GeneralInfo';
import MainImage from './MainImage';
import Photos from './Photos';

const CreateCustomBoatForm = () => {
  const { t } = useTranslation();

  return (
    <Stack sx={{ minWidth: { xs: 'auto', md: 670 }, maxWidth: { xs: 'auto', md: 670 } }}>
      <MainImage />
      <GeneralInfo />
      <Photos />
      <Details />
      <Typography variant="h3" fontWeight={700} pb={3}>
        {t('common.video')}
      </Typography>
      <Stack spacing={3}>
        <FormInput
          name="customYachtRequest.videoUrl"
          formLabel={t('form.custom-boat.videoUrl')}
          placeholder={t('form.custom-boat.inputVideoUrl')}
        />
      </Stack>
      <Divider sx={{ paddingBlock: 1 }} />
      <Typography variant="h3" fontWeight={700} pb={3}>
        {t('common.amenities')}
      </Typography>
      <Stack spacing={3}>
        <FormInput
          name="customYachtRequest.amenitiesText"
          formLabel={t('form.custom-boat.amenitiesText')}
          placeholder={t('form.custom-boat.amenitiesTextPlaceholder')}
          multiline
        />
        <FormInput
          name="customYachtRequest.toysText"
          formLabel={t('form.custom-boat.toysText')}
          placeholder={t('form.custom-boat.toysTextPlaceholder')}
          multiline
        />
      </Stack>
      <Divider sx={{ paddingBlock: 1 }} />
      <TierPricing<CustomYachtFormValues>
        title="common.pricing"
        priceInput="customYachtRequest.lowPrice"
        description="customYachtRequest.priceDescription"
        isPriceRequired
      />
      <Divider sx={{ paddingBlock: 1 }} />
      <Typography variant="h3" fontWeight={700} pb={3}>
        {t('common.pdf-upload')}
      </Typography>
      <SingleDocumentUpload
        fieldName="pdf"
        title={t('common.dragAndDrop')}
        description={t('common.browsePdf')}
        acceptedFileTypes={acceptedPDFTypes}
      />
    </Stack>
  );
};

export default CreateCustomBoatForm;
