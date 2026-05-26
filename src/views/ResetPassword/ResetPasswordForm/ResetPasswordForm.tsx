import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button, Stack } from '@mui/material';

import FormInput from '@/components/Forms/FormInput';
import { FORGOT_PASSWORD_FORM } from '@/config/forms/form-names.config';
import { FormValidator } from '@/utils/static/FormValidator';

const ResetPasswordForm = () => {
  const { t } = useTranslation('login');
  const {
    formState: { isSubmitting },
  } = useFormContext();

  return (
    <>
      <Stack gap={3} pt={6} pb={3}>
        <FormInput
          name="email"
          formLabel={t('email-address')}
          type="email"
          placeholder={t('email-address')}
          validate={FormValidator.isValidEmail}
        />
      </Stack>
      <Stack mt={1.5} alignItems="flex-start" gap={3}>
        <Button type="submit" size="large" disabled={isSubmitting} fullWidth id={FORGOT_PASSWORD_FORM}>
          {t('reset-password.button')}
        </Button>
      </Stack>
    </>
  );
};

export default ResetPasswordForm;
