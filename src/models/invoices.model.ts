import { CountryIsoEnum } from '@/config/countries.config';

export enum RecipientType {
  PRIVATE_PERSON = 'PRIVATE_PERSON',
  COMPANY = 'COMPANY',
}

export const RECIPIENT_TYPE_LABEL_MAP = {
  [RecipientType.PRIVATE_PERSON]: 'common.private-person',
  [RecipientType.COMPANY]: 'common.company',
} as const;

export const RECIPIENT_TYPE_ARRAY = Object.values(RecipientType);

export const RECIPIENT_TYPE_ARRAY_VALUES = ['all', ...Object.values(RecipientType)] as const;

export enum InvoiceLanguage {
  EN = 'EN',
  HR = 'HR',
}

export const INVOICE_LANGUAGE_LABEL_MAP = {
  [InvoiceLanguage.EN]: 'common.english',
  [InvoiceLanguage.HR]: 'common.croatian',
} as const;

export const INVOICE_LANGUAGE_ARRAY = Object.values(InvoiceLanguage);

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
}

export const INVOICE_STATUS_LABEL_MAP = {
  [InvoiceStatus.DRAFT]: 'common.draft',
  [InvoiceStatus.SENT]: 'common.sent',
} as const;

export const INVOICE_STATUS_ARRAY = Object.values(InvoiceStatus);

export const INVOICE_STATUS_TAB_VALUES = ['all', ...Object.values(InvoiceStatus)] as const;

export const INVOICE_STATUS_TAB_LABEL_MAP = {
  all: 'common.all',
  ...INVOICE_STATUS_LABEL_MAP,
} as const;

export interface InvoiceModel {
  id: number;
  reservationId: number;
  reservationNumber: string;
  reservationFlowId: number;
  recipientType: RecipientType;
  recipientName: string;
  recipientCity: string;
  recipientStreet: string;
  recipientZipCode: string;
  recipientCountry: CountryIsoEnum;
  recipientVatCode: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceLanguage: InvoiceLanguage;
  invoiceStatus: InvoiceStatus;
  invoiceItem: string;
  includeVat: boolean;
  vatPercentage: number;
  priceWithoutVat: number;
  vatAmount: number;
  totalPrice: number;
  /** Commission on the related reservation. Listing's Amount column reads
   *  this so it tracks the booking's commission even if the invoice draft
   *  hasn't filled `totalPrice`/`priceWithoutVat` yet. */
  reservationCommission?: number | null;
  clientName: string;
  clientEmail: string;
  clientPhoneNumber: string;
}
