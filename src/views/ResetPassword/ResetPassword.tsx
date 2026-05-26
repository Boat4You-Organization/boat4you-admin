import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { Box, Button, Container, Grid, IconButton, Stack, Typography } from '@mui/material';

import Form from '@/components/Forms/Form';
import Layout from '@/components/Layout';
import ArrowLeft from '@/components/SvgIcons/ArrowLeft';
import AdminLoginVector from '@/components/SvgIcons/Vector/AdminLoginVector';
import ResetPasswordCodeVector from '@/components/SvgIcons/Vector/ResetPasswordCodeVector';
import { ResetPasswordFormValues } from '@/config/forms/form-models.config';
import { FORGOT_PASSWORD_FORM } from '@/config/forms/form-names.config';
import AuthService from '@/services/auth.service';
import colors from '@/styles/themes/colors';
import useToggleState from '@/utils/hooks/useToggleState';
import { showToast } from '@/valtio/global/global.actions';

import styles from './ResetPassword.module.scss';
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
      <IconButton onClick={handleBackButtonClick} className={styles.navigationArrow}>
        <ArrowLeft size={24} fill={colors.black950} />
      </IconButton>
      <Typography variant="hero" fontWeight={800} fontStyle="italic" color={colors.blue500} pt={{ xs: 0, md: 3 }}>
        {t('login.reset-password.title')}
      </Typography>
      <Form
        defaultValues={defaultValues}
        className={styles.form}
        onSubmit={handleSubmit}
        id={FORGOT_PASSWORD_FORM}
        mode="onBlur"
      >
        <ForgotPasswordForm />
      </Form>
    </>
  );

  const renderSuccessContent = () => (
    <Stack>
      <Typography variant="hero" fontWeight={800} fontStyle="italic" color={colors.blue500}>
        {t('login.reset-password.check-mailbox')}
      </Typography>
      <Typography
        pt={6}
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

  return (
    <Layout>
      <Container component="section" disableGutters maxWidth="xl" className={styles.container}>
        <Grid container spacing={5} className={styles.contentWrapper}>
          <Grid size={{ xs: 12, md: 6 }} className={styles.content}>
            {!successState ? renderForm() : renderSuccessContent()}
          </Grid>
          <Grid size={{ xs: 12, md: 6 }} />
        </Grid>
        <Grid container spacing={5} className={styles.imageWrapper}>
          <Grid size={{ xs: 12, md: 6 }} />
          <Grid size={{ xs: 12, md: 6 }}>
            <Box className={styles.vector}>{!successState ? <AdminLoginVector /> : <ResetPasswordCodeVector />}</Box>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
};

export default ResetPassword;
