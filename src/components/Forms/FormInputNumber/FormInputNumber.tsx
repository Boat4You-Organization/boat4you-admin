import { JSX, KeyboardEvent } from 'react';
import { Controller, ControllerProps, FieldError, Validate, useFormContext } from 'react-hook-form';

import { FormControl, FormLabel, TextField, TextFieldProps } from '@mui/material';

import typography from '@/styles/themes/typography';

export interface FormInputNumberProps<T = string> extends Omit<TextFieldProps, 'name' | 'type'> {
  name: ControllerProps['name'];
  formLabel?: string | JSX.Element;
  validate?: Validate<T, unknown> | Record<string, Validate<T, unknown>>;
  renderInput?: (field: Parameters<ControllerProps['render']>[0] & { error?: string }) => JSX.Element;
  allowDecimals?: boolean;
}

const handleNumericKeyPress = (event: KeyboardEvent<HTMLInputElement>, allowDecimals: boolean = true) => {
  if (event.ctrlKey || event.metaKey) return;

  const allowedKeys = [
    'Backspace',
    'Delete',
    'Tab',
    'Escape',
    'Enter',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
  ];

  const currentValue = (event.target as HTMLInputElement).value;

  if (event.key >= '0' && event.key <= '9') {
    return;
  }

  if (allowDecimals && event.key === '.' && !currentValue.includes('.')) {
    return;
  }

  if (allowedKeys.includes(event.key)) {
    return;
  }

  event.preventDefault();
};

const getNestedError = (name: string, errors: Record<string, unknown>): FieldError | undefined =>
  name.split(/[.[\]]+/).reduce((acc: unknown, key: string) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }

    return undefined;
  }, errors) as FieldError | undefined;

function FormInputNumber<T = string>({
  name,
  formLabel,
  validate,
  renderInput,
  helperText,
  allowDecimals = true,
  ...props
}: FormInputNumberProps<T>): JSX.Element {
  const { control } = useFormContext();

  const render: ControllerProps['render'] = (p): JSX.Element => {
    const error = getNestedError(name, p.formState.errors) as FieldError | undefined;
    const hasError = Boolean(error);

    if (renderInput) {
      return renderInput({ ...p, error: error?.message });
    }

    return (
      <FormControl fullWidth>
        {formLabel && (
          <FormLabel htmlFor={name} sx={{ mb: 1, ...typography.body1, fontWeight: 600 }}>
            {formLabel}
          </FormLabel>
        )}
        <TextField
          type="number"
          {...props}
          {...p.field}
          value={p.field.value ?? ''}
          slotProps={{
            ...props.slotProps,
            input: {
              inputProps: {
                inputMode: allowDecimals ? 'decimal' : 'numeric',
                min: 0,
                step: allowDecimals ? 'any' : '1',
                pattern: allowDecimals ? '[0-9]*\\.?[0-9]*' : '[0-9]*',
                onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => handleNumericKeyPress(event, allowDecimals),
              },
            },
          }}
          id={name}
          error={hasError}
          helperText={hasError ? error?.message : helperText}
          sx={{
            '& input[type=number]': {
              MozAppearance: 'textfield',
            },
            '& input[type=number]::-webkit-outer-spin-button': {
              WebkitAppearance: 'none',
              margin: 0,
            },
            '& input[type=number]::-webkit-inner-spin-button': {
              WebkitAppearance: 'none',
              margin: 0,
            },
            ...props.sx,
          }}
        />
      </FormControl>
    );
  };

  return <Controller name={name} control={control} rules={{ validate }} render={render} />;
}

export default FormInputNumber;
