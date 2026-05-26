import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import AutocompleteMultipleChip from '@/components/AutocompleteMultipleChip';
import { FormInputProps } from '@/components/Forms/FormInput/FormInput';
import { Equipment } from '@/models/equipment.model';
import CatalogueService from '@/services/catalogue.service';

const useEquipmentsAutocomplete = () => {
  const { t } = useTranslation();
  const [equipments, setEquipments] = useState<Equipment[] | null>(null);

  useEffect(() => {
    (async (): Promise<void> => {
      const { content } = await CatalogueService.getEquipments();

      setEquipments(content);
    })();
  }, []);

  const renderEquipmentsInput: FormInputProps['renderInput'] = ({ field }) => (
    <AutocompleteMultipleChip
      value={field.value}
      options={
        equipments?.map(equipment => ({ id: `${equipment.id}`, label: t(`amenities.${equipment.labelCode}`) })) || []
      }
      onChange={field.onChange}
      placeholder={t('form.custom-boat.choose-equipment')}
      TextFieldProps={{
        variant: 'outlined',
        fullWidth: true,
      }}
    />
  );

  return renderEquipmentsInput;
};

export default useEquipmentsAutocomplete;
