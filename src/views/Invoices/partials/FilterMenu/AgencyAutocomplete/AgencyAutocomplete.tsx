import React, { useEffect, useState } from 'react';

import debounce from 'lodash.debounce';

import Autocomplete from '@/components/Autocomplete';
import { AgencyModel } from '@/models/agencies.model';
import AgenciesService from '@/services/agencies.service';

interface AgencyAutocompleteProps {
  value?: string;
  onChange: (selectedOption: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string | boolean;
  helperText?: string;
  required?: boolean;
}

const AgencyAutocomplete: React.FC<AgencyAutocompleteProps> = ({
  value,
  onChange,
  label,
  placeholder,
  disabled = false,
  error = false,
  helperText,
  required = false,
}) => {
  const [agencies, setAgencies] = useState<AgencyModel[]>([]);
  const [searchString, setSearchString] = useState<string>('');

  useEffect(() => {
    (async (): Promise<void> => {
      const { content } = await AgenciesService.getAgencies(0, searchString);

      setAgencies(content);
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
      options={agencies.map(agency => ({
        id: agency.id.toString(),
        label: agency.name,
      }))}
      onChange={handleChange}
      label={label}
      onInputChange={debounce(handleInputChange, 500)}
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

export default AgencyAutocomplete;
