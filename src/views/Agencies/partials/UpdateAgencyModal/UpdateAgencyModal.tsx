import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Box, Button, CircularProgress, Stack, Tabs } from '@mui/material';

import Form from '@/components/Forms/Form';
import ModalRoot from '@/components/ModalRoot';
import PillTab from '@/components/PillTab';
import { PAGE_NUMBER } from '@/config/constants.config';
import { UpdateAgencyFormValues } from '@/config/forms/form-models.config';
import { UPDATE_GENERAL_AGENCY_FORM, UPDATE_YACHTS_AGENCY_FORM } from '@/config/forms/form-names.config';
import { agenciesTabs } from '@/config/tabs.config';
import { AgencyPrimarySource, AgencyYachtModel } from '@/models/agencies.model';
import AgenciesService from '@/services/agencies.service';
import { bbColors } from '@/styles/bb';
import colors from '@/styles/themes/colors';
import useBreakpoint from '@/utils/hooks/useBreakpoint';
import useQueryParams from '@/utils/hooks/useQueryParams';
import { clearSelectedAgency, getAgencies, getSelectedAgency } from '@/valtio/agencies/agencies.actions';
import { useAgenciesStore } from '@/valtio/agencies/agencies.store';
import { showToast } from '@/valtio/global/global.actions';

import DiscountedTab from './DiscountedTab';
import GeneralTab from './GeneralTab';

interface UpdateAgencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const defaultValues: UpdateAgencyFormValues = {
  name: '',
  address: '',
  city: '',
  country: '',
  zip: '',
  vatCode: '',
  web: '',
  email: '',
  phone: '',
  mobile: '',
  iban: '',
  active: false,
  discount: 0,
  director: '',
  skipExternalSystem: true,
  recommended: false,
  primarySource: AgencyPrimarySource.UNKNOWN,
};

const UpdateAgencyModal = ({ isOpen, onClose }: UpdateAgencyModalProps) => {
  const { params: queryParams } = useQueryParams();
  const { search, page, sortBy, sortDirection } = queryParams;

  const [tabValue, setTabValue] = useState<number>(0);
  const [recalculating, setRecalculating] = useState<boolean>(false);
  const { isMobile } = useBreakpoint();
  const { selectedAgency } = useAgenciesStore();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedYachtAgency, setSelectedYachtAgency] = useState<AgencyYachtModel[]>([]);

  const initialValues: UpdateAgencyFormValues = selectedAgency
    ? {
        name: selectedAgency.name,
        address: selectedAgency.address,
        city: selectedAgency.city,
        country: selectedAgency.country,
        zip: selectedAgency.zip,
        vatCode: selectedAgency.vatCode,
        web: selectedAgency.web,
        email: selectedAgency.email,
        phone: selectedAgency.phone,
        mobile: selectedAgency.mobile,
        iban: selectedAgency.iban,
        active: selectedAgency.active,
        discount: selectedAgency.discount,
        director: selectedAgency.director,
        skipExternalSystem: selectedAgency.skipExternalSystem,
        recommended: selectedAgency.recommended ?? false,
        primarySource: selectedAgency.primarySource,
      }
    : defaultValues;

  if (!selectedAgency) return null;

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const refreshView = () => {
    const pageNumber = page - PAGE_NUMBER;

    getAgencies(pageNumber, search, sortBy, sortDirection);

    if (selectedAgency) {
      getSelectedAgency(selectedAgency.id);
    }
  };

  const handleSubmit = async (formValues: UpdateAgencyFormValues): Promise<void> => {
    if (!selectedAgency) {
      return;
    }

    if (formValues.active !== selectedAgency.active) {
      if (formValues.active) {
        await AgenciesService.activateAgency(selectedAgency.id);
      } else {
        await AgenciesService.deactivateAgency(selectedAgency.id);
      }
    }

    let mainPayload;
    let mainMessage;

    if (tabValue === 0) {
      const { payload, message } = await AgenciesService.updateAgency(selectedAgency.id, formValues);

      mainPayload = payload;
      mainMessage = message;
    } else {
      const { payload, message } = await AgenciesService.updateYachtsAgency(selectedAgency.id, selectedYachtAgency);

      mainPayload = payload;
      mainMessage = message;
    }

    showToast({
      status: mainPayload ? 'success' : 'error',
      text: mainPayload
        ? t('toast-messages.update-agency-successfully')
        : mainMessage || t('toast-messages.update-agency-failed'),
    });

    if (mainPayload) {
      onClose();
      refreshView();
    }
  };

  const handleClose = () => {
    onClose();
    clearSelectedAgency();
    navigate(`/agencies?${searchParams.toString()}`);
  };

  const handleYachtsChange = (yachts: AgencyYachtModel[]) => {
    setSelectedYachtAgency(yachts);
  };

  const handleRecalculate = async () => {
    if (!selectedAgency) return;

    setRecalculating(true);

    const { payload, message } = await AgenciesService.recalculatePrices(selectedAgency.id);
    const success = typeof payload === 'number' && payload >= 0;

    showToast({
      status: success ? 'success' : 'error',
      text: success
        ? `Recalculated prices: ${payload} offer(s) updated`
        : message || 'Recalculation failed',
    });
    setRecalculating(false);
  };

  const renderTabPanel = () => {
    switch (tabValue) {
      case 0:
        return (
          <Form defaultValues={initialValues} onSubmit={handleSubmit} id={UPDATE_GENERAL_AGENCY_FORM} mode="onBlur">
            <GeneralTab />
          </Form>
        );
      case 1:
        return (
          <Form defaultValues={initialValues} onSubmit={handleSubmit} id={UPDATE_YACHTS_AGENCY_FORM} mode="onBlur">
            <DiscountedTab agency={selectedAgency} onYachtsChange={handleYachtsChange} />
          </Form>
        );
      default:
        return null;
    }
  };

  return (
    <ModalRoot
      open={isOpen}
      fullScreen={isMobile}
      onClose={handleClose}
      title={selectedAgency?.name}
      cancelBtnText={t('actions.cancel')}
      onCancel={handleClose}
      confirmBtnText={t('actions.update')}
      ConfirmBtnProps={{
        form: tabValue === 0 ? UPDATE_GENERAL_AGENCY_FORM : UPDATE_YACHTS_AGENCY_FORM,
        type: 'submit',
      }}
    >
      <Stack sx={{ width: { xs: 'auto', md: 670 } }}>
        <Box sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            onClick={handleRecalculate}
            disabled={recalculating}
            fullWidth
            sx={{
              borderColor: bbColors.amber700,
              color: bbColors.amber700,
              backgroundColor: bbColors.amber100,
              '&:hover': {
                borderColor: bbColors.amber700,
                backgroundColor: bbColors.amber100,
                opacity: 0.85,
              },
            }}
          >
            {recalculating ? (
              <CircularProgress size={20} sx={{ color: bbColors.amber700 }} />
            ) : (
              'Recalculate prices for existing offers'
            )}
          </Button>
        </Box>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          scrollButtons={false}
          sx={{
            mb: 3,
            '& .MuiTabs-flexContainer': {
              border: `1px solid ${colors.black200}`,
              borderRadius: '100px',
              gap: '16px',
              padding: '4px',
            },
            '& .MuiTabs-indicator': {
              display: 'none',
            },
          }}
        >
          {agenciesTabs.map(tab => (
            <PillTab key={tab} label={t(tab)} />
          ))}
        </Tabs>
        {renderTabPanel()}
      </Stack>
    </ModalRoot>
  );
};

export default UpdateAgencyModal;
