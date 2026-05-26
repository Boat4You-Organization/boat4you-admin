import { SortDirection } from '@/config/constants.config';
import CatalogueService from '@/services/catalogue.service';

import { extrasStore } from './extras.store';

export async function getExtras(
  page?: number,
  name?: string,
  sortBy?: string,
  sortDirection?: SortDirection
): Promise<void> {
  extrasStore.isLoading = true;

  const { content, page: contentPage } = await CatalogueService.getExtras(page, name, sortBy, sortDirection);

  extrasStore.isLoading = false;
  extrasStore.extras = content;
  extrasStore.totalCount = contentPage?.totalElements || 0;
}

export function findExtras(index: string): void {
  extrasStore.selectedExtras = extrasStore.extras[+index];
}

export function clearSelectedExtras(): void {
  extrasStore.selectedExtras = undefined;
}
