import React from 'react';

import { ExpandMoreRounded } from '@mui/icons-material';
import {
  FormControl,
  FormHelperText,
  FormLabel,
  MenuItem,
  Select as MuiSelect,
  SelectChangeEvent,
  Stack,
  SxProps,
  Theme,
  Typography,
} from '@mui/material';

import Check from '@/components/SvgIcons/Check';
import colors from '@/styles/themes/colors';
import typography from '@/styles/themes/typography';

export interface SelectOption {
  id: string;
  label: string | React.ReactElement;
  icon?: React.ReactNode;
}

export interface SelectProps {
  value?: string;
  options: SelectOption[];
  onChange: (event: SelectChangeEvent) => void;
  label?: string;
  placeholder?: string | React.ReactElement;
  error?: string | undefined;
  sx?: SxProps<Theme>;
}

const Select = ({ value, options, onChange, label, placeholder, error, sx }: SelectProps) => (
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
    <MuiSelect
      onChange={onChange}
      value={value}
      IconComponent={ExpandMoreRounded}
      error={!!error}
      displayEmpty
      sx={sx}
      renderValue={selected => {
        if (!selected) {
          return typeof placeholder === 'string' ? (
            <Typography variant="body1" color={colors.black300}>
              {placeholder}
            </Typography>
          ) : (
            placeholder
          );
        }

        const option = options.find(opt => opt.id === selected);

        return (
          <Stack direction="row" alignItems="center" gap={1}>
            {option?.icon && option.icon}
            <Typography variant="body1">{option?.label}</Typography>
          </Stack>
        );
      }}
      MenuProps={{
        PaperProps: {
          sx: {
            padding: 2,
            borderRadius: '10px',
            marginTop: 1.5,
            '& .MuiList-root': {
              padding: 0,
              gap: 1,
            },
            '& .MuiMenuItem-root': {
              padding: '12px 16px',
              borderRadius: '12px',
              '&:last-child': {
                marginBottom: 0,
              },
            },
          },
        },
      }}
    >
      {options.map(option => (
        <MenuItem key={option.id} value={option.id}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%" spacing={1}>
            <Stack direction="row" alignItems="center" gap={1}>
              {option.icon && option.icon}
              <Typography variant="body1">{option.label}</Typography>
            </Stack>
            {value === option.id && <Check size={24} fill={colors.blue500} />}
          </Stack>
        </MenuItem>
      ))}
    </MuiSelect>
    <FormHelperText error={!!error}>{error}</FormHelperText>
  </FormControl>
);

export default Select;
