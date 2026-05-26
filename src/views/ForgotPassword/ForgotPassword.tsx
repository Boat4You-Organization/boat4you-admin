import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';

import { Box, Button, Container, Grid, Stack, Typography } from '@mui/material';

import Form from '@/components/Forms/Form';
import Layout from '@/components/Layout';
import AdminLoginVector from '@/components/SvgIcons/Vector/AdminLoginVector';
import ReserSuccessfulVector from '@/components/SvgIcons/Vector/ReserSuccessfulVector';
import { ForgotPasswordFormValues } from '@/config/forms/form-models.config';
import { RESET_PASSWORD_FORM } from '@/config/forms/form-names.config';
import AuthService from '@/services/auth.service';
import colors from '@/styles/themes/colors';
import useToggleState from '@/utils/hooks/useToggleState';
import { showToast } from '@/valtio/global/global.actions';

import styles from './ForgotPassword.module.scss';
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
      <Typography variant="hero" fontWeight={800} fontStyle="italic" color={colors.blue500} pt={{ xs: 0, md: 3 }}>
        {t('login.setup-password.title')}
      </Typography>
      <Typography pt={6} pb={3} variant="body1">
        {t('login.setup-password.description')}
      </Typography>
      <Form
        defaultValues={defaultValues}
        className={styles.form}
        onSubmit={handleSubmit}
        id={RESET_PASSWORD_FORM}
        mode="onBlur"
      >
        <ResetPasswordForm />
      </Form>
    </>
  );

  const renderSuccessContent = () => (
    <Stack>
      <Typography variant="hero" fontWeight={800} fontStyle="italic" color={colors.blue500}>
        {t('login.setup-password.glad-you-back')}
      </Typography>
      <Typography pt={6} pb={3} variant="body1">
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
      <Typography variant="hero" fontWeight={800} fontStyle="italic" color={colors.blue500}>
        {t('login.setup-password.password-reset-failed')}
      </Typography>
      <Typography pt={6} pb={3} variant="body1">
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

  return (
    <Layout>
      <Container component="section" disableGutters maxWidth="xl" className={styles.container}>
        <Grid container spacing={5} className={styles.contentWrapper}>
          <Grid size={{ xs: 12, md: 6 }} className={styles.content}>
            {renderContent()}
          </Grid>
          <Grid size={{ xs: 12, md: 6 }} />
        </Grid>
        <Grid container spacing={5} className={styles.imageWrapper}>
          <Grid size={{ xs: 12, md: 6 }} />
          <Grid size={{ xs: 12, md: 6 }}>
            <Box className={styles.vector}>{!successState ? <AdminLoginVector /> : <ReserSuccessfulVector />}</Box>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
};

export default ForgotPassword;
