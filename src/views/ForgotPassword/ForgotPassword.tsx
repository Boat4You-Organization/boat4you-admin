import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';

import { Button, Stack, Typography } from '@mui/material';

import AuthShell from '@/components/AuthShell';
import Form from '@/components/Forms/Form';
import { ForgotPasswordFormValues } from '@/config/forms/form-models.config';
import { RESET_PASSWORD_FORM } from '@/config/forms/form-names.config';
import AuthService from '@/services/auth.service';
import { bbAuthTitleSx } from '@/styles/bb';
import useToggleState from '@/utils/hooks/useToggleState';
import { showToast } from '@/valtio/global/global.actions';

import ResetPasswordForm from './ForgotPasswordForm';

const defaultValues: ForgotPasswordFormValues = {
  password: '',
  confirmPassword: '',
};

const ForgotPassword = () => {
  const [successState, toggleSuccessState] = useToggleState();
  const [errorState, setErrorState] = useState(false);
  const [searchParams] = useSearchParams();
  const passwordResetCode = searchParams.get('passwordResetCode');

  const { t } = useTranslation();

  const handleSubmit = async (formValues: ForgotPasswordFormValues): Promise<void> => {
    if (!passwordResetCode) {
      return;
    }

    const { payload, message } = await AuthService.resetPassword(passwordResetCode, formValues);

    showToast({
      status: payload ? 'success' : 'error',
      text: payload ? 'Reset password successful' : message || 'Reset password failed',
    });

    if (payload) {
      toggleSuccessState();
    }
  };

  const renderForm = () => (
    <>
      <Typography component="h1" sx={bbAuthTitleSx}>
        {t('login.setup-password.title')}
      </Typography>
      <Typography pt={2} pb={3} variant="body1">
        {t('login.setup-password.description')}
      </Typography>
      <Form defaultValues={defaultValues} onSubmit={handleSubmit} id={RESET_PASSWORD_FORM} mode="onBlur">
        <ResetPasswordForm />
      </Form>
    </>
  );

  const renderSuccessContent = () => (
    <Stack>
      <Typography component="h1" sx={bbAuthTitleSx}>
        {t('login.setup-password.glad-you-back')}
      </Typography>
      <Typography pt={2} pb={3} variant="body1">
        {t('login.setup-password.resetted-successfully')}
      </Typography>
      <Link to="/login">
        <Button size="large" fullWidth>
          {t('login.back-to-login')}
        </Button>
      </Link>
    </Stack>
  );

  const renderErrorState = () => (
    <>
      <Typography component="h1" sx={bbAuthTitleSx}>
        {t('login.setup-password.password-reset-failed')}
      </Typography>
      <Typography pt={2} pb={3} variant="body1">
        {t('login.setup-password.password-reset-failed-description')}
      </Typography>
    </>
  );

  const renderContent = () => {
    if (errorState) {
      return renderErrorState();
    }

    if (successState) {
      return renderSuccessContent();
    }

    return renderForm();
  };

  useEffect(() => {
    if (!passwordResetCode) {
      setErrorState(true);

      return;
    }

    const checkPasswordResetCode = async () => {
      const { payload } = await AuthService.checkPasswordResetCode(passwordResetCode);

      if (!payload) {
        setErrorState(true);
      }
    };

    checkPasswordResetCode();
  }, [passwordResetCode]);

  return <AuthShell>{renderContent()}</AuthShell>;
};

export default ForgotPassword;
