/* eslint-disable @typescript-eslint/no-explicit-any, no-restricted-syntax */
import { useEffect, useMemo, useRef, useState } from 'react';

import { Autocomplete, Box, Chip, Stack, TextField } from '@mui/material';

import { api } from '@/config/axios.config';
import { bbColors } from '@/styles/bb';
import colors from '@/styles/themes/colors';

/**
 * Reusable pill/chip multi-toggle — click a pill to add/remove it from the
 * selection. Replaces the multi-Select dropdowns (Yacht type, Amenities) so a
 * pick applies instantly with no hanging menu. Selected = filled navy, unselected
 * = outlined. Pure presentational; parent owns the `selected` string[] state.
 */
export const ToggleChipGroup = ({
  options,
  selected,
  onToggle,
}: {
  options: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}) => (
  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
    {options.map(o => {
      const on = selected.includes(o.id);

      return (
        <Box
          key={o.id}
          component="button"
          type="button"
          onClick={() => onToggle(o.id)}
          sx={{
            cursor: 'pointer',
            font: 'inherit',
            fontSize: 12,
            fontWeight: 600,
            lineHeight: 1.2,
            px: 1.1,
            py: 0.45,
            borderRadius: 999,
            border: `1px solid ${on ? bbColors.navy900 : bbColors.gray300}`,
            backgroundColor: on ? bbColors.navy900 : colors.white,
            color: on ? colors.white : '#2c3e56',
            transition: 'all .12s ease',
            '&:hover': {
              borderColor: on ? bbColors.navy900 : bbColors.gray500,
              backgroundColor: on ? '#13283d' : bbColors.gray100,
            },
          }}
        >
          {o.label}
        </Box>
      );
    })}
  </Box>
);

/**
 * Offers-workspace specific filter pickers. Kept in this folder so we can
 * iterate on the broker UX without disrupting the shared CreateReservationModal
 * partials (which keep their own chip-style pickers).
 *
 *   CountrySelect        — single country, powered by /public/countries
 *   RegionMultiSelect    — regions filtered by selected country via /public/regions
 *   VesselTypeDropdown   — multi-select dropdown replacement for chip picker
 *   ManufacturerPicker   — multi-select autocomplete, /public/catalogue/manufacturers
 *   ModelPicker          — multi-select autocomplete, cascades on manufacturer ids
 *   BuildYearRangeField  — numeric "from / to" range
 */

// ---------- country ---------------------------------------------------------

export interface Country {
  id: string; // "c-54"
  name: string;
  countryCode: string; // "HR"
}

export const CountrySelect = ({
  value,
  onChange,
}: {
  value: Country | null;
  onChange: (next: Country | null) => void;
}) => {
  const [countries, setCountries] = useState<Country[]>([]);

  useEffect(() => {
    api
      .get('/public/countries')
      .then(({ data }) => {
        const list = (Array.isArray(data) ? data : []).map((c: any) => ({
          id: String(c.id),
          name: c.name,
          countryCode: c.countryCode || '',
        })) as Country[];

        setCountries(list.sort((a, b) => a.name.localeCompare(b.name)));
      })
      .catch(() => setCountries([]));
  }, []);

  return (
    <Autocomplete
      fullWidth
      options={countries}
      value={value}
      getOptionLabel={o => o.name}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      onChange={(_, next) => onChange(next)}
      size="small"
      renderInput={params => <TextField {...params} placeholder="Pick a country" />}
    />
  );
};

// ---------- region ----------------------------------------------------------

export interface Region {
  id: string; // primary region id ("r-6") — bucket anchor + Autocomplete key
  name: string;
  // One or more backend region ids this option represents. Dual-source regions
  // (the same area imported under two provider rows — e.g. "Ionian" +
  // "Ionian Islands") merge into ONE option whose `ids` carries BOTH, so a
  // single pick searches both provider pools. Usually just `[id]`.
  ids: string[];
}

// Dual-source region pairs: the same logical region is imported twice (one row
// per provider — MMK without country code, NauSys with it), splitting the yacht
// inventory across two ids. Picking one alone misses the other pool, so we merge
// each pair into a single option carrying BOTH ids. Matched by a distinctive
// keyword present in both member names (verified against the live
// /public/regions list). Mirrors the web's `dedupeRegionDuplicates`.
const REGION_MERGE_GROUPS: { label: string; keywords: string[] }[] = [
  { label: 'Ionian Islands', keywords: ['ionian'] }, //       "Ionian" + "Ionian Islands"
  { label: 'Sporades', keywords: ['sporades'] }, //           "Sporades" + "Skiathos/Sporades, Volos"
  { label: 'Athens / Saronic Gulf', keywords: ['saronic'] }, // "Athens / Saronic Gulf" + "Athens area/Saronic/Peloponese"
  // Italy: one provider lists the combined "Liguria / Toscana", the other splits it into
  // separate "Liguria" + "Tuscany" — collapse all three into one option so a single pick
  // searches the whole NW-coast inventory. Needs multi-keyword because "Tuscany" (EN) and
  // "Toscana" (in the combined row) don't share a substring.
  { label: 'Liguria / Tuscany', keywords: ['liguria', 'tuscany', 'toscana'] },
  // "Sardinia" + "Sardinia / Corsica" (the combined row carries country_code=IT so it surfaces).
  { label: 'Sardinia / Corsica', keywords: ['sardinia', 'corsica'] },
];

const mergeDualSourceRegions = (list: Region[]): Region[] => {
  const consumed = new Set<string>();
  const out: Region[] = [];

  REGION_MERGE_GROUPS.forEach(group => {
    const members = list.filter(r => group.keywords.some(k => r.name.toLowerCase().includes(k)));

    // Only collapse when BOTH provider rows are present; a lone member stays as-is.
    if (members.length > 1) {
      out.push({ id: members[0].id, name: group.label, ids: members.flatMap(m => m.ids) });
      members.forEach(m => consumed.add(m.id));
    }
  });

  list.forEach(r => {
    if (!consumed.has(r.id)) out.push(r);
  });

  return out.sort((a, b) => a.name.localeCompare(b.name));
};

export const RegionMultiSelect = ({
  countryCode,
  value,
  onChange,
}: {
  countryCode: string | null;
  value: Region[];
  onChange: (next: Region[]) => void;
}) => {
  const [regions, setRegions] = useState<Region[]>([]);

  useEffect(() => {
    if (!countryCode) {
      setRegions([]);
      
return;
    }

    api
      .get(`/public/regions?countryCode=${encodeURIComponent(countryCode)}`)
      .then(({ data }) => {
        const list = (Array.isArray(data) ? data : []).map((r: any) => ({
          id: String(r.id),
          name: r.name,
          ids: [String(r.id)],
        })) as Region[];

        setRegions(mergeDualSourceRegions(list));
      })
      .catch(() => setRegions([]));
  }, [countryCode]);

  return (
    <Autocomplete
      multiple
      fullWidth
      size="small"
      options={regions}
      value={value}
      getOptionLabel={o => o.name}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      disabled={!countryCode}
      onChange={(_, next) => onChange(next)}
      renderTags={(selected, getTagProps) =>
        selected.map((option, index) => (
          <Chip
            label={option.name}
            size="small"
            {...getTagProps({ index })}
            key={option.id}
            sx={{ backgroundColor: '#eef3f9', color: bbColors.navy700, fontWeight: 600 }}
          />
        ))
      }
      renderInput={params => (
        <TextField
          {...params}
          placeholder={countryCode ? 'Any region' : 'Pick a country first'}
        />
      )}
    />
  );
};

// ---------- amenities (chips, /offers only) ---------------------------------

/** Most-requested amenities surfaced as quick chips at the TOP of the list
 *  (Mario: brokers mostly want AC · Watermaker · Generator). The rest follow
 *  in catalogue order. labelCode-based so it's resilient to id changes. */
const PRIORITY_AMENITY_CODES = ['air-conditioning', 'water-maker', 'generator'];

interface AmenityOption {
  id: number;
  labelCode?: string;
  key?: string;
  name?: string;
}

const amenityLabel = (a: AmenityOption) =>
  a.name || a.labelCode || a.key?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || `#${a.id}`;

/**
 * Amenities as toggle chips (replaces the Autocomplete dropdown on /offers).
 * Fetches the live catalogue (`/public/catalogue/amenities`) so AC / Watermaker
 * / Generator etc. stay data-driven; priority three render first. Selection is
 * the same `number[]` of equipment ids the search already consumes.
 */
export const OffersAmenityChips = ({
  value,
  onChange,
}: {
  value: number[];
  onChange: (next: number[]) => void;
}) => {
  const [options, setOptions] = useState<AmenityOption[]>([]);

  useEffect(() => {
    api
      .get('/public/catalogue/amenities')
      .then(({ data }) => setOptions(Array.isArray(data) ? data : data?.content || []))
      .catch(() => setOptions([]));
  }, []);

  const ordered = useMemo(() => {
    const rank = (a: AmenityOption) => {
      const i = PRIORITY_AMENITY_CODES.indexOf(a.labelCode || a.key || '');

      return i === -1 ? PRIORITY_AMENITY_CODES.length : i;
    };

    return [...options].sort((a, b) => rank(a) - rank(b));
  }, [options]);

  const toggle = (idStr: string) => {
    const id = Number(idStr);

    onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id]);
  };

  if (options.length === 0) {
    return (
      <Box sx={{ fontSize: 12, color: bbColors.gray600 }}>Loading amenities…</Box>
    );
  }

  return (
    <ToggleChipGroup
      options={ordered.map(a => ({ id: String(a.id), label: amenityLabel(a) }))}
      selected={value.map(String)}
      onToggle={toggle}
    />
  );
};

// ---------- vessel type -----------------------------------------------------

export const VESSEL_TYPES_OFFERS: { id: string; label: string }[] = [
  { id: 'CATAMARAN', label: 'Catamaran' },
  { id: 'SAILING_YACHT', label: 'Sailing Yacht' },
  { id: 'POWER_CATAMARAN', label: 'Power Catamaran' },
  { id: 'GULET', label: 'Gulet' },
  { id: 'LUXURY_MOTOR_YACHT', label: 'Luxury Motor Yacht' },
  { id: 'MINI_CRUISER', label: 'Mini Cruiser' },
  { id: 'MOTORBOAT', label: 'Motorboat' },
  { id: 'MOTOR_YACHT', label: 'Motor Yacht' },
  { id: 'MOTORSAILER', label: 'Motorsailer' },
];

export const VesselTypeDropdown = ({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) => {
  // Toggle CHIPS instead of a multi-Select dropdown: a click applies
  // instantly and there's no menu that "stays open hanging" after a pick
  // (Mario's UX gripe). State shape (string[] of vessel ids) is unchanged,
  // so the search query keeps working exactly as before.
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id]);

  return <ToggleChipGroup options={VESSEL_TYPES_OFFERS} selected={value} onToggle={toggle} />;
};

// ---------- manufacturer ----------------------------------------------------

/**
 * A "manufacturer" on the UI is actually a CANONICAL GROUP that can span
 * multiple backend manufacturer ids. The catalogue has duplicates left over
 * from two partner sources merging records ("Lagoon" + "Lagoon-Bénéteau";
 * "Bali Catamarans" + "Catana" + "Catana Group"). Treating them as separate
 * in the picker UI would force the broker to hold cmd and tick both, and
 * would leak partner plumbing into the admin experience.
 *
 * Each alias regex below is matched against the raw backend name (case
 * insensitive). All matching ids collapse into one UI option. When the
 * picker value is used in search, we flatten back to the full id list.
 */
const MANUFACTURER_ALIASES: { canonical: string; matches: RegExp }[] = [
  { canonical: 'Lagoon', matches: /^lagoon/i },
  { canonical: 'Bali', matches: /^(bali|catana)/i },
];

export interface Manufacturer {
  canonical: string; // display label AND stable identity key
  ids: number[]; // all backend manufacturer ids that resolve to this group
}

const useDebouncedSearch = <T,>(fetcher: (q: string) => Promise<T[]>, delay = 250) => {
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<number | null>(null);
  // Sequence id — only the latest inflight fetch is allowed to write
  // back into state. Prevents stale-response clobber when React 18's
  // strict-mode double-invokes effects in dev and the slower first
  // fetch resolves after the narrowed second fetch.
  const reqIdRef = useRef(0);

  useEffect(() => {
    if (ref.current) window.clearTimeout(ref.current);

    reqIdRef.current += 1;

    const id = reqIdRef.current;

    ref.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const result = await fetcher(input.trim());

        if (id !== reqIdRef.current) return;

        setOptions(result);
      } catch {
        if (id !== reqIdRef.current) return;

        setOptions([]);
      } finally {
        if (id === reqIdRef.current) setLoading(false);
      }
    }, delay);
    
return () => {
      if (ref.current) window.clearTimeout(ref.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  return { input, setInput, options, loading };
};

/**
 * Collapses the flat manufacturer list returned by the backend into
 * canonical groups via the MANUFACTURER_ALIASES table. Non-matching rows
 * are returned as their own single-id group.
 *
 * Keeps group order: canonical groups first (sorted alphabetically by
 * canonical name), then the remaining singletons sorted by name.
 */
const dedupManufacturers = (raw: { id: number; name: string }[]): Manufacturer[] => {
  const canonical = new Map<string, number[]>();
  const singletons: Manufacturer[] = [];

  for (const m of raw) {
    const rule = MANUFACTURER_ALIASES.find(a => a.matches.test(m.name));

    if (rule) {
      const list = canonical.get(rule.canonical) || [];

      list.push(m.id);
      canonical.set(rule.canonical, list);
    } else {
      singletons.push({ canonical: m.name, ids: [m.id] });
    }
  }

  const grouped = Array.from(canonical.entries())
    .map(([name, ids]) => ({ canonical: name, ids }))
    .sort((a, b) => a.canonical.localeCompare(b.canonical));

  singletons.sort((a, b) => a.canonical.localeCompare(b.canonical));
  
return [...grouped, ...singletons];
};

export const ManufacturerPicker = ({
  value,
  onChange,
}: {
  value: Manufacturer[];
  onChange: (next: Manufacturer[]) => void;
}) => {
  const { setInput, options, loading } = useDebouncedSearch<Manufacturer>(async q => {
    const qs = new URLSearchParams();

    // Pull the whole catalogue so the alias collapse runs on the complete
    // set — narrow server-side name search would hide matches under the
    // canonical (e.g. searching "lagoon" with 300-row page limit might
    // still return both "Lagoon" and "Lagoon-Bénéteau" but the user
    // needs to see them ALREADY collapsed before picking). Backend has
    // <2000 manufacturers so this is a cheap one-shot call.
    qs.set('size', '3000');
    qs.set('sort', 'name,asc');

    if (q) qs.set('name', q);

    const { data } = await api.get(`/public/catalogue/manufacturers?${qs.toString()}`);
    const raw = (data?.content || []).map((m: any) => ({ id: m.id, name: (m.name || '').trim() }));

    
return dedupManufacturers(raw);
  });

  const merged = [...value, ...options.filter(o => !value.find(v => v.canonical === o.canonical))];

  return (
    <Autocomplete
      multiple
      fullWidth
      size="small"
      openOnFocus
      options={merged}
      value={value}
      filterOptions={x => x}
      getOptionLabel={o => o.canonical}
      isOptionEqualToValue={(a, b) => a.canonical === b.canonical}
      loading={loading}
      onInputChange={(_, v, reason) => {
        if (reason === 'input' || reason === 'clear') setInput(v);
      }}
      onChange={(_, next) => onChange(next)}
      renderTags={(selected, getTagProps) =>
        selected.map((option, index) => (
          <Chip
            label={option.canonical}
            size="small"
            {...getTagProps({ index })}
            key={option.canonical}
            sx={{ backgroundColor: '#eef3f9', color: bbColors.navy700, fontWeight: 600 }}
          />
        ))
      }
      renderInput={params => (
        <TextField
          {...params}
          placeholder={value.length === 0 ? 'Builder' : ''}
        />
      )}
    />
  );
};

// ---------- model (cascades on manufacturer) -------------------------------

export interface Model {
  id: number;
  name: string;
  manufacturerId?: number;
}

export const ModelPicker = ({
  manufacturerIds,
  value,
  onChange,
}: {
  manufacturerIds: number[];
  value: Model[];
  onChange: (next: Model[]) => void;
}) => {
  // When manufacturer changes, re-pull the full list of its models. Keep the
  // hook input in a string so debounce tracks name-search changes too.
  const manufacturerKey = useMemo(() => manufacturerIds.join(','), [manufacturerIds]);

  const { setInput, options, loading } = useDebouncedSearch<Model>(async q => {
    if (!manufacturerIds.length) return [];

    const qs = new URLSearchParams();

    qs.set('size', '300');
    qs.set('sort', 'name,asc');
    manufacturerIds.forEach(id => qs.append('manufacturerIds', String(id)));

    if (q) qs.set('name', q);

    const { data } = await api.get(`/public/catalogue/models?${qs.toString()}`);

    
return (data?.content || []).map((m: any) => ({
      id: m.id,
      name: m.name,
      manufacturerId: m.manufacturerId,
    }));
  });

  // Force a refetch when the manufacturer list changes (by resetting `input`
  // to empty, which re-runs the debounce effect).
  useEffect(() => {
    setInput('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manufacturerKey]);

  const merged = [...value, ...options.filter(o => !value.find(v => v.id === o.id))];

  return (
    <Autocomplete
      multiple
      fullWidth
      size="small"
      options={merged}
      value={value}
      filterOptions={x => x}
      getOptionLabel={o => o.name}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      loading={loading}
      disabled={manufacturerIds.length === 0}
      onInputChange={(_, v, reason) => {
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
            sx={{ backgroundColor: '#eef3f9', color: bbColors.navy700, fontWeight: 600 }}
          />
        ))
      }
      renderInput={params => (
        <TextField
          {...params}
          placeholder={manufacturerIds.length === 0 ? 'Pick a builder first' : 'Model'}
        />
      )}
    />
  );
};

// ---------- build year range ------------------------------------------------

export const BuildYearRangeField = ({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) => (
  // No internal label — parent "Build year" Section provides the label.
  <Stack direction="row" spacing={1}>
    <TextField
      placeholder="From"
      type="number"
      value={from}
      onChange={e => onChange(e.target.value, to)}
      size="small"
      inputProps={{ min: 1980, max: 2030 }}
      fullWidth
    />
    <TextField
      placeholder="To"
      type="number"
      value={to}
      onChange={e => onChange(from, e.target.value)}
      size="small"
      inputProps={{ min: 1980, max: 2030 }}
      fullWidth
    />
  </Stack>
);
