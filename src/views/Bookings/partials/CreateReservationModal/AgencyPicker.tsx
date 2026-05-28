import { useEffect, useRef, useState } from 'react';

import { Autocomplete, Box, Chip, TextField, Typography } from '@mui/material';

import { api } from '@/config/axios.config';
import colors from '@/styles/themes/colors';

/**
 * Admin filter for charter companies / agencies. Hits `/admin/agencies?name=…`
 * with debounce. Multi-select — empty = all agencies (no filter applied).
 * Mirrors the "Charter Company" dropdown on the Nausys admin search, except
 * we allow multi-select because it's common to check a handful of partners
 * at once ("Adriatic Sailing or Croatia Yachting").
 */

interface Agency {
  id: number;
  name: string;
  countryCode?: string;
  primarySource?: string; // MMK / NauSys
}

interface AgencyPickerProps {
  value: Agency[];
  onChange: (next: Agency[]) => void;
  // When true, the floating MUI label ("Charter company") is suppressed and
  // the picker relies on a section label rendered above it by the parent.
  // Used by the Offers workspace to avoid double labeling; Bookings keeps
  // the internal label since it has no outer section.
  hideLabel?: boolean;
}

const AgencyPicker = ({ value, onChange, hideLabel = false }: AgencyPickerProps) => {
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);
  // Monotonically increasing request id. A fresh effect bumps this and
  // captures the value in the closure; when the async fetch resolves we
  // only accept the result if it's still the latest one. Protects against
  // the stale-response race where two fetches are inflight (e.g. initial
  // empty-input fetch from mount + a fast re-typed query) and the slow
  // empty-input response lands AFTER the narrowed query, clobbering
  // options back to the full list. React 18 strict-mode double-invokes
  // effects in dev, which makes this race very easy to trigger.
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    requestIdRef.current += 1;

    const id = requestIdRef.current;

    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        // Use the admin endpoint directly so we can ask for a larger page
        // size than the shared `AgenciesService.getAgencies()` default (20).
        // A typical admin has 100–300 agencies; 500 covers the dropdown
        // without paging. Name filter server-side narrows as user types.
        const qs = new URLSearchParams();

        qs.set('size', '500');
        qs.set('sort', 'name,asc');
        qs.set('active', 'true');

        if (input.trim()) qs.set('name', input.trim());

        const { data } = await api.get(`/admin/agencies?${qs.toString()}`);

        if (id !== requestIdRef.current) return; // stale response from a faster race-winner

        setOptions((data?.content || []) as Agency[]);
      } catch {
        if (id !== requestIdRef.current) return;

        setOptions([]);
      } finally {
        if (id === requestIdRef.current) setLoading(false);
      }
    }, 250);
    
return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [input]);

  // Dedupe selected into the options list so they're always visible.
  const merged = [...value, ...options.filter(o => !value.find(v => v.id === o.id))];

  return (
    <Autocomplete
      multiple
      fullWidth
      size={hideLabel ? 'small' : 'medium'}
      // Open dropdown as soon as the input is focused so the broker sees
      // the loading spinner + partial matches while typing. Without this,
      // MUI Autocomplete waits for ≥1 char before opening, and the "typed
      // letters didn't match" feeling lingers even after the request
      // completes.
      openOnFocus
      options={merged}
      value={value}
      // Backend already runs `LOWER(a.name) LIKE '%:name%'` — disable the
      // client-side default filter entirely so we don't re-filter the
      // server response (which would hide agencies whose name contains
      // the search term but doesn't START with it, e.g. "nava" vs
      // "Nautika Centar Nava").
      filterOptions={x => x}
      getOptionLabel={o => o.name}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      loading={loading}
      onInputChange={(_, v, reason) => {
        // Accept input from typing AND clear events so the dropdown
        // resets when the user empties the field. Without handling
        // 'clear' we'd keep the last search results stuck on screen.
        if (reason === 'input' || reason === 'clear') setInput(v);
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
        const { key, ...rest } = props as typeof props & { key: string };

        
return (
          <Box component="li" {...rest} key={key}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
              <Typography variant="body2" sx={{ flex: 1 }}>
                {option.name}
              </Typography>
              {option.primarySource && (
                <Typography variant="body2" color={colors.black500} sx={{ fontSize: 12 }}>
                  {option.primarySource}
                </Typography>
              )}
            </Box>
          </Box>
        );
      }}
      renderInput={params => (
        <TextField
          {...params}
          label={hideLabel ? undefined : 'Charter company'}
          placeholder={value.length === 0 ? 'Adriatic Sailing, Croatia Yachting…' : ''}
        />
      )}
    />
  );
};

export default AgencyPicker;
export type { Agency };
