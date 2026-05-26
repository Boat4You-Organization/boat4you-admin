export enum InquiriesStatus {
  NEW = 'NEW',
  ANSWERED = 'ANSWERED',
  ARCHIVED = 'ARCHIVED',
}

export const INQUIRIES_STATUS_COLOR_MAP = {
  [InquiriesStatus.NEW]: 'warning',
  [InquiriesStatus.ANSWERED]: 'success',
  [InquiriesStatus.ARCHIVED]: 'error',
} as const;

export const INQUIRIES_STATUS_LABEL_MAP = {
  [InquiriesStatus.NEW]: 'common.new',
  [InquiriesStatus.ANSWERED]: 'common.answered',
  [InquiriesStatus.ARCHIVED]: 'common.archived',
} as const;

export const INQUIRIES_STATUS_ARRAY = Object.values(InquiriesStatus);

export const INQUIRIES_VALUES = ['all', ...INQUIRIES_STATUS_ARRAY] as const;

export const INQUIRIES_VALUES_LABEL_MAP = {
  all: 'common.all',
  ...INQUIRIES_STATUS_LABEL_MAP,
} as const;

export interface InquiriesModelShortInfo {
  id: number;
  yachtId: number;
  yachtName: string;
  location: string;
  dateFrom: string;
  dateTo: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  status: InquiriesStatus;
  createdAt: string;
}

export interface InquiriesModel extends InquiriesModelShortInfo {
  countryCode: string;
  mainImage: number;
  modelName: string;
  message: string;
}
