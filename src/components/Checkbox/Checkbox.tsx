import { FormControlLabel, Checkbox as MuiCheckbox, CheckboxProps as MuiCheckboxProps } from '@mui/material';

import CheckboxChecked from '@/components/SvgIcons/Checkbox/CheckboxChecked';
import CheckboxUnchecked from '@/components/SvgIcons/Checkbox/CheckboxUnchecked';

interface CustomCheckboxProps extends MuiCheckboxProps {
  label?: string;
}

const Checkbox = ({ value, checked, onChange, label, ...props }: CustomCheckboxProps) => (
  <FormControlLabel
    control={
      <MuiCheckbox
        value={value}
        checked={checked}
        onChange={onChange}
        icon={<CheckboxUnchecked />}
        checkedIcon={<CheckboxChecked />}
        {...props}
      />
    }
    label={label}
    sx={{ marginInline: 0, '& .MuiFormControlLabel-label': { ml: 1 } }}
  />
);

export default Checkbox;
