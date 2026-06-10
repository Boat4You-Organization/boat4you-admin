import { useEffect, useMemo, useRef, useState } from 'react';

import { Autocomplete, Box, Chip, TextField, Typography } from '@mui/material';

import { api } from '@/config/axios.config';
import colors from '@/styles/themes/colors';

/**
 * Admin destination picker. Re-uses the customer `/public/locations` endpoint
 * (unified search across COUNTRY / REGION / MARINA) with a light debounce and
 * groups results by location type — mirroring how the customer homepage
 * autocomplete behaves (same data source, same grouping semantics).
 *
 * Intentionally slimmer than the customer widget: no popular searches, no
 * geolocation, no recent searches. Admin is task-focused; they type a name
 * and pick.
 */

export interface LocationOption {
  id: string; // synthetic id like "c-54" / "r-5" / "l-1242"
  name: string;
  countryCode: string | null;
  locationType: 'COUNTRY' | 'REGION' | 'CITY' | 'MARINA';
}

interface LocationPickerProps {
  value: LocationOption[];
  onChange: (next: LocationOption[]) => void;
  label?: string;
  placeholder?: string;
}

const TYPE_COLOR: Record<LocationOption['locationType'], string> = {
  COUNTRY: colors.green500,
  REGION: colors.mandalay900,
  CITY: colors.blue500,
  MARINA: colors.blue500,
};

const TYPE_LABEL: Record<LocationOption['locationType'], string> = {
  COUNTRY: 'country',
  REGION: 'region',
  CITY: 'city',
  MARINA: 'marina',
};

const LocationPicker = ({
  value,
  onChange,
  label = 'Destination',
  placeholder = 'Search country, region, city or marina',
}: LocationPickerProps) => {
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(false);
  // Debounce the backend call so every keystroke doesn't fire a request.
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const selectedIds = value.map(v => v.id);
        const params = new URLSearchParams();

        if (input.trim()) params.set('name', input.trim());

        selectedIds.forEach(id => params.append('selected', id));
        params.set('size', '25');

        const { data } = await api.get(`/public/locations?${params.toString()}`);

        setOptions(data?.content || []);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    
return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [input, value]);

  const groupedOptions = useMemo(
    () =>
      // Push selected to the top of the list so they're visible as chips in
      // the dropdown for easy removal.
      [...value, ...options.filter(o => !value.find(v => v.id === o.id))],
    [options, value]
  );

  return (
    <Autocomplete
      multiple
      fullWidth
      options={groupedOptions}
      value={value}
      filterOptions={x => x}
      getOptionLabel={o => o.name}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      groupBy={o => `${TYPE_LABEL[o.locationType]  }s`}
      loading={loading}
      onInputChange={(_, v, reason) => {
        // Ignore the "reset" event that fires when the user picks an option
        // (clears the input on the library's side) — we want to keep showing
        // the same results for follow-up picks without a round-trip.
        if (reason === 'input') setInput(v);
      }}
      onChange={(_, next) => onChange(next)}
      renderTags={(selected, getTagProps) =>
        selected.map((option, index) => (
          <Chip
            label={option.name}
            size="small"
            {...getTagProps({ index })}
            key={option.id}
            sx={{ backgroundColor: colors.blue50, color: colors.blue500, fontWeight: 600 }}
          />
        ))
      }
      renderOption={(props, option) => {
        const { key, ...otherProps } = props as typeof props & { key: string };

        
return (
          <Box component="li" {...otherProps} key={key}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
              <Typography variant="body2" sx={{ flex: 1 }}>
                {option.name}
              </Typography>
              <Typography
                sx={{ fontSize: '0.75rem', lineHeight: 1.66, letterSpacing: '0.03333em', color: TYPE_COLOR[option.locationType], fontWeight: 600 }}
              >
                {TYPE_LABEL[option.locationType]}
              </Typography>
            </Box>
          </Box>
        );
      }}
      renderInput={params => (
        <TextField {...params} label={label} placeholder={value.length === 0 ? placeholder : ''} />
      )}
    />
  );
};

export default LocationPicker;
