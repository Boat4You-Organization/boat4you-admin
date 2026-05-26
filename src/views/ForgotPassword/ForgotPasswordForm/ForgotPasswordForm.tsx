import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { VisibilityOffOutlined, VisibilityOutlined } from '@mui/icons-material';
import { Button, IconButton, InputAdornment, Stack } from '@mui/material';

import FormInput from '@/components/Forms/FormInput';
import { RESET_PASSWORD_FORM } from '@/config/forms/form-names.config';
import colors from '@/styles/themes/colors';
import useToggleState from '@/utils/hooks/useToggleState';
import { FormValidator } from '@/utils/static/FormValidator';

const ForgotPasswordForm = () => {
  const [passwordVisibility, togglePasswordVisibility] = useToggleState();
  const { t } = useTranslation('login');
  const {
    formState: { isSubmitting },
    watch,
  } = useFormContext();

  return (
    <Stack gap={3}>
      <FormInput
        name="password"
        formLabel={t('password')}
        type={passwordVisibility ? 'text' : 'password'}
        placeholder={t('password')}
        validate={FormValidator.isNotEmpty}
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
      <FormInput
        name="confirmPassword"
        formLabel={t('setup-password.repeat-password')}
        type={passwordVisibility ? 'text' : 'password'}
        placeholder={t('setup-password.repeat-password')}
        validate={value => {
          const password = watch('password');

          return FormValidator.all(FormValidator.isNotEmpty, FormValidator.matchesPassword(password))(value);
        }}
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
      <Button type="submit" size="large" disabled={isSubmitting} fullWidth id={RESET_PASSWORD_FORM}>
        {t('setup-password.reset-password')}
      </Button>
    </Stack>
  );
};

export default ForgotPasswordForm;
