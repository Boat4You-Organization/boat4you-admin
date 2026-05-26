import { useEffect, useState } from 'react';

import dayjs from 'dayjs';
import { t } from 'i18next';

import Form from '@/components/Forms/Form';
import ModalRoot from '@/components/ModalRoot';
import { PAGE_NUMBER } from '@/config/constants.config';
import { CustomYachtFormValues } from '@/config/forms/form-models.config';
import { UPDATE_CUSTOM_BOAT_FORM } from '@/config/forms/form-names.config';
import { YachtImage } from '@/models/custom-yacht.model';
import CustomYachtService from '@/services/custom-yacht.service';
import useQueryParams from '@/utils/hooks/useQueryParams';
import { clearSelectedCustomYacht, getCustomYachts } from '@/valtio/customYachts/customYachts.actions';
import { useCustomYachtsStore } from '@/valtio/customYachts/customYachts.store';
import { showToast } from '@/valtio/global/global.actions';

import UpdateCustomBoatForm from './UpdateCustomBoatForm';

interface UpdateCustomBoatsModalProps {
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

const UpdateCustomBoatsModal = ({ isOpen, onClose }: UpdateCustomBoatsModalProps) => {
  const { params: queryParams } = useQueryParams();
  const { search, page, sortBy, sortDirection } = queryParams;
  const { selectedCustomYacht } = useCustomYachtsStore();
  const [initialValues, setInitialValues] = useState<CustomYachtFormValues>(defaultValues);

  useEffect(() => {
    const prepareInitialValues = () => {
      if (!selectedCustomYacht) {
        setInitialValues(defaultValues);

        return;
      }

      let mainImageFile: File | null = null;
      const otherImages: File[] = [];

      if (selectedCustomYacht.yachtImages?.length) {
        const sortedImages = [...selectedCustomYacht.yachtImages].sort((a, b) => a.position - b.position);

        sortedImages.forEach((yachtImage: YachtImage) => {
          const filename = `yacht-image-${yachtImage.id}`;
          const placeholderFile = new File([], filename, { type: 'image/jpeg' });

          if (yachtImage.mainImage) {
            mainImageFile = placeholderFile;
          } else {
            otherImages.push(placeholderFile);
          }
        });
      }

      let pdfFile: File | null = null;

      if (selectedCustomYacht.pdf) {
        const pdfFilename = `yacht-brochure-${selectedCustomYacht.id}`;

        // Create an empty File placeholder for the PDF
        pdfFile = new File([], pdfFilename, { type: 'application/pdf' });
      }

      const newInitialValues: CustomYachtFormValues = {
        customYachtRequest: {
          name: selectedCustomYacht.name || '',
          manufacturerId: selectedCustomYacht.manufacturerId ? selectedCustomYacht.manufacturerId.toString() : '',
          modelId: selectedCustomYacht.modelId ? selectedCustomYacht.modelId.toString() : '',
          buildYear: selectedCustomYacht.buildYear,
          launchYear: selectedCustomYacht.launchYear,
          enginePower: selectedCustomYacht.enginePower,
          length: selectedCustomYacht.length,
          draught: selectedCustomYacht.draught,
          beam: selectedCustomYacht.beam,
          waterTank: selectedCustomYacht.waterTank,
          fuelTank: selectedCustomYacht.fuelTank,
          cabins: selectedCustomYacht.cabins,
          berths: selectedCustomYacht.berths,
          maxPersons: selectedCustomYacht.maxPersons,
          defaultCheckin: selectedCustomYacht.defaultCheckin
            ? dayjs(`2024-01-01 ${selectedCustomYacht.defaultCheckin}`)
            : null,
          defaultCheckout: selectedCustomYacht.defaultCheckout
            ? dayjs(`2024-01-01 ${selectedCustomYacht.defaultCheckout}`)
            : null,
          vesselType: selectedCustomYacht.vesselType ? selectedCustomYacht.vesselType.toString() : '',
          countryId: selectedCustomYacht.countryId || '',
          locationId: selectedCustomYacht.locationId || '',
          lowPrice: selectedCustomYacht.lowPrice,
          descriptions: {
            en: selectedCustomYacht.descriptions.en || '',
            hr: selectedCustomYacht.descriptions.hr || '',
            de: selectedCustomYacht.descriptions.de || '',
            fr: selectedCustomYacht.descriptions.fr || '',
            es: selectedCustomYacht.descriptions.es || '',
            it: selectedCustomYacht.descriptions.it || '',
            pt: selectedCustomYacht.descriptions.pt || '',
            pl: selectedCustomYacht.descriptions.pl || '',
            nl: selectedCustomYacht.descriptions.nl || '',
          },
          videoUrl: selectedCustomYacht.videoUrl || '',
          equipmentIds: selectedCustomYacht.equipment?.map(eq => eq.equipment.id.toString()) || [],
          crewNumber: selectedCustomYacht.crewNumber,
          manufacturerName: '',
          modelName: '',
          priceDescription: selectedCustomYacht.priceDescription || '',
          amenitiesText: selectedCustomYacht.amenitiesText || '',
          toysText: selectedCustomYacht.toysText || '',
          engineText: selectedCustomYacht.engineText || '',
        },
        mainImage: mainImageFile,
        images: otherImages,
        pdf: pdfFile,
      };

      setInitialValues(newInitialValues);
    };

    prepareInitialValues();
  }, [selectedCustomYacht]);

  if (!selectedCustomYacht) return null;

  const refreshView = () => {
    const pageNumber = page - PAGE_NUMBER;

    getCustomYachts(pageNumber, search, sortBy, sortDirection);
  };

  const handleClose = () => {
    onClose();
    clearSelectedCustomYacht();
  };

  const handleSubmit = async (formValues: CustomYachtFormValues) => {
    if (!selectedCustomYacht) {
      return;
    }

    const transformedData = {
      ...formValues.customYachtRequest,
      defaultCheckin: formValues.customYachtRequest.defaultCheckin
        ? formValues.customYachtRequest.defaultCheckin.format('HH:mm')
        : null,
      defaultCheckout: formValues.customYachtRequest.defaultCheckout
        ? formValues.customYachtRequest.defaultCheckout.format('HH:mm')
        : null,
    };

    const { payload, message } = await CustomYachtService.updateCustomYacht(selectedCustomYacht.id, transformedData);

    showToast({
      status: payload ? 'success' : 'error',
      text: payload
        ? t('toast-messages.update-custom-boat-successfully')
        : message || t('toast-messages.update-custom-boat-failed'),
    });

    if (payload) {
      handleClose();
      refreshView();
    }
  };

  return (
    <ModalRoot
      open={isOpen}
      onClose={handleClose}
      title={t('actions.update-yacht')}
      onCancel={handleClose}
      confirmBtnText={t('actions.update')}
      cancelBtnText={t('actions.cancel')}
      ConfirmBtnProps={{
        form: UPDATE_CUSTOM_BOAT_FORM,
        type: 'submit',
      }}
      slotProps={{ paper: { sx: { maxWidth: 670 } } }}
    >
      <Form
        key={selectedCustomYacht?.id}
        defaultValues={initialValues}
        onSubmit={handleSubmit}
        id={UPDATE_CUSTOM_BOAT_FORM}
        mode="onBlur"
      >
        <UpdateCustomBoatForm />
      </Form>
    </ModalRoot>
  );
};

export default UpdateCustomBoatsModal;
