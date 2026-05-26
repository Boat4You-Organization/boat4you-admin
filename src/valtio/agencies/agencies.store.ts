import { proxy, useSnapshot } from 'valtio';

import { AgencyModel } from '@/models/agencies.model';

interface AgenciesStore {
  agencies: AgencyModel[];
  selectedAgency?: AgencyModel;
  totalCount: number;
  isLoading: boolean;
  updateAgencyModalOpen: boolean;
}

export const agenciesStore = proxy<AgenciesStore>({
  agencies: [],
  selectedAgency: undefined,
  totalCount: 0,
  isLoading: false,
  updateAgencyModalOpen: false,
});

export const useAgenciesStore = (): AgenciesStore => useSnapshot(agenciesStore);
