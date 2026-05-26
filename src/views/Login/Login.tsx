import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Box, Container, Grid, Typography } from '@mui/material';

import Form from '@/components/Forms/Form';
import Layout from '@/components/Layout';
import AdminLoginVector from '@/components/SvgIcons/Vector/AdminLoginVector';
import { LoginFormValues } from '@/config/forms/form-models.config';
import { LOGIN_FORM } from '@/config/forms/form-names.config';
import AuthService from '@/services/auth.service';
import colors from '@/styles/themes/colors';
import { setToken } from '@/valtio/auth/auth.actions';
import { showToast } from '@/valtio/global/global.actions';

import styles from './Login.module.scss';
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
    <Layout>
      <Container component="section" disableGutters maxWidth="xl" className={styles.container}>
        <Grid container spacing={5} className={styles.contentWrapper}>
          <Grid size={{ xs: 12, md: 6 }} className={styles.content}>
            <Typography variant="hero" fontWeight={800} fontStyle="italic" color={colors.blue500}>
              {t('login.title')}
            </Typography>
            <Form
              defaultValues={defaultValues}
              className={styles.form}
              onSubmit={handleSubmit}
              id={LOGIN_FORM}
              mode="onBlur"
            >
              <LoginForm />
            </Form>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }} />
        </Grid>
        <Grid container spacing={5} className={styles.imageWrapper}>
          <Grid size={{ xs: 12, md: 6 }} />
          <Grid size={{ xs: 12, md: 6 }}>
            <Box className={styles.vector}>
              <AdminLoginVector />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
};

export default Login;
