import { SortDirection } from '@/config/constants.config';
import AgenciesService from '@/services/agencies.service';

import { agenciesStore } from './agencies.store';

export async function getAgencies(
  page?: number,
  name?: string,
  sortBy?: string,
  sortDirection?: SortDirection,
  country?: string,
  source?: string
): Promise<void> {
  agenciesStore.isLoading = true;

  const { content, page: contentPage } = await AgenciesService.getAgencies(
    page,
    name,
    sortBy,
    sortDirection,
    country,
    source
  );

  agenciesStore.isLoading = false;
  agenciesStore.agencies = content;
  agenciesStore.totalCount = contentPage?.totalElements || 0;
}

export async function getSelectedAgency(id: number): Promise<void> {
  const response = await AgenciesService.getAgency(id);

  agenciesStore.selectedAgency = response!;
}

export function findAgency(index: string): void {
  agenciesStore.selectedAgency = agenciesStore.agencies[+index];
}

export function clearSelectedAgency(): void {
  agenciesStore.selectedAgency = undefined;
}

export function toggleUpdateAgencyModal(isOpen?: boolean | React.MouseEvent): void {
  agenciesStore.updateAgencyModalOpen = typeof isOpen === 'boolean' ? isOpen : !agenciesStore.updateAgencyModalOpen;
}
