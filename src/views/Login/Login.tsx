import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Typography } from '@mui/material';

import AuthShell from '@/components/AuthShell';
import Form from '@/components/Forms/Form';
import { LoginFormValues } from '@/config/forms/form-models.config';
import { LOGIN_FORM } from '@/config/forms/form-names.config';
import MfaService, { keepDeviceToken, MfaLoginResponse, MfaMethod } from '@/services/mfa.service';
import { bbAuthTitleSx } from '@/styles/bb';
import { setToken } from '@/valtio/auth/auth.actions';
import { showToast } from '@/valtio/global/global.actions';

import LoginForm from './LoginForm';
import MfaStep from './MfaStep';

const defaultValues: LoginFormValues = {
  email: '',
  password: '',
};

/**
 * Admin sign-in (16.11.2026: two steps). /auth/mfa/login checks the password; an account with a passkey or an
 * authenticator app then passes MfaStep. A remembered device (30 days) and an account without a second step sign in
 * at once, as before.
 */
const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [secondStep, setSecondStep] = useState<{ mfaToken: string; methods: MfaMethod[] } | null>(null);

  const signedIn = (response: MfaLoginResponse) => {
    keepDeviceToken(response.deviceToken);
    setToken(JSON.stringify({ userId: response.userId, token: response.token, refreshToken: response.refreshToken }));
    showToast({ status: 'success', text: t('toast-messages.login-success') });

    if (response.setupRequired) {
      showToast({ status: 'info', text: t('login.mfa.setup-required') });
      navigate('/my-profile');
    }
  };

  const handleSubmit = async (formValues: LoginFormValues, methods?: UseFormReturn<LoginFormValues>): Promise<void> => {
    const { payload, message } = await MfaService.login(formValues.email, formValues.password);

    if (payload?.status === 'OK') {
      signedIn(payload);

      return;
    }

    if (payload?.status === 'MFA_REQUIRED' && payload.mfaToken) {
      setSecondStep({ mfaToken: payload.mfaToken, methods: payload.methods ?? [] });

      return;
    }

    methods?.setError('email', {
      type: 'manual',
      message: ' ',
    });

    methods?.setError('password', {
      type: 'manual',
      message: t('common.invalid-credentials'),
    });

    showToast({ status: 'error', text: message || t('toast-messages.login-failed') });
  };

  return (
    <AuthShell>
      <Typography component="h1" sx={bbAuthTitleSx}>
        {secondStep ? t('login.mfa.title') : t('login.title')}
      </Typography>
      {secondStep ? (
        <MfaStep
          mfaToken={secondStep.mfaToken}
          methods={secondStep.methods}
          onSignedIn={signedIn}
          onBack={() => setSecondStep(null)}
        />
      ) : (
        <Form defaultValues={defaultValues} onSubmit={handleSubmit} id={LOGIN_FORM} mode="onBlur">
          <LoginForm />
        </Form>
      )}
    </AuthShell>
  );
};

export default Login;
