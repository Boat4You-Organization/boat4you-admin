export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export const USER_STATUS_COLOR_MAP = {
  [UserStatus.ACTIVE]: 'success',
  [UserStatus.INACTIVE]: 'error',
} as const;

export const USER_STATUS_LABEL_MAP = {
  [UserStatus.ACTIVE]: 'common.active',
  [UserStatus.INACTIVE]: 'common.inactive',
} as const;

export const USER_STATUS_ARRAY = Object.values(UserStatus);

export const USER_STATUS_VALUES = ['all', ...USER_STATUS_ARRAY] as const;

export enum InviteUserStatus {
  NOT_INVITED = 'NOT_INVITED',
  INVITED = 'INVITED',
  ACCEPTED = 'ACCEPTED',
}

export const INVITE_USER_STATUS_COLOR_MAP = {
  [InviteUserStatus.NOT_INVITED]: 'error',
  [InviteUserStatus.INVITED]: 'warning',
  [InviteUserStatus.ACCEPTED]: 'success',
} as const;

export const INVITE_USER_STATUS_LABEL_MAP = {
  [InviteUserStatus.NOT_INVITED]: 'common.notInvited',
  [InviteUserStatus.INVITED]: 'common.invited',
  [InviteUserStatus.ACCEPTED]: 'common.accepted',
} as const;

export const INVITE_USER_STATUS_ARRAY = Object.values(InviteUserStatus);

export enum UserRoleName {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER',
}

export const USER_ROLE_NAME_LABEL_MAP = {
  [UserRoleName.SYSTEM_ADMIN]: 'common.systemAdmin',
  [UserRoleName.MANAGER]: 'common.reservationManager',
  [UserRoleName.USER]: 'common.user',
} as const;

export const USER_ROLE_NAME_ARRAY = Object.values(UserRoleName);

export const USER_ROLE_NAME_TAB_VALUES = ['all', ...USER_ROLE_NAME_ARRAY] as const;

export const USER_ROLE_NAME_TAB_LABEL_MAP = {
  all: 'common.all',
  ...USER_ROLE_NAME_LABEL_MAP,
} as const;

export type UserRole = {
  roleName: UserRoleName;
};

export const USER_ROLE_ARRAY = [
  { roleName: UserRoleName.SYSTEM_ADMIN },
  { roleName: UserRoleName.MANAGER },
  { roleName: UserRoleName.USER },
];

export interface UserModel {
  id: number;
  password: string;
  name: string;
  surname: string;
  email: string;
  phoneNumber: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  language: Language;
  currency: Currency;
  userStatus: UserStatus;
  roles: UserRole[];
  inviteStatus: InviteUserStatus;
}

export enum Language {
  ENGLISH = 'EN',
  CROATIAN = 'HR',
}

export const LANGUAGE_LABEL_MAP = {
  [Language.ENGLISH]: 'English',
  [Language.CROATIAN]: 'Croatian',
} as const;

export const LANGUAGE_ARRAY = Object.values(Language);

export const supportedLocales = LANGUAGE_ARRAY.map(code => code.toLowerCase());

export enum Currency {
  EUR = 'EUR',
  USD = 'USD',
  GBP = 'GBP',
  CAD = 'CAD',
  AUD = 'AUD',
  CHF = 'CHF',
  ARS = 'ARS',
  ZAR = 'ZAR',
  BRL = 'BRL',
  NOK = 'NOK',
  CZK = 'CZK',
  DKK = 'DKK',
  ILS = 'ILS',
  SGD = 'SGD',
  NZD = 'NZD',
  SEK = 'SEK',
}

export const CURRENCY_LABEL_MAP = {
  [Currency.EUR]: 'Euro (EUR - €)',
  [Currency.USD]: 'US Dollar (USD - $)',
  [Currency.GBP]: 'British Pound (GBP - £)',
  [Currency.CAD]: 'Canadian Dollar (CAD - $)',
  [Currency.AUD]: 'Australian Dollar (AUD - $)',
  [Currency.CHF]: 'Swiss Franc (CHF - Fr)',
  [Currency.ARS]: 'Argentine Peso (ARS - $)',
  [Currency.ZAR]: 'South African Rand (ZAR - R)',
  [Currency.BRL]: 'Brazilian Real (BRL - R$)',
  [Currency.NOK]: 'Norwegian Krone (NOK - kr)',
  [Currency.CZK]: 'Czech Koruna (CZK - Kč)',
  [Currency.DKK]: 'Danish Krone (DKK - kr)',
  [Currency.ILS]: 'Israeli New Shekel (ILS - ₪)',
  [Currency.SGD]: 'Singapore Dollar (SGD - $)',
  [Currency.NZD]: 'New Zealand Dollar (NZD - $)',
  [Currency.SEK]: 'Swedish Krona (SEK - kr)',
} as const;

export const CURRENCY_ARRAY = Object.values(Currency);

export enum SettingsType {
  CARD_PAYMENT_SURCHARGE = 'CARD_PAYMENT_SURCHARGE',
}
export interface UserSettings {
  name: SettingsType;
  value: string;
}
