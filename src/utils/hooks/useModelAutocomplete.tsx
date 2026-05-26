import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import debounce from 'lodash.debounce';

import Autocomplete from '@/components/Autocomplete';
import { FormInputProps } from '@/components/Forms/FormInput';
import { ManufacturerModel } from '@/models/catalogue.model';
import CatalogueService from '@/services/catalogue.service';

interface UseModelAutocompleteOptions {
  manufacturerId: number;
  modelId?: string;
}

function useModelAutocomplete({ manufacturerId, modelId }: UseModelAutocompleteOptions) {
  const [models, setModels] = useState<ManufacturerModel[] | null>(null);
  const [searchString, setSearchString] = useState<string>('');
  const { t } = useTranslation();

  useEffect(() => {
    if (!manufacturerId) {
      setModels(null);
      setSearchString('');

      return;
    }

    (async (): Promise<void> => {
      try {
        if (modelId) {
          const { content } = await CatalogueService.getAdminModels(manufacturerId, searchString, modelId);

          setModels(content);

          return;
        }

        const { content } = await CatalogueService.getAdminModels(manufacturerId, searchString);

        setModels(content);
      } catch {
        setModels([]);
      }
    })();
  }, [manufacturerId, modelId, searchString]);

  const handleInputChange = (value: string) => {
    setSearchString(value);
  };

  const renderModelInput: FormInputProps['renderInput'] = ({ field, error }) => (
    <Autocomplete
      value={field.value}
      options={models?.map(model => ({ id: `${model.id}`, label: `${model.name}` })) || []}
      onChange={field.onChange}
      onInputChange={debounce(handleInputChange, 500)}
      disabled={!manufacturerId}
      label={t('form.custom-boat.boatModel')}
      TextFieldProps={{
        placeholder: t('form.custom-boat.inputBoatModel'),
        error: !!error,
        helperText: error,
      }}
      clearable
    />
  );

  return renderModelInput;
}

export default useModelAutocomplete;
