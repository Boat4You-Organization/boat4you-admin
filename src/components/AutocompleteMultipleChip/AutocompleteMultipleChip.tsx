import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Close } from '@mui/icons-material';
import {
  AutocompleteRenderOptionState,
  FormControl,
  IconButton,
  InputAdornment,
  Autocomplete as MuiAutocomplete,
  OutlinedInputProps,
  TextField,
  TextFieldProps as TextFieldPropsType,
} from '@mui/material';

import colors from '@/styles/themes/colors';

import styles from './AutocompleteMultipleChip.module.scss';
import SearchOptionItem from './SearchOptionItem';

export interface AutocompleteOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  group?: string;
}

export interface AutocompleteMultipleChipProps {
  inputValue?: string;
  value: string[];
  options: AutocompleteOption[];
  onChange: (value: string[]) => void;
  placeholder: string;
  onInputChange?: (value: string) => void;
  label?: string;
  disabled?: boolean;
  renderOption?: (option: AutocompleteOption, state: AutocompleteRenderOptionState) => React.ReactNode;
  filteredOptions?: AutocompleteOption[];
  TextFieldProps?: TextFieldPropsType;
  valueField?: 'id' | 'label';
}

const AutocompleteMultipleChip = ({
  inputValue,
  value,
  options,
  onChange,
  placeholder,
  onInputChange,
  disabled,
  filteredOptions,
  valueField = 'id',
}: AutocompleteMultipleChipProps) => {
  const { t } = useTranslation('common');

  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState<AutocompleteOption[]>([]);

  useEffect(() => {
    const selectedValues = options.filter(option => value.includes(option[valueField]));

    setInternalValue(selectedValues);
  }, [value, options, valueField]);

  const optionsWithSelection = useMemo(() => {
    const selectedSet = new Set(value);

    const uniqueOptions = options.reduce((acc, option) => {
      if (!acc.find(existing => existing.id === option.id)) {
        acc.push(option);
      }

      return acc;
    }, [] as AutocompleteOption[]);

    const selected = uniqueOptions.filter(option => selectedSet.has(option[valueField]));
    const nonSelected = uniqueOptions.filter(option => !selectedSet.has(option[valueField]));

    return [...selected, ...nonSelected];
  }, [options, value, valueField]);

  const handleIsOptionEqualToValue = (option: AutocompleteOption, inputValues: AutocompleteOption) =>
    option.id === inputValues.id;

  const getOptionDisabled = (option: AutocompleteOption) =>
    filteredOptions?.every(filteredOption => filteredOption.id !== option.id) || false;

  const handleChange = (_: React.SyntheticEvent, newValue: AutocompleteOption[]) => {
    onChange(newValue.map(option => option[valueField]));
  };

  const handleClearValues = () => {
    onChange([]);

    if (onInputChange) {
      onInputChange('');
    }
  };

  const handleInputChange = (_: React.SyntheticEvent, newInputValue: string, reason: string) => {
    if (onInputChange && reason === 'input') {
      onInputChange(newInputValue);
    }
  };

  return (
    <FormControl
      fullWidth
      sx={{
        cursor: 'pointer',
        flex: 1,
        height: 'auto',
        position: 'relative',
        borderRadius: '10px',
        border: `1px solid ${isFocused ? colors.blue500 : colors.black200}`,
        '&:hover': {
          borderColor: isFocused ? colors.blue500 : colors.black950,
        },
      }}
    >
      {internalValue.length > 0 && (
        <InputAdornment
          position="end"
          sx={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 2,
            cursor: 'pointer',
          }}
        >
          <IconButton onClick={handleClearValues} sx={{ background: 'transparent', color: colors.black950 }}>
            <Close fontSize="small" />
          </IconButton>
        </InputAdornment>
      )}
      <MuiAutocomplete
        multiple
        disableClearable
        disableCloseOnSelect
        limitTags={4}
        forcePopupIcon={false}
        value={internalValue}
        options={optionsWithSelection}
        inputValue={inputValue}
        classes={{ root: styles.root, paper: styles.paper }}
        onChange={handleChange}
        onInputChange={handleInputChange}
        isOptionEqualToValue={handleIsOptionEqualToValue}
        getOptionDisabled={getOptionDisabled}
        getOptionLabel={option => option.label}
        noOptionsText={t('no-matches')}
        disabled={disabled}
        sx={{
          flex: 1,
          '& .MuiFormControl-root': {
            position: 'relative',
            height: '100%',
            paddingInline: 0,
            flex: 1,
            cursor: 'pointer',
          },
          '& .MuiOutlinedInput-root': {
            position: 'relative',
            height: '100%',
            flexWrap: 'nowrap',
            padding: 0,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            background: 'transparent',
            flex: 1,
            cursor: 'pointer',
            '&::-webkit-scrollbar': {
              display: 'none',
            },
            '& .MuiAutocomplete-tag': {
              fontSize: 16,
            },
            '& .MuiAutocomplete-input': {
              height: '100%',
              cursor: 'pointer',
              '&::placeholder': {
                fontSize: 16,
              },
            },
          },
        }}
        renderInput={params => (
          <TextField
            {...params}
            className={styles.input}
            placeholder={placeholder}
            onFocus={e => {
              setIsFocused(true);

              if (params.InputProps && 'onFocus' in params.InputProps) {
                const inputProps = params.InputProps as OutlinedInputProps;

                inputProps.onFocus?.(e);
              }
            }}
            onBlur={e => {
              setIsFocused(false);

              if (params.InputProps && 'onBlur' in params.InputProps) {
                const inputProps = params.InputProps as OutlinedInputProps;

                inputProps.onBlur?.(e);
              }
            }}
            slotProps={{
              input: {
                ...params.InputProps,
                startAdornment: params.InputProps.startAdornment,
              },
            }}
          />
        )}
        renderOption={(props, option, { selected }) => {
          const { ...otherProps } = props;

          return (
            <SearchOptionItem
              key={option.id}
              label={option.label}
              icon={option.icon}
              selected={selected}
              props={otherProps}
            />
          );
        }}
        slotProps={{
          clearIndicator: {
            sx: {
              display: 'none',
            },
          },
          listbox: {
            sx: {
              padding: 2,
            },
          },
          popper: {
            sx: {
              '& .MuiPaper-root': {
                marginTop: '12px',
                minWidth: '348px',
                marginLeft: '-12px',
              },
            },
            placement: 'bottom-start',
            modifiers: [
              {
                name: 'offset',
                options: {
                  offset: [0, 8],
                },
              },
            ],
          },
        }}
      />
    </FormControl>
  );
};

export default AutocompleteMultipleChip;
