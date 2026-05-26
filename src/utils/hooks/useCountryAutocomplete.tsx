import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Autocomplete from '@/components/Autocomplete';
import { FormInputProps } from '@/components/Forms/FormInput';
import { CountryCountModel } from '@/models/locations.model';
import LocationsService from '@/services/locations.service';

const useCountryAutocomplete = () => {
  const [counties, setCountries] = useState<CountryCountModel[] | null>(null);
  const { t } = useTranslation('form');

  useEffect(() => {
    (async (): Promise<void> => {
      const data = await LocationsService.getCountires();

      setCountries(data);
    })();
  }, []);

  const renderCountryInput: FormInputProps['renderInput'] = ({ field, error }) => (
    <Autocomplete
      value={field.value}
      options={counties?.map(country => ({ id: `${country.id}`, label: country.name })) || []}
      label={t('custom-boat.country')}
      onChange={field.onChange}
      TextFieldProps={{
        placeholder: t('custom-boat.input-country'),
        error: !!error,
        helperText: error,
      }}
    />
  );

  return renderCountryInput;
};

export default useCountryAutocomplete;
