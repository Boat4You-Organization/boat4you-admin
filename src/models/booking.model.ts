export enum AgencySourceExternalSystem {
  UNKNOWN = 'UNKNOWN',
  MMK = 'MMK',
  NAUSYS = 'NAUSYS',
}

export enum ReservationStatus {
  UNKNOWN = 'UNKNOWN',
  FREE = 'FREE',
  OPTION = 'OPTION',
  OPTION_WAITING = 'OPTION_WAITING',
  UNAVAILABLE = 'UNAVAILABLE',
  RESERVED = 'RESERVED',
  CANCELLED = 'CANCELLED',
  SERVICE = 'SERVICE',
  OPTION_EXPIRED = 'OPTION_EXPIRED',
  INFO = 'INFO',
}

export enum ReservationSysStatus {
  UNKNOWN = 'UNKNOWN',
  OPTION = 'OPTION',
  RESERVATION = 'RESERVATION',
  CANCELLED = 'CANCELLED',
  OPTION_WAITING = 'OPTION_WAITING',
}

export const RESERVATION_STATUS_COLOR_MAP = {
  [ReservationStatus.UNKNOWN]: 'warning',
  [ReservationStatus.OPTION_WAITING]: 'warning',
  [ReservationStatus.OPTION]: 'info',
  [ReservationStatus.INFO]: 'info',
  [ReservationStatus.UNAVAILABLE]: 'error',
  [ReservationStatus.RESERVED]: 'error',
  [ReservationStatus.CANCELLED]: 'error',
  [ReservationStatus.OPTION_EXPIRED]: 'error',
  [ReservationStatus.FREE]: 'success',
} as const;

export const RESERVATION_STATUS_LABEL_MAP = {
  [ReservationStatus.UNKNOWN]: 'common.pending',
  [ReservationStatus.OPTION_WAITING]: 'common.pending',
  [ReservationStatus.OPTION]: 'common.confirmed',
  [ReservationStatus.INFO]: 'common.confirmed',
  [ReservationStatus.UNAVAILABLE]: 'common.cancelled',
  [ReservationStatus.RESERVED]: 'common.cancelled',
  [ReservationStatus.CANCELLED]: 'common.cancelled',
  [ReservationStatus.OPTION_EXPIRED]: 'common.cancelled',
  [ReservationStatus.FREE]: 'common.completed',
} as const;

export const RESERVATION_STATUS_ARRAY = Object.values(ReservationStatus);

export const RESERVATION_TAB_VALUES = ['all', ...RESERVATION_STATUS_ARRAY] as const;

export const RESERVATION_TAB_LABEL_MAP = {
  all: 'common.all',
  ...RESERVATION_STATUS_LABEL_MAP,
} as const;

export const RESERVATION_SYS_STATUS_COLOR_MAP = {
  [ReservationSysStatus.UNKNOWN]: 'warning',
  [ReservationSysStatus.OPTION]: 'info',
  [ReservationSysStatus.CANCELLED]: 'error',
  [ReservationSysStatus.RESERVATION]: 'success',
  [ReservationSysStatus.OPTION_WAITING]: 'info',
  IN_CHARTER: 'info',
  ENDED: 'warning',
} as const;

export const RESERVATION_SYS_STATUS_LABEL_MAP = {
  [ReservationSysStatus.UNKNOWN]: 'common.pending',
  [ReservationSysStatus.OPTION]: 'common.option',
  [ReservationSysStatus.OPTION_WAITING]: 'common.optionWaiting',
  [ReservationSysStatus.CANCELLED]: 'common.cancelled',
  [ReservationSysStatus.RESERVATION]: 'common.reservation',
  IN_CHARTER: 'common.inCharter',
  ENDED: 'common.ended',
} as const;

export const RESERVATION_SYS_STATUS_ARRAY = Object.values(ReservationSysStatus);

// Virtual tab values — computed client-side from `dateFrom`/`dateTo` on
// rows that are RESERVATION (confirmed) on the backend. The backend doesn't
// model these as distinct statuses; they're a UX surface for the admin so
// you can see at a glance which bookings are mid-charter vs finished.
//   IN_CHARTER → today is between dateFrom and dateTo (inclusive)
//   ENDED      → today is strictly after dateTo
export const VIRTUAL_IN_CHARTER = 'IN_CHARTER' as const;
export const VIRTUAL_ENDED = 'ENDED' as const;
export type VirtualReservationStatus = typeof VIRTUAL_IN_CHARTER | typeof VIRTUAL_ENDED;

/**
 * Map a raw reservation sys status to what the broker should see based on
 * today's date vs. the charter window. Only RESERVATION rows can "promote"
 * into a virtual state — OPTION / CANCELLED pass through unchanged since
 * those labels stay meaningful even after the dates.
 */
export const getEffectiveReservationSysStatus = (
  raw: ReservationSysStatus,
  dateFrom?: string,
  dateTo?: string
): ReservationSysStatus | VirtualReservationStatus => {
  if (raw !== ReservationSysStatus.RESERVATION) return raw;

  if (!dateFrom || !dateTo) return raw;

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const from = new Date(dateFrom);

  from.setHours(0, 0, 0, 0);

  const to = new Date(dateTo);

  to.setHours(0, 0, 0, 0);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return raw;

  if (today.getTime() > to.getTime()) return VIRTUAL_ENDED;

  if (today.getTime() >= from.getTime() && today.getTime() <= to.getTime()) return VIRTUAL_IN_CHARTER;

  
return raw;
};

// Tabs hide both UNKNOWN (internal sync fallback) and OPTION_WAITING —
// the latter is a partner-specific secondary hold the broker can't even
// create from our UI. If such a row ever lands it still renders under
// the "All" tab with its own status pill.
export const RESERVATION_SYS_TAB_VALUES = [
  'all',
  ReservationSysStatus.RESERVATION,
  VIRTUAL_IN_CHARTER,
  VIRTUAL_ENDED,
  ReservationSysStatus.OPTION,
  ReservationSysStatus.CANCELLED,
] as const;

export const RESERVATION_SYS_TAB_LABEL_MAP = {
  all: 'common.all',
  [ReservationSysStatus.OPTION]: 'common.option',
  [ReservationSysStatus.OPTION_WAITING]: 'common.optionWaiting',
  [ReservationSysStatus.CANCELLED]: 'common.cancelled',
  [ReservationSysStatus.RESERVATION]: 'common.reservation',
  [VIRTUAL_IN_CHARTER]: 'common.inCharter',
  [VIRTUAL_ENDED]: 'common.ended',
} as const;

export enum ExtraUnit {
  UNKNOWN = 'UNKNOWN',
  PER_BOOKING = 'PER_BOOKING',
  PER_PERSON = 'PER_PERSON',
  PER_DAY = 'PER_DAY',
  PER_WEEK = 'PER_WEEK',
}

export enum MeasurementUnit {
  METRE = 'METRE',
  FOOT = 'FOOT',
}

export enum CharterType {
  UNKNOWN = 'UNKNOWN',
  BAREBOAT = 'BAREBOAT',
  SKIPPERED = 'SKIPPERED',
  CREWED = 'CREWED',
}

export enum VesselType {
  OTHER = 'OTHER',
  SAILBOAT = 'SAILBOAT',
  CATAMARAN = 'CATAMARAN',
  MOTORBOAT = 'MOTORBOAT',
  GULET = 'GULET',
}

export enum EquipmentCategory {
  SALOON_AND_CABINS = 'SALOON_AND_CABINS',
  KITCHEN = 'KITCHEN',
  NAVIGATION = 'NAVIGATION',
  SAFETY = 'SAFETY',
  COMFORT = 'COMFORT',
  WATER_SPORTS = 'WATER_SPORTS',
}

export interface PriceInfo {
  amount: number;
  currency: string;
  validAt: string;
  rate: number;
}

export interface MeasurementInfo {
  unit: MeasurementUnit;
  amount: number;
}

export interface Equipment {
  id: number;
  labelCode: string;
  category: EquipmentCategory;
  filterOrder: number;
}

export interface Amenity {
  id: number;
  name: string;
  equipment: Equipment;
}

export interface SelectedExtra {
  id: number;
  name: string;
  labelCode: string;
  priceEur: number;
  priceInfo: PriceInfo;
  obligatory: boolean;
  payableInBase: boolean;
  unit: ExtraUnit;
  unitPriceEur: number;
  unitPriceInfo: PriceInfo;
  key: string;
}

// Yacht-catalogue extras (shape mirrors backend YachtExtrasDto). Used as
// fallback when reservation_extras is empty so my-bookings / admin booking
// detail still surfaces obligatory rows.
export interface YachtCatalogService {
  id: number;
  name: string;
  priceEur: number;
  priceInfo?: PriceInfo;
  obligatory: boolean;
  payableInBase: boolean;
  key: string;
}

export interface ReservationPaymentPhase {
  id: number;
  deadline: string;
  amount: number;
  paidOn: string;
  stripePaymentIntentId: string;
}

export interface ReservationModelShortInfo {
  reservationId: number;
  reservationFlowId: number;
  reservationStatus: ReservationStatus;
  reservationSysStatus: ReservationSysStatus;
  reservationCreatedAt: string;
  reservationOptionExpiresAt: string;
  reservationTotalPrice: number;
  reservationDiscount: number;
  reservationExternalId: number;
  reservationExternalReservationCode: string;
  reservationNumber: string;
  reservationUserId: number | null;
  endUser: string;
  createdBy: string;
  offerCheckin: string;
  offerCheckout: string;
  agencySourceExternalSystem: AgencySourceExternalSystem;
  yachtId: number;
  yachtSlug: string;
  yachtName: string;
  modelName: string;
  manufacturerName: string;
  locationFromName: string;
  locationFromCountry: string;
  locationToName: string;
  locationToCountry: string;
  reservationDateFrom: string;
  reservationDateTo: string;
  agencyId: number;
  agencyName: string;
  cancellationRequestAt: string;
  cancellationRejectedAt: string | null;
  reservationAgencyPrice: number | null;
  reservationCommission: number | null;
  reservationAdminNotes: string | null;
}

export interface ReservationModel {
  reservationId: number;
  reservationFlowId: number;
  reservationSysStatus: ReservationSysStatus;
  reservationExternalStatus: string;
  reservationCreatedAt: string;
  reservationOptionExpiresAt: string;
  reservationTotalPrice: number;
  reservationPaymentPhases: ReservationPaymentPhase[];
  reservationDiscount: number;
  reservationClientPrice: number;
  reservationExternalId: number;
  reservationExternalReservationCode: string;
  reservationNumber: string | null;
  reservationNote: string;
  reservationPaymentNote: string | null;
  reservationCrewListUrl: string | null;
  /** Boat4You Trip PWA hub key — /trip/{token}; admin shows link + QR. */
  reservationTripToken?: string | null;
  reservationUserId: number;
  endUser: string;
  endUserEmail: string;
  endUserPhone: string;
  endUserRequest: string;
  createdBy: string;
  createdByEmail: string;
  offerCheckin: string;
  offerCheckout: string;
  agencySourceExternalSystem: string;
  yachtId: number;
  yachtSlug: string;
  yachtName: string;
  modelName: string;
  yachtMainImage: number;
  manufacturerName: string;
  locationFromName: string;
  locationFromCountry: string;
  locationToName: string;
  locationToCountry: string;
  reservationDateFrom: string;
  reservationDateTo: string;
  selectedExtras: SelectedExtra[];
  agencyId: number;
  agencyName: string;
  agencyEmail: string;
  agencyPhone: string;
  cancellationRequestAt: string | null;
  cancellationRequest: string | null;
  cancellationRejectedAt: string | null;
  cancellationRejectedReason: string | null;
  securityDeposit: number;
  insuredSecurityDeposit: number;
  depositCurrency: string;
  buildYear: number;
  beamInfo: MeasurementInfo;
  lengthInfo: MeasurementInfo;
  crewNumber: number;
  charterType: CharterType;
  vesselType: VesselType;
  amenities: Amenity[];
  specialRequest: string;
  adminNotes: string | null;
  // Full yacht-catalogue services list. Same source as the public boat
  // detail page so admin booking detail can show obligatory extras and the
  // refundable security deposit row even when `selectedExtras` is empty.
  services?: YachtCatalogService[];
  obligatoryExtrasKeys?: string[];
}
