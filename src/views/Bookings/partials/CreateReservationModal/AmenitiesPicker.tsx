import { useEffect, useState } from 'react';

import { Autocomplete, TextField } from '@mui/material';

import { api } from '@/config/axios.config';

/**
 * Multi-select amenities picker. Hits `/public/amenities` once on mount —
 * this is a small, cacheable list (~30 items). Selected ids flow into the
 * yacht search via the existing `amenities` query param on `/public/yachts`.
 */

interface Amenity {
  id: number;
  key: string;       // kebab-case label_code, e.g. "air-conditioning"
  name?: string;
  labelCode?: string;
}

interface AmenitiesPickerProps {
  value: number[];
  onChange: (next: number[]) => void;
  hideLabel?: boolean;
}

const humanize = (a: Amenity) =>
  a.name || a.labelCode || a.key?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || `#${a.id}`;

const AmenitiesPicker = ({ value, onChange, hideLabel = false }: AmenitiesPickerProps) => {
  const [options, setOptions] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    // CatalogueController mounts at `/public/catalogue`, so the actual path
    // is `/public/catalogue/amenities`. Returns a plain list, no envelope.
    api
      .get('/public/catalogue/amenities')
      .then(({ data }) => {
        const list: Amenity[] = Array.isArray(data) ? data : data?.content || [];

        setOptions(list);
      })
      .catch(() => setOptions([]))
      .finally(() => setLoading(false));
  }, []);

  const selectedOptions = options.filter(o => value.includes(o.id));

  return (
    <Autocomplete
      multiple
      fullWidth
      size={hideLabel ? 'small' : 'medium'}
      options={options}
      value={selectedOptions}
      getOptionLabel={humanize}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      loading={loading}
      onChange={(_, next) => onChange(next.map(o => o.id))}
      renderInput={params => (
        <TextField
          {...params}
          label={hideLabel ? undefined : 'Amenities'}
          placeholder={value.length === 0 ? 'AC, Bimini, Dinghy…' : ''}
        />
      )}
    />
  );
};

export default AmenitiesPicker;
