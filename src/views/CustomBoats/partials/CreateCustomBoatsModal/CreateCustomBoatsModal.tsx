import { t } from 'i18next';

import DiscardDialog from '@/components/DiscardDialog';
import Form from '@/components/Forms/Form';
import ModalRoot from '@/components/ModalRoot';
import { PAGE_NUMBER } from '@/config/constants.config';
import { CustomYachtFormValues } from '@/config/forms/form-models.config';
import { CREATE_CUSTOM_BOAT_FORM } from '@/config/forms/form-names.config';
import CustomYachtService from '@/services/custom-yacht.service';
import useQueryParams from '@/utils/hooks/useQueryParams';
import useToggleState from '@/utils/hooks/useToggleState';
import { clearSelectedCustomYacht, getCustomYachts } from '@/valtio/customYachts/customYachts.actions';
import { setIsFormDirty, showToast } from '@/valtio/global/global.actions';
import { useGlobalStore } from '@/valtio/global/global.store';

import CreateCustomBoatForm from './CreateCustomBoatForm';

interface CreateCustomBoatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const defaultValues: CustomYachtFormValues = {
  customYachtRequest: {
    name: '',
    manufacturerId: '',
    modelId: '',
    buildYear: null,
    launchYear: null,
    enginePower: null,
    length: null,
    draught: null,
    beam: null,
    waterTank: null,
    fuelTank: null,
    cabins: null,
    berths: null,
    maxPersons: null,
    defaultCheckin: null,
    defaultCheckout: null,
    vesselType: '',
    countryId: '',
    locationId: '',
    lowPrice: null,
    descriptions: {
      en: '',
      hr: '',
      de: '',
      fr: '',
      es: '',
      it: '',
      pt: '',
      pl: '',
      nl: '',
    },
    videoUrl: '',
    equipmentIds: [],
    crewNumber: null,
    manufacturerName: '',
    modelName: '',
    priceDescription: '',
    amenitiesText: '',
    toysText: '',
    engineText: '',
  },
  mainImage: null,
  images: [],
  pdf: null,
};

const CreateCustomBoatsModal = ({ isOpen, onClose }: CreateCustomBoatsModalProps) => {
  const { params: queryParams } = useQueryParams();
  const [discard, toggleDiscard] = useToggleState();
  const { isFormDirty } = useGlobalStore();
  const { search, page, sortBy, sortDirection } = queryParams;

  const refreshView = () => {
    const pageNumber = page - PAGE_NUMBER;

    getCustomYachts(pageNumber, search, sortBy, sortDirection);
    clearSelectedCustomYacht();
  };

  const handleSubmit = async (formValues: CustomYachtFormValues) => {
    const { payload, message } = await CustomYachtService.createCustomYacht(formValues);

    showToast({
      status: payload ? 'success' : 'error',
      text: payload
        ? t('toast-messages.create-custom-boat-successfully')
        : message || t('toast-messages.create-custom-boat-failed'),
    });

    if (payload) {
      onClose();
      refreshView();
    }
  };

  return (
    <ModalRoot
      open={isOpen}
      onClose={isFormDirty ? toggleDiscard : onClose}
      title={t('actions.create-yacht')}
      onCancel={isFormDirty ? toggleDiscard : onClose}
      confirmBtnText={t('actions.create')}
      cancelBtnText={t('actions.cancel')}
      ConfirmBtnProps={{
        form: CREATE_CUSTOM_BOAT_FORM,
        type: 'submit',
      }}
      slotProps={{ paper: { sx: { maxWidth: 670 } } }}
    >
      <Form defaultValues={defaultValues} onSubmit={handleSubmit} id={CREATE_CUSTOM_BOAT_FORM} mode="onBlur">
        {({ formState: { isDirty } }) => {
          setIsFormDirty(isDirty);

          return (
            <>
              <CreateCustomBoatForm />
              <DiscardDialog isOpen={discard} onClose={toggleDiscard} onDiscard={onClose} />
            </>
          );
        }}
      </Form>
    </ModalRoot>
  );
};

export default CreateCustomBoatsModal;
