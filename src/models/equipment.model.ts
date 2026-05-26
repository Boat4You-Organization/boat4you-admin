export enum EquipmentCategoryType {
  SALOON_AND_CABINS = 'SALOON_AND_CABINS',
  NAVIGATION_AND_SAFETY = 'NAVIGATION_AND_SAFETY',
  ENTERTAINMENT = 'ENTERTAINMENT',
}

export const EQUIPMENT_CATEGORY_TYPE_LABEL_MAP = {
  [EquipmentCategoryType.SALOON_AND_CABINS]: 'saloonAndCabins',
  [EquipmentCategoryType.NAVIGATION_AND_SAFETY]: 'navigationAndSafety',
  [EquipmentCategoryType.ENTERTAINMENT]: 'entertainment',
} as const;

export const EQUIPMENT_CATEGORY_TYPE_ARRAY = [
  { type: EquipmentCategoryType.SALOON_AND_CABINS },
  { type: EquipmentCategoryType.NAVIGATION_AND_SAFETY },
  { type: EquipmentCategoryType.ENTERTAINMENT },
];

type EquipmentCategoryKey = keyof typeof EQUIPMENT_CATEGORY_TYPE_LABEL_MAP;

export interface Equipment {
  id: number;
  labelCode: string;
  category: EquipmentCategoryKey;
  filterOrder: number;
  matchKeys?: string;
}

export interface EquipmentModel {
  id: number;
  name: string;
  equipment: Equipment;
}
