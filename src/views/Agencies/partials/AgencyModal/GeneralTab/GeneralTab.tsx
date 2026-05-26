import { useTranslation } from 'react-i18next';

import GridDisplay from '@/components/GridDisplay';
import { AgencyModel } from '@/models/agencies.model';

interface GeneralTabProps {
  agency: AgencyModel;
}

const GeneralTab = ({ agency }: GeneralTabProps) => {
  const { t } = useTranslation();
  const { name, discount, email, phone, skipExternalSystem, active } = agency;

  return (
    <GridDisplay
      columns={2}
      items={[
        { label: 'form.agency.name', value: name },
        { label: 'form.agency.discount', value: discount },
        { label: 'form.agency.email', value: email },
        { label: 'form.agency.phone', value: phone },
        { label: 'form.agency.skipExternalSystem', value: skipExternalSystem ? t('common.yes') : t('common.no') },
        { label: 'form.agency.status', value: active ? t('common.active') : t('common.blacklisted') },
      ]}
    />
  );
};

export default GeneralTab;
