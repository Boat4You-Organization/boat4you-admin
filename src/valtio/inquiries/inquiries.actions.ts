import { SortDirection } from '@/config/constants.config';
import { InquiriesStatus } from '@/models/inquiries.model';
import InquiriesService from '@/services/inquiries.service';

import { inquiriesStore } from './inquiries.store';

export async function getInquiries(
  page?: number,
  search?: string,
  sortBy?: string,
  sortDirection?: SortDirection,
  statuses?: InquiriesStatus
): Promise<void> {
  inquiriesStore.isLoading = true;

  const { content, page: contentPage } = await InquiriesService.getInquiries(
    page,
    search,
    sortBy,
    sortDirection,
    statuses
  );

  inquiriesStore.isLoading = false;
  inquiriesStore.inquiries = content;
  inquiriesStore.totalCount = contentPage?.totalElements || 0;
}

export async function getSelectedInquiry(id: number): Promise<void> {
  const response = await InquiriesService.getInquiry(id);

  inquiriesStore.selectedInquiry = response!;
}

export async function findInquiry(index: string) {
  const { id } = inquiriesStore.inquiries[+index];

  getSelectedInquiry(id);
}

export function clearSelectedInquiry(): void {
  inquiriesStore.selectedInquiry = undefined;
}

export function toggleChangeInquiryStatusModal(isOpen?: boolean | React.MouseEvent): void {
  inquiriesStore.changeInquiryStatusModalOpen =
    typeof isOpen === 'boolean' ? isOpen : !inquiriesStore.changeInquiryStatusModalOpen;
}

/**
 * Pulls the count of NEW-status inquiries from `/admin/inquiries`. We
 * only need `page.totalElements`, so request size=1 — the content rows
 * are discarded. Updates `inquiriesStore.openCount` which drives both
 * the Dashboard "Open inquiries" KPI and the red badge on the Inquiries
 * nav item. Swallows errors silently so a transient 5xx / network blip
 * doesn't crash the shell; count simply stays at its last-known value.
 */
export async function refreshOpenInquiriesCount(): Promise<void> {
  try {
    const { page } = await InquiriesService.getInquiries(
      0,
      undefined,
      undefined,
      undefined,
      InquiriesStatus.NEW
    );
    inquiriesStore.openCount = page?.totalElements ?? 0;
  } catch {
    // leave previous count in place
  }
}
