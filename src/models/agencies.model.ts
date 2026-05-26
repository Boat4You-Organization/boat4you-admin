export enum AgencyPrimarySource {
  UNKNOWN = 'UNKNOWN',
  MMK = 'MMK',
  NAUSYS = 'NAUSYS',
}

export const AGENCY_PRIMARY_SOURCE_LABEL_MAP = {
  [AgencyPrimarySource.UNKNOWN]: 'common.unknown',
  [AgencyPrimarySource.MMK]: 'common.mmk',
  [AgencyPrimarySource.NAUSYS]: 'common.nausys',
} as const;

export const AGENCY_PRIMARY_SOURCE_ARRAY = Object.values(AgencyPrimarySource).filter(value => value !== 'UNKNOWN');

export interface AgencyModel {
  id: number;
  name: string;
  address: string;
  city: string | null;
  country: string;
  zip: string | null;
  vatCode: string | null;
  web: string | null;
  email: string;
  phone: string;
  mobile: string | null;
  iban: string | null;
  active: boolean;
  discount: number | null;
  director: string | null;
  skipExternalSystem: boolean;
  /** Admin-curated boost. When true, this agency's yachts surface ahead
   *  of the rest on the public "Recommended" sort, ordered by client price
   *  ASC within the boosted bucket and within the rest. Toggled per-agency
   *  from this admin's update modal. */
  recommended: boolean;
  primarySource: AgencyPrimarySource;
  /** All sources the agency syncs from. May contain MMK + NauSys when an
   *  agency is registered in both partner systems (admin renders the array
   *  so Mario can spot dual-source agencies and block one if needed). */
  sources?: AgencyPrimarySource[];
}

export interface AgencyYachtModel {
  id: number;
  name: string;
  excludeDiscount: boolean | null;
}
