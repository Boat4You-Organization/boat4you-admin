import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Stack, Tabs } from '@mui/material';

import ModalRoot from '@/components/ModalRoot';
import PillTab from '@/components/PillTab';
import { agenciesTabs } from '@/config/tabs.config';
import colors from '@/styles/themes/colors';
import useBreakpoint from '@/utils/hooks/useBreakpoint';
import { useAgenciesStore } from '@/valtio/agencies/agencies.store';

import DiscountedTab from './DiscountedTab';
import GeneralTab from './GeneralTab';

interface AgencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const AgencyModal = ({ isOpen, onClose, onConfirm }: AgencyModalProps) => {
  const [tabValue, setTabValue] = useState<number>(0);
  const { isMobile } = useBreakpoint();
  const { selectedAgency } = useAgenciesStore();
  const { t } = useTranslation();

  if (!selectedAgency) return null;

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const renderTabPanel = () => {
    switch (tabValue) {
      case 0:
        return <GeneralTab agency={selectedAgency} />;
      case 1:
        return <DiscountedTab agency={selectedAgency} />;
      default:
        return null;
    }
  };

  return (
    <ModalRoot
      open={isOpen}
      fullScreen={isMobile}
      onClose={onClose}
      title={selectedAgency?.name}
      cancelBtnText={t('actions.cancel')}
      onCancel={onClose}
      confirmBtnText={t('actions.edit')}
      onConfirm={onConfirm}
    >
      <Stack sx={{ width: { xs: 'auto', md: 670 } }}>
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

export default AgencyModal;
