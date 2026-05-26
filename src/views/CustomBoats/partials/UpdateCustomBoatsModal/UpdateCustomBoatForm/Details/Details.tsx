import { useTranslation } from 'react-i18next';

import { Divider, Stack, Typography } from '@mui/material';

import FormInput from '@/components/Forms/FormInput';
import FormInputNumber from '@/components/Forms/FormInputNumber';
import TimePicker from '@/components/TimePicker/TimePicker';
import useBreakpoint from '@/utils/hooks/useBreakpoint';

const Details = () => {
  const { isMobile } = useBreakpoint();
  const { t } = useTranslation();

  return (
    <>
      <Typography variant="h3" fontWeight={700} pb={3}>
        {t('common.details')}
      </Typography>
      <Stack spacing={3}>
        <FormInput
          name="customYachtRequest.descriptions.en"
          formLabel={t('form.custom-boat.descriptionEn')}
          placeholder={t('form.custom-boat.inputDescription')}
          multiline
        />
        <FormInput
          name="customYachtRequest.descriptions.hr"
          formLabel={t('form.custom-boat.descriptionHr')}
          placeholder={t('form.custom-boat.inputDescription')}
          multiline
        />
        <FormInput
          name="customYachtRequest.descriptions.de"
          formLabel={t('form.custom-boat.descriptionDe')}
          placeholder={t('form.custom-boat.inputDescription')}
          multiline
        />
        <FormInput
          name="customYachtRequest.descriptions.fr"
          formLabel={t('form.custom-boat.descriptionFr')}
          placeholder={t('form.custom-boat.inputDescription')}
          multiline
        />
        <FormInput
          name="customYachtRequest.descriptions.es"
          formLabel={t('form.custom-boat.descriptionEs')}
          placeholder={t('form.custom-boat.inputDescription')}
          multiline
        />
        <FormInput
          name="customYachtRequest.descriptions.it"
          formLabel={t('form.custom-boat.descriptionIt')}
          placeholder={t('form.custom-boat.inputDescription')}
          multiline
        />
        <FormInput
          name="customYachtRequest.descriptions.pt"
          formLabel={t('form.custom-boat.descriptionPt')}
          placeholder={t('form.custom-boat.inputDescription')}
          multiline
        />
        <FormInput
          name="customYachtRequest.descriptions.pl"
          formLabel={t('form.custom-boat.descriptionPl')}
          placeholder={t('form.custom-boat.inputDescription')}
          multiline
        />
        <FormInput
          name="customYachtRequest.descriptions.nl"
          formLabel={t('form.custom-boat.descriptionNl')}
          placeholder={t('form.custom-boat.inputDescription')}
          multiline
        />
        <Stack direction={isMobile ? 'column' : 'row'} spacing={2.5}>
          <FormInput
            name="customYachtRequest.defaultCheckin"
            renderInput={({ field }) => (
              <TimePicker
                formLabel={t('form.custom-boat.defaultCheckin')}
                slotProps={{
                  textField: {
                    placeholder: t('form.custom-boat.inputDefaultCheckin'),
                    InputLabelProps: { shrink: false },
                  },
                }}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <FormInput
            name="customYachtRequest.defaultCheckout"
            renderInput={({ field }) => (
              <TimePicker
                formLabel={t('form.custom-boat.defaultCheckout')}
                slotProps={{
                  textField: {
                    placeholder: t('form.custom-boat.inputDefaultCheckout'),
                    InputLabelProps: { shrink: false },
                  },
                }}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </Stack>
        <Stack direction={isMobile ? 'column' : 'row'} spacing={2.5}>
          <FormInputNumber
            name="customYachtRequest.buildYear"
            formLabel={t('form.custom-boat.buildYear')}
            placeholder={t('form.custom-boat.inputBuildYear')}
          />
          <FormInputNumber
            name="customYachtRequest.launchYear"
            formLabel={t('form.custom-boat.launchYear')}
            placeholder={t('form.custom-boat.inputLaunchYear')}
          />
        </Stack>
        <Stack direction={isMobile ? 'column' : 'row'} spacing={2.5}>
          <FormInputNumber
            name="customYachtRequest.length"
            formLabel={t('form.custom-boat.length')}
            placeholder={t('form.custom-boat.inputLength')}
          />
          <FormInputNumber
            name="customYachtRequest.beam"
            formLabel={t('form.custom-boat.beam')}
            placeholder={t('form.custom-boat.inputBeam')}
          />
        </Stack>
        <Stack direction={isMobile ? 'column' : 'row'} spacing={2.5}>
          <FormInputNumber
            name="customYachtRequest.draught"
            formLabel={t('form.custom-boat.draft')}
            placeholder={t('form.custom-boat.inputDraft')}
          />
          <FormInput
            name="customYachtRequest.engineText"
            formLabel={t('form.custom-boat.engineText')}
            placeholder={t('form.custom-boat.inputEngineText')}
          />
        </Stack>
        <Stack direction={isMobile ? 'column' : 'row'} spacing={2.5}>
          <FormInputNumber
            name="customYachtRequest.waterTank"
            formLabel={t('form.custom-boat.waterTank')}
            placeholder={t('form.custom-boat.inputWaterTank')}
          />
          <FormInputNumber
            name="customYachtRequest.fuelTank"
            formLabel={t('form.custom-boat.fuelTank')}
            placeholder={t('form.custom-boat.inputFuelTank')}
          />
        </Stack>
        <Typography variant="h4" fontWeight={700} pt={1}>
          {t('common.guests')}
        </Typography>
        <Stack direction={isMobile ? 'column' : 'row'} spacing={2.5}>
          <FormInputNumber
            name="customYachtRequest.cabins"
            formLabel={t('form.custom-boat.cabins')}
            placeholder={t('form.custom-boat.inputCabins')}
          />
          <FormInputNumber
            name="customYachtRequest.berths"
            formLabel={t('form.custom-boat.berths')}
            placeholder={t('form.custom-boat.inputBerths')}
          />
        </Stack>
        <Stack direction={isMobile ? 'column' : 'row'} spacing={2.5}>
          <FormInputNumber
            name="customYachtRequest.maxPersons"
            formLabel={t('form.custom-boat.maxPersons')}
            placeholder={t('form.custom-boat.inputMaxPersons')}
          />
          <FormInputNumber
            name="customYachtRequest.crewNumber"
            formLabel={t('form.custom-boat.crewNumber')}
            placeholder={t('form.custom-boat.inputCrewNumber')}
          />
        </Stack>
      </Stack>
      <Divider sx={{ paddingBlock: 1 }} />
    </>
  );
};

export default Details;
