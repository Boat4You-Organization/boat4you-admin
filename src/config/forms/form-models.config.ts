import { Dayjs } from 'dayjs';

import { CountryIsoEnum } from '@/config/countries.config';
import { AgencyModel } from '@/models/agencies.model';
import { ReservationSysStatus } from '@/models/booking.model';
import { MultiLanguageContent, VesselType } from '@/models/custom-yacht.model';
import { InquiriesStatus } from '@/models/inquiries.model';
import { InvoiceLanguage, InvoiceStatus, RecipientType } from '@/models/invoices.model';
import { UserModel, UserRole } from '@/models/user.model';

export interface CustomYachtRequest {
  name: string;
  modelId: string;
  buildYear: number | null;
  launchYear: number | null;
  enginePower: number | null;
  length: number | null;
  draught: number | null;
  beam: number | null;
  waterTank: number | null;
  fuelTank: number | null;
  cabins: number | null;
  berths: number | null;
  maxPersons: number | null;
  defaultCheckin: Dayjs | null;
  defaultCheckout: Dayjs | null;
  vesselType: VesselType | string;
  countryId: string;
  // Marina id in `l-{N}` format. Required — the marina dropdown enables only
  // after the country is picked, and the form blocks save until both are set.
  // Backend uses this to set yacht.location_id (the marina row), so the yacht
  // appears under that marina in /search and propagates to the parent country
  // / region via the location-predicate fallback.
  locationId: string;
  lowPrice: number | null;
  descriptions: MultiLanguageContent;
  videoUrl?: string;
  equipmentIds: string[];
  crewNumber: number | null;
  manufacturerId: string;
  manufacturerName: string | null;
  modelName: string | null;
  priceDescription: string;
  /** Free-text "Saloon and Cabins" amenities — multi-line, one entry per
   *  line. Renders as a checkmark list on the public Amenities tab. */
  amenitiesText: string;
  /** Free-text "Entertainment" toys, same format as amenitiesText. */
  toysText: string;
  /** Free-text engine descriptor — admin types verbatim ("2x Volvo IPS
   *  1050") so we can capture twin-engine setups, brand names, mixed
   *  units. Custom yachts skip the numeric kW filter on /search since
   *  Yacht.engine_power stays NULL when this is set instead. */
  engineText: string;
}

export interface UpdateCustomYachtRequest {
  name: string;
  manufacturerId: string;
  modelId: string;
  buildYear: number | null;
  launchYear: number | null;
  enginePower: number | null;
  length: number | null;
  draught: number | null;
  beam: number | null;
  waterTank: number | null;
  fuelTank: number | null;
  cabins: number | null;
  berths: number | null;
  maxPersons: number | null;
  defaultCheckin: string | null;
  defaultCheckout: string | null;
  vesselType: VesselType | string;
  countryId: string;
  locationId: string;
  lowPrice: number | null;
  priceDescription: string;
  descriptions: MultiLanguageContent;
  videoUrl?: string;
  equipmentIds: string[];
  crewNumber: number | null;
  manufacturerName: string | null;
  modelName: string | null;
  amenitiesText: string;
  toysText: string;
  engineText: string;
}
export interface CustomYachtFormValues {
  customYachtRequest: CustomYachtRequest;
  mainImage?: File | null;
  images?: File[];
  pdf?: File | null;
}

export interface LoginFormValues {
  email: string;
  password: string;
}

export type ResetPasswordFormValues = Pick<UserModel, 'email'>;

export type ForgotPasswordFormValues = Pick<UserModel, 'password'> & {
  confirmPassword: string;
};

export type SignUpFormValues = Pick<UserModel, 'password'> & {
  confirmPassword: string;
};

export type UpdatePasswordFormValues = {
  oldPassword: string;
  newPassword: string;
};

export interface ProfileFormValues {
  id: number;
  name: string;
  surname: string;
  email: string;
  password: string;
  roles: UserRole[];
  newPassword?: string;
  repeatNewPassword?: string;
  cardPaymentSurcharge?: string;
}

export interface CreateUserFormValues {
  name: string;
  surname: string;
  email: string;
  roles: UserRole[];
}

export interface UpdateUserFormValues {
  name: string;
  surname: string;
  email: string;
  phoneNumber: string;
  address: string;
  city: string;
  country: string;
  roles: UserRole[];
}

export type UpdateAgencyFormValues = Omit<AgencyModel, 'id'>;

export interface UpdateReservationFormValues {
  reservationFlowId: number;
  yachtId: number;
  dateFrom: Dayjs | null;
  dateTo: Dayjs | null;
  totalPrice: number;
  currency: string;
  status: ReservationSysStatus;
  expiresAt: Dayjs | null;
  reservationNumber: string;
}

export interface UpdateInquiryStatusFormValues {
  status: InquiriesStatus;
}

export interface PaymentPhaseFormValues {
  paymentPhaseIds: number[];
}

export interface UpdateInvoiceFormValues {
  reservationId: string;
  recipientType: RecipientType;
  recipientName: string;
  recipientCity: string;
  recipientStreet: string;
  recipientZipCode: string;
  recipientCountry: CountryIsoEnum;
  recipientVatCode: string;
  invoiceLanguage: InvoiceLanguage;
  invoiceStatus: InvoiceStatus;
  invoiceItem: string;
  includeVat: boolean;
  vatPercentage: number | null;
  priceWithoutVat: number | null;
  vatAmount: number | null;
  totalPrice: number | null;
}
