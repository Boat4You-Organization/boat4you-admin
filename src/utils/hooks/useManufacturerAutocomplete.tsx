import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import debounce from 'lodash.debounce';

import Autocomplete from '@/components/Autocomplete';
import { FormInputProps } from '@/components/Forms/FormInput';
import { ManufacturerModel } from '@/models/catalogue.model';
import CatalogueService from '@/services/catalogue.service';

interface UseManufacturerAutocompleteProps {
  manufacturerId?: string;
}

function useManufacturerAutocomplete({ manufacturerId }: UseManufacturerAutocompleteProps) {
  const [manufacturers, setManufacturers] = useState<ManufacturerModel[] | null>(null);
  const [searchString, setSearchString] = useState<string>('');
  const { t } = useTranslation();

  useEffect(() => {
    (async (): Promise<void> => {
      if (manufacturerId) {
        const { content } = await CatalogueService.getAdminManufacturers(searchString, manufacturerId);

        setManufacturers(content);

        return;
      }

      const { content } = await CatalogueService.getAdminManufacturers(searchString);

      setManufacturers(content);
    })();
  }, [manufacturerId, searchString]);

  const handleInputChange = (value: string) => {
    setSearchString(value);
  };

  const renderManufacturerInput: FormInputProps['renderInput'] = ({ field, error }) => (
    <Autocomplete
      value={field.value}
      options={manufacturers?.map(manufacturer => ({ id: `${manufacturer.id}`, label: `${manufacturer.name}` })) || []}
      onChange={field.onChange}
      onInputChange={debounce(handleInputChange, 500)}
      label={t('form.custom-boat.manufacturer')}
      TextFieldProps={{
        placeholder: t('form.custom-boat.inputManufacturer'),
        error: !!error,
        helperText: error,
      }}
      clearable
    />
  );

  return renderManufacturerInput;
}

export default useManufacturerAutocomplete;
