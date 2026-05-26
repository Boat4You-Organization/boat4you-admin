import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Box, Container, Grid, Typography } from '@mui/material';

import Form from '@/components/Forms/Form';
import Layout from '@/components/Layout';
import ReserSuccessfulVector from '@/components/SvgIcons/Vector/ReserSuccessfulVector';
import { SignUpFormValues } from '@/config/forms/form-models.config';
import { SIGNUP_FORM } from '@/config/forms/form-names.config';
import UsersService from '@/services/users.service';
import colors from '@/styles/themes/colors';
import { showToast } from '@/valtio/global/global.actions';

import styles from './SignUp.module.scss';
import SignUpForm from './SignUpForm';

const defaultValues: SignUpFormValues = {
  password: '',
  confirmPassword: '',
};

const SignUp = () => {
  const [errorState, setErrorState] = useState(false);
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('inviteCode');
  const navigate = useNavigate();

  const { t } = useTranslation();

  const handleSubmit = async (formValues: SignUpFormValues): Promise<void> => {
    if (!inviteCode) {
      return;
    }

    const { payload, message } = await UsersService.signUpUser(inviteCode, formValues);

    showToast({
      status: payload ? 'success' : 'error',
      text: payload ? t('login.signup.sign-up-successfully') : message || t('login.signup.sign-up-failed'),
    });

    if (payload) {
      navigate('/login');
    }
  };

  const renderForm = () => (
    <>
      <Typography variant="hero" fontWeight={800} fontStyle="italic" color={colors.blue500} pt={{ xs: 0, md: 3 }}>
        {t('login.signup.title')}
      </Typography>
      <Typography pt={6} pb={3} variant="body1">
        {t('login.signup.description')}
      </Typography>
      <Form
        defaultValues={defaultValues}
        className={styles.form}
        onSubmit={handleSubmit}
        id={SIGNUP_FORM}
        mode="onBlur"
      >
        <SignUpForm />
      </Form>
    </>
  );

  const renderErrorState = () => (
    <>
      <Typography variant="hero" fontWeight={800} fontStyle="italic" color={colors.blue500}>
        {t('login.signup.invite-failed')}
      </Typography>
      <Typography pt={6} pb={3} variant="body1">
        {t('login.signup.invite-failed-description')}
      </Typography>
    </>
  );

  const renderContent = () => {
    if (errorState) {
      return renderErrorState();
    }

    return renderForm();
  };

  useEffect(() => {
    if (!inviteCode) {
      setErrorState(true);

      return;
    }

    const checkInviteCode = async () => {
      const { payload } = await UsersService.checkInviteCode(inviteCode);

      if (!payload) {
        setErrorState(true);
      }
    };

    checkInviteCode();
  }, [inviteCode]);

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
            <Box className={styles.vector}>
              <ReserSuccessfulVector />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
};

export default SignUp;
