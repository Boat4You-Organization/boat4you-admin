import React, { useEffect, useState } from 'react';

import debounce from 'lodash.debounce';

import Autocomplete from '@/components/Autocomplete';
import { UserModel } from '@/models/user.model';
import UsersService from '@/services/users.service';

interface UserAutocompleteProps {
  value?: string;
  onChange: (selectedOption: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string | boolean;
  helperText?: string;
  required?: boolean;
}

const UserAutocomplete: React.FC<UserAutocompleteProps> = ({
  value,
  onChange,
  label,
  placeholder,
  disabled = false,
  error = false,
  helperText,
  required = false,
}) => {
  const [users, setUsers] = useState<UserModel[]>([]);
  const [searchString, setSearchString] = useState<string>('');

  useEffect(() => {
    (async (): Promise<void> => {
      const { content } = await UsersService.getUsers(0, searchString);

      setUsers(content);
    })();
  }, [searchString]);

  const handleInputChange = (valueString: string) => {
    setSearchString(valueString);
  };

  const handleChange = (selectedOption: string) => {
    onChange(selectedOption);
  };

  return (
    <Autocomplete
      value={value || ''}
      options={users.map(user => ({
        id: user.id.toString(),
        label: user.name,
      }))}
      onChange={handleChange}
      onInputChange={debounce(handleInputChange, 500)}
      label={label}
      disabled={disabled}
      clearable
      TextFieldProps={{
        placeholder,
        error: !!error,
        helperText: helperText || (error && typeof error === 'string' ? error : undefined),
        required,
      }}
    />
  );
};

export default UserAutocomplete;
