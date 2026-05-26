import { FieldValues, Path } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Grid, Stack, Typography } from '@mui/material';

import FormInput from '@/components/Forms/FormInput';
import FormInputNumber from '@/components/Forms/FormInputNumber';
import { FormValidator } from '@/utils/static/FormValidator';

interface TierPricingProps<T extends FieldValues> {
  title: string;
  priceInput: Path<T>;
  description: Path<T>;
  isPriceRequired?: boolean;
}

const TierPricing = <T extends FieldValues>({
  title,
  priceInput,
  description,
  isPriceRequired = false,
}: TierPricingProps<T>) => {
  const { t } = useTranslation();

  return (
    <>
      <Typography variant="h3" fontWeight={700} pb={3}>
        {t(title)}
      </Typography>
      <Stack spacing={3}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormInputNumber
              name={priceInput}
              formLabel={t('form.custom-boat.price')}
              placeholder={t('form.custom-boat.inputPrice')}
              validate={isPriceRequired ? FormValidator.isNumberRequired : FormValidator.isNumberOptional}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }} />
        </Grid>
        <FormInput
          name={description}
          formLabel={t('form.custom-boat.priceDescription')}
          placeholder={t('form.custom-boat.inputPriceDescription')}
          multiline
        />
      </Stack>
    </>
  );
};

export default TierPricing;
