import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { Button, IconButton, Stack, Typography } from '@mui/material';

import AuthShell from '@/components/AuthShell';
import Form from '@/components/Forms/Form';
import ArrowLeft from '@/components/SvgIcons/ArrowLeft';
import { ResetPasswordFormValues } from '@/config/forms/form-models.config';
import { FORGOT_PASSWORD_FORM } from '@/config/forms/form-names.config';
import AuthService from '@/services/auth.service';
import { bbAuthTitleSx } from '@/styles/bb';
import colors from '@/styles/themes/colors';
import useToggleState from '@/utils/hooks/useToggleState';
import { showToast } from '@/valtio/global/global.actions';

import ForgotPasswordForm from './ResetPasswordForm';

const defaultValues: ResetPasswordFormValues = {
  email: '',
};

const ResetPassword = () => {
  const [successState, toggleSuccessState] = useToggleState();
  const navigate = useNavigate();

  const { t } = useTranslation();

  const handleSubmit = async (formValues: ResetPasswordFormValues) => {
    const { payload, message } = await AuthService.requestPasswordReset(formValues);

    showToast({
      status: payload ? 'success' : 'error',
      text: payload ? t('toast-messages.check-your-mailbox') : message || t('toast-messages.failed-to-send-email'),
    });

    if (payload) {
      toggleSuccessState();
      defaultValues.email = formValues.email;
    }
  };

  const handleBackButtonClick = () => {
    navigate('/login');
  };

  const renderForm = () => (
    <>
      <IconButton onClick={handleBackButtonClick} sx={{ display: { xs: 'none', md: 'inline-flex' }, ml: -1, mb: 1 }}>
        <ArrowLeft size={24} fill={colors.black950} />
      </IconButton>
      <Typography component="h1" sx={bbAuthTitleSx}>
        {t('login.reset-password.title')}
      </Typography>
      <Form defaultValues={defaultValues} onSubmit={handleSubmit} id={FORGOT_PASSWORD_FORM} mode="onBlur">
        <ForgotPasswordForm />
      </Form>
    </>
  );

  const renderSuccessContent = () => (
    <Stack>
      <Typography component="h1" sx={bbAuthTitleSx}>
        {t('login.reset-password.check-mailbox')}
      </Typography>
      <Typography
        pt={2}
        pb={3}
        variant="body1"
        dangerouslySetInnerHTML={{
          __html: t('login.reset-password.check-mailbox-description', {
            name: defaultValues.email,
          }),
        }}
      />
      <Link to="/login">
        <Button size="large" fullWidth>
          {t('login.back-to-login')}
        </Button>
      </Link>
    </Stack>
  );

  return <AuthShell>{!successState ? renderForm() : renderSuccessContent()}</AuthShell>;
};

export default ResetPassword;
