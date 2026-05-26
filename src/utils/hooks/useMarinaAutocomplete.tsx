import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Autocomplete from '@/components/Autocomplete';
import { FormInputProps } from '@/components/Forms/FormInput';
import { CountryCountModel } from '@/models/locations.model';
import LocationsService from '@/services/locations.service';

interface UseMarinaAutocompleteOptions {
  /**
   * The country picked in the same form, in `c-{N}` format. We resolve it
   * to a 2-letter country code internally (the marinas endpoint takes
   * countryCode like /regions does) and re-fetch whenever it changes. Null
   * keeps the dropdown disabled — admin must pick a country first.
   */
  countryId: string | null | undefined;
}

const useMarinaAutocomplete = ({ countryId }: UseMarinaAutocompleteOptions) => {
  const [marinas, setMarinas] = useState<CountryCountModel[] | null>(null);
  const { t } = useTranslation('form');

  useEffect(() => {
    if (!countryId) {
      setMarinas(null);

      return;
    }

    let cancelled = false;
    (async (): Promise<void> => {
      // Resolve countryId ("c-86") -> countryCode ("GR") via the same
      // /public/countries endpoint useCountryAutocomplete already calls.
      // Two fetches per marina-dropdown mount but the responses are small
      // and Spring's countriesCache covers the country list server-side,
      // so the cost is negligible.
      const countries = await LocationsService.getCountires();
      const country = countries.find(c => c.id === countryId);
      if (!country?.countryCode) {
        if (!cancelled) setMarinas([]);

        return;
      }
      const data = await LocationsService.getMarinasByCountry(country.countryCode);
      if (!cancelled) setMarinas(data);
    })();

    return () => {
      cancelled = true;
    };
  }, [countryId]);

  const renderMarinaInput: FormInputProps['renderInput'] = ({ field, error }) => (
    <Autocomplete
      value={field.value}
      options={marinas?.map(m => ({ id: `${m.id}`, label: m.name })) || []}
      label={t('custom-boat.marina')}
      onChange={field.onChange}
      disabled={!countryId}
      TextFieldProps={{
        placeholder: countryId
          ? t('custom-boat.inputMarina')
          : t('custom-boat.selectCountryFirst'),
        error: !!error,
        helperText: error,
      }}
    />
  );

  return renderMarinaInput;
};

export default useMarinaAutocomplete;
