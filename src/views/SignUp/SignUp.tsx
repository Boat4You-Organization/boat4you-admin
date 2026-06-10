import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Typography } from '@mui/material';

import AuthShell from '@/components/AuthShell';
import Form from '@/components/Forms/Form';
import { SignUpFormValues } from '@/config/forms/form-models.config';
import { SIGNUP_FORM } from '@/config/forms/form-names.config';
import UsersService from '@/services/users.service';
import { bbAuthTitleSx } from '@/styles/bb';
import { showToast } from '@/valtio/global/global.actions';

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
      <Typography component="h1" sx={bbAuthTitleSx}>
        {t('login.signup.title')}
      </Typography>
      <Typography pt={2} pb={3} variant="body1">
        {t('login.signup.description')}
      </Typography>
      <Form defaultValues={defaultValues} onSubmit={handleSubmit} id={SIGNUP_FORM} mode="onBlur">
        <SignUpForm />
      </Form>
    </>
  );

  const renderErrorState = () => (
    <>
      <Typography component="h1" sx={bbAuthTitleSx}>
        {t('login.signup.invite-failed')}
      </Typography>
      <Typography pt={2} pb={3} variant="body1">
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

  return <AuthShell>{renderContent()}</AuthShell>;
};

export default SignUp;
