export enum LocationType {
  COUNTRY = 'COUNTRY',
  REGION = 'REGION',
  MARINA = 'MARINA',
}

export const LOCATION_TYPE_LABEL_MAP = {
  [LocationType.COUNTRY]: 'Country',
  [LocationType.REGION]: 'Region',
  [LocationType.MARINA]: 'Marina',
} as const;

export const LOCATION_TYPE_ARRAY = Object.values(LocationType);
