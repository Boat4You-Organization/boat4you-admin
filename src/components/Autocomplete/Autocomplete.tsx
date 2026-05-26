import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Close, ExpandMoreRounded } from '@mui/icons-material';
import {
  FormControl,
  FormLabel,
  IconButton,
  MenuItem,
  Autocomplete as MuiAutocomplete,
  TextField,
  TextFieldProps as TextFieldPropsType,
  Typography,
} from '@mui/material';

import typography from '@/styles/themes/typography';

export interface AutocompleteOption {
  id: string;
  label: string;
}

export interface AutocompleteProps {
  value: string;
  options: AutocompleteOption[];
  onChange: (value: string) => void;
  onInputChange?: (value: string) => void;
  label?: string;
  disabled?: boolean;
  renderOption?: (option: AutocompleteOption) => React.ReactNode;
  filteredOptions?: AutocompleteOption[];
  TextFieldProps?: TextFieldPropsType;
  clearable?: boolean;
}

const Autocomplete: React.FC<AutocompleteProps> = ({
  value,
  options,
  onChange,
  onInputChange,
  label,
  disabled,
  renderOption,
  filteredOptions,
  TextFieldProps,
  clearable = false,
}) => {
  const { t } = useTranslation('common');
  const selectedValue = useMemo(
    () => (value ? options.find(option => option.id === value) : undefined),
    [options, value]
  );

  const handleIsOptionEqualToValue = (option: AutocompleteOption, inputValue: AutocompleteOption) =>
    option.id === inputValue.id && option.label === inputValue.label;

  const getOptionDisabled = (option: AutocompleteOption) =>
    filteredOptions?.every(filteredOption => filteredOption.id !== option.id) || false;

  const handleChange = (_: React.SyntheticEvent, newValue: AutocompleteOption | null) => {
    onChange(newValue?.id || '');
  };

  const handleInputChange = (_: React.SyntheticEvent, newInputValue: string) => {
    if (onInputChange) {
      onInputChange(newInputValue);
    }
  };

  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation();
    onChange('');
  };

  return (
    <FormControl fullWidth>
      {label && (
        <FormLabel
          sx={{
            mb: 1,
            ...typography.body1,
            fontWeight: 600,
            '&.Mui-focused': {
              color: 'inherit',
            },
          }}
        >
          {label}
        </FormLabel>
      )}
      <MuiAutocomplete
        value={selectedValue || null}
        options={options}
        onChange={handleChange}
        noOptionsText={t('no-matches')}
        popupIcon={<ExpandMoreRounded />}
        onInputChange={handleInputChange}
        isOptionEqualToValue={handleIsOptionEqualToValue}
        getOptionDisabled={getOptionDisabled}
        disabled={disabled}
        clearOnEscape
        disableClearable={!clearable || !value}
        clearIcon={
          <IconButton
            component="div"
            size="small"
            onClick={handleClear}
            sx={{
              visibility: value && clearable ? 'visible' : 'hidden',
              padding: '2px',
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        }
        renderInput={params => <TextField {...params} {...TextFieldProps} />}
        renderOption={(props, option) => (
          <MenuItem {...props} key={option.id}>
            {renderOption ? renderOption(option) : <Typography variant="body2">{option.label}</Typography>}
          </MenuItem>
        )}
      />
    </FormControl>
  );
};

export default Autocomplete;
