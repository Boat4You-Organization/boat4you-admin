import { proxy, useSnapshot } from 'valtio';

import { InquiriesModel, InquiriesModelShortInfo } from '@/models/inquiries.model';

interface InquiriesStore {
  inquiries: InquiriesModelShortInfo[];
  selectedInquiry?: InquiriesModel;
  totalCount: number;
  isLoading: boolean;
  changeInquiryStatusModalOpen: boolean;
  // Live count of inquiries in NEW status — surfaces on the Dashboard
  // KPI card + as a red badge on the Inquiries nav item. Fetched by the
  // admin shell on mount so every authenticated broker sees a fresh
  // count without having to visit the Inquiries list first.
  openCount: number;
}

export const inquiriesStore = proxy<InquiriesStore>({
  inquiries: [],
  selectedInquiry: undefined,
  totalCount: 0,
  isLoading: false,
  changeInquiryStatusModalOpen: false,
  openCount: 0,
});

export const useInquiriesStore = (): InquiriesStore => useSnapshot(inquiriesStore);
