import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import debounce from 'lodash.debounce';

import Autocomplete from '@/components/Autocomplete';
import { FormInputProps } from '@/components/Forms/FormInput';
import { UserModel } from '@/models/user.model';
import UsersService from '@/services/users.service';

const useUserAutocomplete = () => {
  const [users, setUsers] = useState<UserModel[]>([]);
  const [searchString, setSearchString] = useState<string>('');

  const { t } = useTranslation();

  useEffect(() => {
    (async (): Promise<void> => {
      const { content } = await UsersService.getUsers(0, searchString);

      setUsers(content);
    })();
  }, [searchString]);

  const handleInputChange = (valueString: string) => {
    setSearchString(valueString);
  };

  const renderUserInput: FormInputProps['renderInput'] = ({ field, error }) => (
    <Autocomplete
      value={field.value}
      options={users.map(user => ({
        id: user.email,
        label: user.email,
      }))}
      onChange={field.onChange}
      onInputChange={debounce(handleInputChange, 500)}
      label={t('form.booking.email')}
      TextFieldProps={{
        placeholder: t('form.booking.email'),
        error: !!error,
        helperText: error,
      }}
      clearable
    />
  );

  return renderUserInput;
};

export default useUserAutocomplete;
