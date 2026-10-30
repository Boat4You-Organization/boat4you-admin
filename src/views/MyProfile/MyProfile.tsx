import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { VisibilityOffOutlined, VisibilityOutlined } from '@mui/icons-material';
import { Box, Container, IconButton, InputAdornment, Stack, Typography } from '@mui/material';

import Form from '@/components/Forms/Form';
import FormInput from '@/components/Forms/FormInput';
import Layout from '@/components/Layout';
import { ProfileFormValues } from '@/config/forms/form-models.config';
import { PROFILE_FORM } from '@/config/forms/form-names.config';
import { SettingsType } from '@/models/user.model';
import AuthService from '@/services/auth.service';
import UsersService from '@/services/users.service';
import { bbCardSx, bbColors, bbTexture } from '@/styles/bb';
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

// 16px line icons for the profile rows.
const ProfileIcon = ({ kind }: { kind: 'user' | 'mail' | 'lock' }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {kind === 'user' && (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
      </>
    )}
    {kind === 'mail' && (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <path d="m3.5 7 8.5 6 8.5-6" />
      </>
    )}
    {kind === 'lock' && (
      <>
        <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
        <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
      </>
    )}
  </svg>
);

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
      {/* Textured banner with the avatar and title; the settings card overlaps its lower edge. */}
      <Box sx={{ background: bbTexture.chart, pt: '54px' }}>
        <Box sx={{ maxWidth: 640, mx: 'auto', px: { xs: 1.5, sm: 0 }, pt: { xs: 3, sm: 4 }, pb: '72px' }}>
          <Stack direction="row" alignItems="center" gap={2}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                backgroundColor: bbColors.yellow500,
                color: bbColors.yellowText,
                fontSize: 18,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 0 3px rgba(255,255,255,.12)',
                flex: 'none',
              }}
            >
              {`${user.name?.[0] ?? ''}${user.surname?.[0] ?? ''}`.toUpperCase() || 'B4'}
            </Box>
            <Typography
              component="h1"
              sx={{ fontSize: { xs: 22, sm: 26 }, fontWeight: 800, letterSpacing: '-0.015em', color: '#fff' }}
            >
              {t('common.profile.account-settings')}
            </Typography>
          </Stack>
        </Box>
      </Box>
      <Container disableGutters component="section" maxWidth={false} className={styles.container}>
        <Box sx={{ ...bbCardSx, overflow: 'hidden' }}>
          <Form defaultValues={initialValues} onSubmit={handleSubmit} id={PROFILE_FORM} mode="onBlur">
            {({ watch }) => (
              <>
                <EditableField
                  icon={<ProfileIcon kind="user" />}
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
                  icon={<ProfileIcon kind="mail" />}
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
                  icon={<ProfileIcon kind="lock" />}
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
        </Box>
      </Container>
    </Layout>
  );
};

export default MyProfile;
