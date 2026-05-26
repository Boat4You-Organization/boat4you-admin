import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Stack } from '@mui/material';

import Checkbox from '@/components/Checkbox';
import FormInput from '@/components/Forms/FormInput';
import FormInputNumber from '@/components/Forms/FormInputNumber';
import useBreakpoint from '@/utils/hooks/useBreakpoint';

const GeneralTab = () => {
  const { isMobile } = useBreakpoint();
  const { control } = useFormContext();
  const { t } = useTranslation();

  return (
    <Stack>
      <Stack direction={isMobile ? 'column' : 'row'} spacing={2} mb={2}>
        <FormInput name="name" disabled formLabel={t('form.agency.name')} />
        <FormInputNumber name="discount" formLabel={t('form.agency.discount')} />
      </Stack>
      <Stack direction={isMobile ? 'column' : 'row'} spacing={2} mb={2}>
        <FormInput name="email" disabled formLabel={t('form.agency.email')} />
        <FormInput name="phone" disabled formLabel={t('form.agency.phone')} />
      </Stack>
      <Stack direction={isMobile ? 'column' : 'row'} spacing={2} mb={2}>
        <Controller
          name="skipExternalSystem"
          control={control}
          render={({ field }) => (
            <Checkbox
              checked={field.value || false}
              onChange={event => field.onChange(event.target.checked)}
              label={t('form.agency.skipExternalSystem')}
            />
          )}
        />
        <Controller
          name="active"
          control={control}
          render={({ field }) => (
            <Checkbox
              checked={!field.value}
              onChange={event => field.onChange(!event.target.checked)}
              label={t('form.agency.blacklisted')}
            />
          )}
        />
        <Controller
          name="recommended"
          control={control}
          render={({ field }) => (
            <Checkbox
              checked={field.value || false}
              onChange={event => field.onChange(event.target.checked)}
              label={t('form.agency.recommended')}
            />
          )}
        />
      </Stack>
    </Stack>
  );
};

export default GeneralTab;
