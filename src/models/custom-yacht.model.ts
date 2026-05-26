import { EquipmentModel } from './equipment.model';

export enum CharterType {
  BAREBOAT = 'BAREBOAT',
  CREWED = 'CREWED',
  ALL_INCLUSIVE = 'ALL_INCLUSIVE',
}

export const CHARTER_TYPE_LABEL_MAP = {
  [CharterType.BAREBOAT]: 'common.bareboat',
  [CharterType.CREWED]: 'common.crewed',
  [CharterType.ALL_INCLUSIVE]: 'common.allInclusive',
} as const;

export const CHARTER_TYPE_ARRAY = [
  { type: CharterType.BAREBOAT },
  { type: CharterType.CREWED },
  { type: CharterType.ALL_INCLUSIVE },
];

export enum VesselType {
  CATAMARAN = 'CATAMARAN',
  GULET = 'GULET',
  LUXURY_MOTOR_YACHT = 'LUXURY_MOTOR_YACHT',
  MOTORBOAT = 'MOTORBOAT',
  MOTOR_YACHT = 'MOTOR_YACHT',
  MOTORSAILER = 'MOTORSAILER',
  POWER_CATAMARAN = 'POWER_CATAMARAN',
  SAILING_YACHT = 'SAILING_YACHT',
  MINI_CRUISER = 'MINI_CRUISER',
}

export const VESSEL_TYPE_LABEL_MAP = {
  [VesselType.CATAMARAN]: 'yacht.catamaran',
  [VesselType.GULET]: 'yacht.gulet',
  [VesselType.LUXURY_MOTOR_YACHT]: 'yacht.luxuryMotorYacht',
  [VesselType.MOTORBOAT]: 'yacht.motorboat',
  [VesselType.MOTOR_YACHT]: 'yacht.motorYacht',
  [VesselType.MOTORSAILER]: 'yacht.motorsailer',
  [VesselType.POWER_CATAMARAN]: 'yacht.powerCatamaran',
  [VesselType.SAILING_YACHT]: 'yacht.sailingYacht',
  [VesselType.MINI_CRUISER]: 'yacht.miniCruiser',
} as const;

export const VESSEL_TYPE_ARRAY = Object.values(VesselType);

export enum MainSailType {
  CLASSIC_SAIL = 'CLASSIC_SAIL',
  ROLLING_SAIL = 'ROLLING_SAIL',
}

export const MAIN_SAIL_TYPE_LABEL_MAP = {
  [MainSailType.CLASSIC_SAIL]: 'yacht.classicMainsail',
  [MainSailType.ROLLING_SAIL]: 'yacht.rollingMainsail',
} as const;

export const MAIN_SAIL_TYPE_ARRAY = Object.values(MainSailType);

export enum GenoaType {
  ROLLING_SAIL = 'ROLLING_SAIL',
  FURLING_GENOA = 'FURLING_GENOA',
  STANDARD_GENOA = 'STANDARD_GENOA',
}

export const GENOA_TYPE_LABEL_MAP = {
  [GenoaType.ROLLING_SAIL]: 'yacht.rollingMainsail',
  [GenoaType.FURLING_GENOA]: 'yacht.furlingGenoa',
  [GenoaType.STANDARD_GENOA]: 'yacht.standardGenoa',
} as const;

export const GENOA_TYPE_ARRAY = Object.values(GenoaType);

export interface MultiLanguageContent {
  en: string;
  hr: string;
  de: string;
  fr: string;
  es: string;
  it: string;
  pt: string;
  pl: string;
  nl: string;
}

export interface YachtImage {
  id: number;
  position: number;
  mainImage: boolean;
}

export interface CustomYachtModelShortInfo {
  id: number;
  name: string;
  modelName: string;
  countryId: string;
  countryName: string;
  countryCode: string;
  lowPrice: number;
  slug: string;
}
export interface CustomYachtModel {
  id: number;
  name: string;
  manufacturerId: number;
  modelId: number;
  buildYear: number;
  launchYear: number;
  enginePower: number;
  length: number;
  draught: number;
  beam: number;
  waterTank: number;
  fuelTank: number;
  cabins: number;
  berths: number;
  maxPersons: number;
  defaultCheckin: string;
  defaultCheckout: string;
  mainsailType: MainSailType;
  mainsailArea: number;
  genoaType: GenoaType;
  genoaArea: number;
  vesselType: VesselType;
  countryId: string;
  locationId: string | null;
  lowPrice: number;
  descriptions: MultiLanguageContent;
  videoUrl: string;
  equipment: EquipmentModel[];
  yachtImages: YachtImage[];
  hasBrochure: boolean;
  crewNumber: number | null;
  priceDescription: string | null;
  amenitiesText: string | null;
  toysText: string | null;
  engineText: string | null;
  slug: string;
  pdf: string;
}
