import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';

import { VisibilityOffOutlined, VisibilityOutlined } from '@mui/icons-material';
import { Button, IconButton, InputAdornment, Stack } from '@mui/material';

import FormInput from '@/components/Forms/FormInput';
import { LOGIN_FORM } from '@/config/forms/form-names.config';
import colors from '@/styles/themes/colors';
import useToggleState from '@/utils/hooks/useToggleState';
import { FormValidator } from '@/utils/static/FormValidator';

const LoginForm = () => {
  const { t } = useTranslation('login');
  const [passwordVisibility, togglePasswordVisibility] = useToggleState();
  const {
    formState: { isSubmitting },
  } = useFormContext();

  return (
    <>
      <Stack gap={3} pt={6}>
        <FormInput
          name="email"
          formLabel={t('email-address')}
          type="email"
          placeholder={t('email-address')}
          validate={FormValidator.isValidEmail}
        />
        <FormInput
          name="password"
          formLabel={t('password')}
          type={passwordVisibility ? 'text' : 'password'}
          placeholder={t('password')}
          validate={FormValidator.all(FormValidator.isNotEmpty, FormValidator.isNotEmpty)}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton aria-label={t('toggle-password-visibility')} onClick={togglePasswordVisibility}>
                    {passwordVisibility ? (
                      <VisibilityOffOutlined sx={{ color: colors.black200 }} />
                    ) : (
                      <VisibilityOutlined sx={{ color: colors.black200 }} />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      </Stack>
      <Stack mt={1.5} alignItems="flex-start" gap={3}>
        <RouterLink to="/reset-password" onClick={e => e.stopPropagation()}>
          {t('forgotten-password')}
        </RouterLink>
        <Button type="submit" size="large" disabled={isSubmitting} fullWidth id={LOGIN_FORM}>
          {isSubmitting ? t('logging-in') : t('log-in')}
        </Button>
      </Stack>
    </>
  );
};

export default LoginForm;
