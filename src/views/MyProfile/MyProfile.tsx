import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { VisibilityOffOutlined, VisibilityOutlined } from '@mui/icons-material';
import { Container, IconButton, InputAdornment, Stack, Typography } from '@mui/material';

import Form from '@/components/Forms/Form';
import FormInput from '@/components/Forms/FormInput';
import Layout from '@/components/Layout';
import { ProfileFormValues } from '@/config/forms/form-models.config';
import { PROFILE_FORM } from '@/config/forms/form-names.config';
import { SettingsType } from '@/models/user.model';
import AuthService from '@/services/auth.service';
import UsersService from '@/services/users.service';
import colors from '@/styles/themes/colors';
import useLogout from '@/utils/hooks/useLogout';
import useToggleState from '@/utils/hooks/useToggleState';
import { FormValidator } from '@/utils/static/FormValidator';
import { setUser } from '@/valtio/auth/auth.actions';
import { useAuthStore } from '@/valtio/auth/auth.store';
import { showToast } from '@/valtio/global/global.actions';

import styles from './MyProfile.module.scss';
import EditableField from './partials/EditableField';

const defaultValues: ProfileFormValues = {
  id: 0,
  name: '',
  surname: '',
  password: '',
  email: '',
  roles: [],
  newPassword: '',
  repeatNewPassword: '',
  cardPaymentSurcharge: '',
};

const MyProfile = () => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordVisibility, togglePasswordVisibility] = useToggleState();
  const [mainPasswordVisibility, toggleMainPasswordVisibility] = useToggleState();
  const { user, userSettings } = useAuthStore();
  const { t } = useTranslation();
  const handleLogout = useLogout();

  const initialValues: ProfileFormValues = useMemo(
    () =>
      user
        ? {
            id: user.id,
            name: user.name,
            surname: user.surname,
            email: user.email,
            password: user.password || '',
            roles: user.roles,
            newPassword: '',
            repeatNewPassword: '',
            cardPaymentSurcharge: userSettings && userSettings[0] ? userSettings[0].value || '' : '',
          }
        : defaultValues,
    [user, userSettings]
  );

  const handleToggleEdit = (fieldName: string) => {
    setEditingField(current => (current === fieldName ? null : fieldName));
  };

  const handleSubmit = async (formValues: ProfileFormValues) => {
    if (!user) {
      return;
    }

    setIsSubmitting(true);

    const hasNameSurnameEmailChanged =
      formValues.name !== user.name || formValues.surname !== user.surname || formValues.email !== user.email;
    const hasPasswordChanged = formValues.newPassword && formValues.newPassword.length > 0;

    try {
      let success = false;
      let message = '';

      if (hasNameSurnameEmailChanged) {
        const { payload, message: nameSurnameMsg } = await UsersService.updateUser(user.id, {
          name: formValues.name,
          surname: formValues.surname,
          email: formValues.email,
          roles: formValues.roles,
        });

        success = !!payload;
        message = nameSurnameMsg || '';

        if (success) {
          setUser({
            ...user,
            name: formValues.name,
            surname: formValues.surname,
          });

          showToast({
            status: 'success',
            text: t('toast-messages.profile-updated-successfully'),
          });
          setEditingField(null);
        } else {
          showToast({
            status: 'error',
            text: message || t('toast-messages.profile-updated-failed'),
          });
        }
      }

      if (hasPasswordChanged) {
        const { payload, message: passwordMsg } = await AuthService.updatePassword({
          oldPassword: formValues.password,
          newPassword: formValues.newPassword || '',
        });

        success = !!payload;
        message = passwordMsg || '';

        if (success) {
          showToast({
            status: 'success',
            text: t('toast-messages.password-updated-successfully'),
          });
          handleLogout();

          return;
        }

        showToast({
          status: 'error',
          text: message || t('toast-messages.password-updated-failed'),
        });
      }

    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <Container disableGutters component="section" maxWidth="md" className={styles.container}>
        <Typography variant="h1" fontWeight={700} sx={{ mb: 4 }}>
          {t('common.profile.account-settings')}
        </Typography>
        <Form defaultValues={initialValues} onSubmit={handleSubmit} id={PROFILE_FORM} mode="onBlur">
          {({ watch }) => (
            <>
              <EditableField
                label={t('common.profile.full-name')}
                value={`${user.name} ${user.surname}`}
                description={t('common.profile.full-name-description')}
                isEditing={editingField === 'Full Name'}
                onToggleEdit={() => handleToggleEdit('Full Name')}
                isAnotherEditing={editingField !== null && editingField !== 'Full Name'}
                isSubmitting={isSubmitting}
              >
                <Stack direction={{ xs: 'column', sm: 'row' }} gap={{ xs: 2.5, sm: 3 }}>
                  <FormInput
                    name="name"
                    formLabel={t('common.profile.name')}
                    placeholder={t('common.profile.name')}
                    validate={FormValidator.isNotEmpty}
                  />
                  <FormInput
                    name="surname"
                    formLabel={t('common.profile.last-name')}
                    placeholder={t('common.profile.last-name')}
                    validate={FormValidator.isNotEmpty}
                  />
                </Stack>
              </EditableField>
              <EditableField
                label={t('common.profile.email')}
                value={user.email}
                description={t('common.profile.email-description')}
                isEditing={editingField === 'Email'}
                onToggleEdit={() => handleToggleEdit('Email')}
                isAnotherEditing={editingField !== null && editingField !== 'Email'}
                isSubmitting={isSubmitting}
              >
                <Stack direction={{ xs: 'column', sm: 'row' }} gap={{ xs: 2.5, sm: 3 }}>
                  <FormInput
                    name="email"
                    formLabel={t('common.profile.current-email')}
                    placeholder={t('common.profile.input-email')}
                    validate={FormValidator.isNotEmpty}
                  />
                </Stack>
              </EditableField>
              <EditableField
                label={t('common.profile.password')}
                value="********"
                description={t('common.profile.password-description')}
                isEditing={editingField === 'Password'}
                onToggleEdit={() => handleToggleEdit('Password')}
                isAnotherEditing={editingField !== null && editingField !== 'Password'}
                isSubmitting={isSubmitting}
              >
                <Stack direction={{ xs: 'column', sm: 'row' }} gap={{ xs: 2.5, sm: 3 }}>
                  <FormInput
                    name="password"
                    formLabel={t('common.profile.current-password')}
                    placeholder={t('common.profile.input-password')}
                    type={mainPasswordVisibility ? 'text' : 'password'}
                    validate={value => {
                      const newPassword = watch('newPassword') || '';

                      if (newPassword && newPassword.length > 0) {
                        return FormValidator.isNotEmpty(value);
                      }

                      return true;
                    }}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={t('login.toggle-password-visibility')}
                              onClick={toggleMainPasswordVisibility}
                            >
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
                  <Stack width={1} display={{ xs: 'none', sm: 'flex' }} />
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} gap={{ xs: 2.5, sm: 3 }}>
                  <FormInput
                    name="newPassword"
                    formLabel={t('common.profile.new-password')}
                    placeholder={t('common.profile.input-new-password')}
                    type={passwordVisibility ? 'text' : 'password'}
                    validate={FormValidator.skipValidation}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={t('login.toggle-password-visibility')}
                              onClick={togglePasswordVisibility}
                            >
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
                    name="repeatNewPassword"
                    formLabel={t('common.profile.repeat-password')}
                    placeholder={t('common.profile.repeat-new-password')}
                    type={passwordVisibility ? 'text' : 'password'}
                    validate={value => {
                      const newPassword = watch('newPassword') || '';

                      if (newPassword && newPassword.length > 0) {
                        return FormValidator.matchesPassword(newPassword)(value);
                      }

                      return true;
                    }}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={t('login.toggle-password-visibility')}
                              onClick={togglePasswordVisibility}
                            >
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
                </Stack>
              </EditableField>
            </>
          )}
        </Form>
      </Container>
    </Layout>
  );
};

export default MyProfile;
