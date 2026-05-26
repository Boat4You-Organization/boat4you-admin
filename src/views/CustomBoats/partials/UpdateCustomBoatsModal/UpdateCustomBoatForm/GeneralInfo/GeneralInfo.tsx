import { useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Divider, Grid, Stack, Typography } from '@mui/material';

import FormInput, { FormInputProps } from '@/components/Forms/FormInput';
import Select from '@/components/Select';
import { CustomYachtFormValues } from '@/config/forms/form-models.config';
import { VESSEL_TYPE_ARRAY, VESSEL_TYPE_LABEL_MAP } from '@/models/custom-yacht.model';
import colors from '@/styles/themes/colors';
import useBreakpoint from '@/utils/hooks/useBreakpoint';
import useCountryAutocomplete from '@/utils/hooks/useCountryAutocomplete';
import useManufacturerAutocomplete from '@/utils/hooks/useManufacturerAutocomplete';
import useMarinaAutocomplete from '@/utils/hooks/useMarinaAutocomplete';
import useModelAutocomplete from '@/utils/hooks/useModelAutocomplete';
import { FormValidator } from '@/utils/static/FormValidator';

const GeneralInfo = () => {
  const { isMobile } = useBreakpoint();
  const { t } = useTranslation();
  const { watch, setValue } = useFormContext<CustomYachtFormValues>();
  const { customYachtRequest } = watch();
  const prevManufacturerIdRef = useRef<string | undefined>(customYachtRequest.manufacturerId);

  useEffect(() => {
    const currentManufacturerId = customYachtRequest.manufacturerId;
    const prevManufacturerId = prevManufacturerIdRef.current;

    if (prevManufacturerId !== undefined && prevManufacturerId !== currentManufacturerId) {
      setValue('customYachtRequest.modelId', '');
      setValue('customYachtRequest.modelName', '');
    }

    prevManufacturerIdRef.current = currentManufacturerId;
  }, [customYachtRequest.manufacturerId, setValue]);

  useEffect(() => {
    if (customYachtRequest.manufacturerName && customYachtRequest.manufacturerId) {
      setValue('customYachtRequest.manufacturerId', '');
      setValue('customYachtRequest.modelId', '');
    }
  }, [customYachtRequest.manufacturerId, customYachtRequest.manufacturerName, setValue]);

  // Country swap clears the marina pick — old marina belongs to a different
  // country and would silently land on the wrong location_id otherwise.
  // Skip when initialising the modal with the existing yacht's country (the
  // ref tracks the previous value so the first paint doesn't blank out the
  // marina that came from selectedCustomYacht).
  const prevCountryIdRef = useRef<string | undefined>(customYachtRequest.countryId);
  useEffect(() => {
    if (prevCountryIdRef.current !== undefined && prevCountryIdRef.current !== customYachtRequest.countryId) {
      setValue('customYachtRequest.locationId', '');
    }
    prevCountryIdRef.current = customYachtRequest.countryId;
  }, [customYachtRequest.countryId, setValue]);

  const renderVesselTypeInput: FormInputProps['renderInput'] = ({ field, error }) => (
    <Select
      value={field.value}
      onChange={field.onChange}
      options={VESSEL_TYPE_ARRAY.map(item => ({
        id: item,
        label: t(VESSEL_TYPE_LABEL_MAP[item]),
      }))}
      placeholder={t('form.custom-boat.inputBoatType')}
      label={t('form.custom-boat.boatType')}
      error={error}
    />
  );

  const renderCountryInput = useCountryAutocomplete();
  const renderMarinaInput = useMarinaAutocomplete({ countryId: customYachtRequest.countryId });
  const renderManufacturerInput = useManufacturerAutocomplete({
    manufacturerId: customYachtRequest.manufacturerId,
  });
  const renderModelInput = useModelAutocomplete({
    manufacturerId: Number(customYachtRequest.manufacturerId),
    modelId: customYachtRequest.modelId,
  });

  const hasManualManufacturer = !!customYachtRequest.manufacturerName;
  const hasDropdownManufacturer = !!customYachtRequest.manufacturerId;
  const hasDropdownModel = !!customYachtRequest.modelId;

  return (
    <>
      <Typography variant="h3" fontWeight={700} pb={3}>
        {t('common.general-info')}
      </Typography>
      <Stack spacing={3}>
        <Stack direction={isMobile ? 'column' : 'row'} spacing={2.5}>
          <FormInput
            name="customYachtRequest.name"
            formLabel={t('form.custom-boat.boatName')}
            placeholder={t('form.custom-boat.boatName')}
            validate={FormValidator.isNotEmpty}
          />
          <FormInput
            name="customYachtRequest.vesselType"
            renderInput={renderVesselTypeInput}
            validate={FormValidator.isNotEmpty}
          />
        </Stack>
        <Stack direction={isMobile ? 'column' : 'row'} spacing={2.5}>
          <FormInput
            name="customYachtRequest.manufacturerId"
            renderInput={renderManufacturerInput}
            disabled={hasManualManufacturer}
          />
          <FormInput
            name="customYachtRequest.modelId"
            renderInput={renderModelInput}
            disabled={!hasDropdownManufacturer || hasManualManufacturer}
          />
        </Stack>
        <Stack spacing={2}>
          <Stack direction={isMobile ? 'column' : 'row'} spacing={2.5}>
            <FormInput
              name="customYachtRequest.manufacturerName"
              formLabel={t('form.custom-boat.manufacturerName')}
              placeholder={t('form.custom-boat.manufacturerName')}
              disabled={hasDropdownManufacturer}
            />
            <FormInput
              name="customYachtRequest.modelName"
              formLabel={t('form.custom-boat.modelName')}
              placeholder={t('form.custom-boat.modelName')}
              disabled={hasDropdownModel}
            />
          </Stack>
          <Typography variant="body2" color={colors.black300}>
            {t('common.manual-entry-noter')}
          </Typography>
        </Stack>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormInput
              name="customYachtRequest.countryId"
              renderInput={renderCountryInput}
              validate={FormValidator.isNotEmpty}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormInput
              name="customYachtRequest.locationId"
              renderInput={renderMarinaInput}
              validate={FormValidator.isNotEmpty}
            />
          </Grid>
        </Grid>
      </Stack>
      <Divider sx={{ paddingBlock: 1 }} />
    </>
  );
};

export default GeneralInfo;
