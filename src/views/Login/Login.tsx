import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Typography } from '@mui/material';

import AuthShell from '@/components/AuthShell';
import Form from '@/components/Forms/Form';
import { LoginFormValues } from '@/config/forms/form-models.config';
import { LOGIN_FORM } from '@/config/forms/form-names.config';
import AuthService from '@/services/auth.service';
import { bbAuthTitleSx } from '@/styles/bb';
import { setToken } from '@/valtio/auth/auth.actions';
import { showToast } from '@/valtio/global/global.actions';

import LoginForm from './LoginForm';

const defaultValues: LoginFormValues = {
  email: '',
  password: '',
};

const Login = () => {
  const { t } = useTranslation();

  const handleSubmit = async (formValues: LoginFormValues, methods?: UseFormReturn<LoginFormValues>): Promise<void> => {
    const { payload, message } = await AuthService.login(formValues);

    if (!payload) {
      methods?.setError('email', {
        type: 'manual',
        message: ' ',
      });

      methods?.setError('password', {
        type: 'manual',
        message: t('common.invalid-credentials'),
      });
    }

    setToken(payload);
    showToast({
      status: payload ? 'success' : 'error',
      text: payload ? t('toast-messages.login-success') : message || t('toast-messages.login-failed'),
    });
  };

  return (
    <AuthShell>
      <Typography component="h1" sx={bbAuthTitleSx}>
        {t('login.title')}
      </Typography>
      <Form defaultValues={defaultValues} onSubmit={handleSubmit} id={LOGIN_FORM} mode="onBlur">
        <LoginForm />
      </Form>
    </AuthShell>
  );
};

export default Login;
