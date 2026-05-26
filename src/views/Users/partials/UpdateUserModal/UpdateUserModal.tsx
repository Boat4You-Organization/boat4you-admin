import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Grid, Stack } from '@mui/material';

import Form from '@/components/Forms/Form';
import FormInput, { FormInputProps } from '@/components/Forms/FormInput';
import ModalRoot from '@/components/ModalRoot';
import Select from '@/components/Select';
import { UpdateUserFormValues } from '@/config/forms/form-models.config';
import { UPDATE_USER_FORM } from '@/config/forms/form-names.config';
import { USER_ROLE_ARRAY, USER_ROLE_NAME_LABEL_MAP, UserRoleName } from '@/models/user.model';
import UsersService from '@/services/users.service';
import useBreakpoint from '@/utils/hooks/useBreakpoint';
import { FormValidator } from '@/utils/static/FormValidator';
import { showToast } from '@/valtio/global/global.actions';
import { clearSelectedUser, getSelectedUser, getUsers } from '@/valtio/users/users.actions';
import { useUsersStore } from '@/valtio/users/users.store';

interface UpdateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const defaultValues: UpdateUserFormValues = {
  name: '',
  surname: '',
  email: '',
  phoneNumber: '',
  address: '',
  city: '',
  country: '',
  roles: [{ roleName: UserRoleName.USER }],
};

const UpdateUserModal = ({ isOpen, onClose }: UpdateUserModalProps) => {
  const { isMobile } = useBreakpoint();
  const { selectedUser } = useUsersStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const initialValues: UpdateUserFormValues = selectedUser
    ? {
        name: selectedUser.name,
        surname: selectedUser.surname,
        email: selectedUser.email,
        phoneNumber: selectedUser.phoneNumber,
        address: selectedUser.address ?? '',
        city: selectedUser.city ?? '',
        country: selectedUser.country ?? '',
        roles: selectedUser.roles.length ? selectedUser.roles : [{ roleName: UserRoleName.USER }],
      }
    : defaultValues;

  const refreshView = () => {
    const page = Number(searchParams.get('page'));

    getUsers(page);

    if (selectedUser) {
      getSelectedUser(selectedUser.id);
    }
  };

  const handleSubmit = async (formValues: UpdateUserFormValues): Promise<void> => {
    if (!selectedUser) {
      return;
    }

    const { payload, message } = await UsersService.updateUser(selectedUser.id, formValues);

    showToast({
      status: payload ? 'success' : 'error',
      text: payload ? t('toast-messages.update-user-successfully') : message || t('toast-messages.update-user-failed'),
    });

    if (payload) {
      onClose();
      refreshView();
    }
  };

  const handleClose = () => {
    onClose();
    clearSelectedUser();
    navigate(`/users?${searchParams.toString()}`);
  };

  const renderRoleInput: FormInputProps['renderInput'] = ({ field, error }) => (
    <Select
      value={field.value}
      onChange={field.onChange}
      options={USER_ROLE_ARRAY.map(({ roleName }) => ({
        id: roleName,
        label: t(USER_ROLE_NAME_LABEL_MAP[roleName]),
      }))}
      label={t('form.user.role')}
      placeholder={t('form.user.choose-role')}
      error={error}
    />
  );

  return (
    <ModalRoot
      open={isOpen}
      fullScreen={isMobile}
      onClose={handleClose}
      title={`${selectedUser?.name} ${selectedUser?.surname}`}
      onCancel={handleClose}
      confirmBtnText={t('actions.update')}
      cancelBtnText={t('actions.cancel')}
      ConfirmBtnProps={{
        form: UPDATE_USER_FORM,
        type: 'submit',
      }}
    >
      <Form
        key={selectedUser?.id}
        defaultValues={initialValues}
        onSubmit={handleSubmit}
        id={UPDATE_USER_FORM}
        mode="onBlur"
      >
        <Stack sx={{ minWidth: { xs: 'auto', md: 670 } }}>
          <Stack direction={isMobile ? 'column' : 'row'} spacing={2} mb={3}>
            <FormInput
              name="name"
              formLabel={t('form.user.user-name')}
              placeholder={t('form.user.user-name')}
              validate={FormValidator.isNotEmpty}
            />
            <FormInput
              name="surname"
              formLabel={t('form.user.surname')}
              placeholder={t('form.user.surname')}
              validate={FormValidator.isNotEmpty}
            />
          </Stack>

          <Stack direction={isMobile ? 'column' : 'row'} spacing={2} mb={3}>
            <FormInput
              type="email"
              name="email"
              formLabel={t('form.user.email')}
              placeholder={t('form.user.email')}
              validate={FormValidator.all(FormValidator.isNotEmpty, FormValidator.isValidEmail)}
              slotProps={{
                input: {
                  inputProps: { inputMode: 'email' },
                },
              }}
            />
            <FormInput name="phoneNumber" formLabel={t('form.user.phone')} placeholder={t('form.user.phone')} />
          </Stack>
          <Stack mb={3}>
            <FormInput
              name="address"
              formLabel={t('form.user.address')}
              placeholder={t('form.user.address-placeholder')}
            />
          </Stack>
          <Stack direction={isMobile ? 'column' : 'row'} spacing={2} mb={3}>
            <FormInput name="city" formLabel={t('form.user.city')} placeholder={t('form.user.city')} />
            <FormInput name="country" formLabel={t('form.user.country')} placeholder={t('form.user.country')} />
          </Stack>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormInput name="roles[0].roleName" renderInput={renderRoleInput} validate={FormValidator.isNotEmpty} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }} />
          </Grid>
        </Stack>
      </Form>
    </ModalRoot>
  );
};

export default UpdateUserModal;
