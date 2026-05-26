import { ChangeEvent, useState } from 'react';

import { InputAdornment, TextField } from '@mui/material';
import debounce from 'lodash.debounce';

import SearchIcon from '@/components/SvgIcons/Search';

interface SearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disableDebounce?: boolean;
  fullWidth?: boolean;
  iconPosition?: 'start' | 'end';
}

const Search = ({ value, onChange, placeholder, disableDebounce, iconPosition = 'start', fullWidth }: SearchProps) => {
  const [searchValue, setSearchValue] = useState<string>(value);
  const [debouncedChangeHandler] = useState(() => debounce(onChange, 500));

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    setSearchValue(newValue);

    if (disableDebounce) {
      onChange(newValue);
    } else {
      debouncedChangeHandler(newValue);
    }
  };

  return (
    <TextField
      value={searchValue}
      placeholder={placeholder}
      onChange={handleChange}
      slotProps={{
        input: {
          startAdornment:
            iconPosition === 'start' ? (
              <InputAdornment position="start">
                <SearchIcon size={24} />
              </InputAdornment>
            ) : null,
          endAdornment:
            iconPosition === 'end' ? (
              <InputAdornment position="end">
                <SearchIcon size={24} />
              </InputAdornment>
            ) : null,
          inputProps: {
            inputMode: 'search',
          },
        },
      }}
      fullWidth={fullWidth}
    />
  );
};

export default Search;
