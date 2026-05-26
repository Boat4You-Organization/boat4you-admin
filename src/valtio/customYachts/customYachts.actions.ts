import { SortDirection } from '@/config/constants.config';
import { CustomYachtModelShortInfo } from '@/models/custom-yacht.model';
import CustomYachtService from '@/services/custom-yacht.service';

import { customYachtsStore } from './customYachts.store';

export async function getCustomYachts(
  page?: number,
  name?: string,
  sortBy?: string,
  sortDirection?: SortDirection
): Promise<void> {
  customYachtsStore.isLoading = true;

  const { content, page: contentPage } = await CustomYachtService.getCustomYachts(page, name, sortBy, sortDirection);

  customYachtsStore.isLoading = false;
  customYachtsStore.customYachts = content;
  customYachtsStore.totalCount = contentPage?.totalElements || 0;
}

export async function getSelectedCustomYacht(id: number): Promise<void> {
  const response = await CustomYachtService.getCustomYacht(id);

  customYachtsStore.selectedCustomYacht = response!;

  if (response && response.hasBrochure) {
    const pdf = await CustomYachtService.getBrochure(response.slug);

    customYachtsStore.selectedCustomYacht.pdf = pdf.url!;
  }
}

export function findCustomYacht(index: string): void {
  const { id } = customYachtsStore.customYachts[+index];

  getSelectedCustomYacht(id);
}

export function findCustomYachtById(id: number): CustomYachtModelShortInfo | undefined {
  return customYachtsStore.customYachts.find(yacht => yacht.id === id);
}

export function clearSelectedCustomYacht(): void {
  customYachtsStore.selectedCustomYacht = undefined;
}

export async function getCustomBoatBrochure(slug: string) {
  const pdf = await CustomYachtService.getBrochure(slug);

  if (customYachtsStore.selectedCustomYacht) {
    customYachtsStore.selectedCustomYacht.pdf = pdf.url!;
  }
}

export function toggleCreateCustomYachtModal(isOpen?: boolean | React.MouseEvent): void {
  customYachtsStore.createCustomYachtModalOpen =
    typeof isOpen === 'boolean' ? isOpen : !customYachtsStore.createCustomYachtModalOpen;
}

export function toggleUpdateCustomYachtModal(isOpen?: boolean | React.MouseEvent): void {
  customYachtsStore.updateCustomYachtModalOpen =
    typeof isOpen === 'boolean' ? isOpen : !customYachtsStore.updateCustomYachtModalOpen;
}

export function toggleDeleteCustomYachtModal(isOpen?: boolean | React.MouseEvent): void {
  customYachtsStore.deleteCustomYachtModalOpen =
    typeof isOpen === 'boolean' ? isOpen : !customYachtsStore.deleteCustomYachtModalOpen;
}
