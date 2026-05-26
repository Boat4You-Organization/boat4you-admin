import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

import { Stack, Typography } from '@mui/material';

import DiscardDialog from '@/components/DiscardDialog';
import Form from '@/components/Forms/Form';
import FormInput, { FormInputProps } from '@/components/Forms/FormInput';
import ModalRoot from '@/components/ModalRoot';
import Select from '@/components/Select';
import { CreateUserFormValues } from '@/config/forms/form-models.config';
import { CREATE_USER_FORM } from '@/config/forms/form-names.config';
import { USER_ROLE_ARRAY, USER_ROLE_NAME_LABEL_MAP, UserRoleName } from '@/models/user.model';
import UsersService from '@/services/users.service';
import useBreakpoint from '@/utils/hooks/useBreakpoint';
import useToggleState from '@/utils/hooks/useToggleState';
import { FormValidator } from '@/utils/static/FormValidator';
import { setIsFormDirty, showToast } from '@/valtio/global/global.actions';
import { useGlobalStore } from '@/valtio/global/global.store';
import { getUsers } from '@/valtio/users/users.actions';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const defaultValues: CreateUserFormValues = {
  name: '',
  surname: '',
  email: '',
  roles: [{ roleName: UserRoleName.USER }],
};

const CreateUserModal = ({ isOpen, onClose }: CreateUserModalProps) => {
  const [discard, toggleDiscard] = useToggleState();
  const { isFormDirty } = useGlobalStore();
  const { isMobile } = useBreakpoint();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const refreshView = () => {
    const page = Number(searchParams.get('page'));

    getUsers(page);
  };

  const inviteUser = async (userId?: number) => {
    if (!userId) {
      return;
    }

    const { payload, message } = await UsersService.inviteUser([userId]);

    showToast({
      status: payload ? 'success' : 'error',
      text: payload ? t('toast-messages.invite-user-successfully') : message || t('toast-messages.invite-user-failed'),
    });
  };

  const handleSubmit = async (formValues: CreateUserFormValues): Promise<void> => {
    const { payload, message } = await UsersService.createUser(formValues);

    showToast({
      status: payload ? 'success' : 'error',
      text: payload ? t('toast-messages.create-user-successfully') : message || t('toast-messages.create-user-failed'),
    });

    if (payload) {
      await inviteUser(payload.id);
      onClose();
      refreshView();
    }
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
      onClose={isFormDirty ? toggleDiscard : onClose}
      title={t('actions.create-user')}
      onCancel={isFormDirty ? toggleDiscard : onClose}
      confirmBtnText={t('actions.create')}
      cancelBtnText={t('actions.cancel')}
      ConfirmBtnProps={{
        form: CREATE_USER_FORM,
        type: 'submit',
      }}
    >
      <Form defaultValues={defaultValues} onSubmit={handleSubmit} id={CREATE_USER_FORM} mode="onBlur">
        {({ formState: { isDirty } }) => {
          setIsFormDirty(isDirty);

          return (
            <Stack sx={{ minWidth: { xs: 'auto', md: 670 } }}>
              <Typography variant="body1" pb={3}>
                {t('common.invite-send-to-email')}
              </Typography>
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
                <FormInput
                  name="roles[0].roleName"
                  renderInput={renderRoleInput}
                  validate={FormValidator.isNotEmpty}
                />
              </Stack>
              <DiscardDialog isOpen={discard} onClose={toggleDiscard} onDiscard={onClose} />
            </Stack>
          );
        }}
      </Form>
    </ModalRoot>
  );
};

export default CreateUserModal;
