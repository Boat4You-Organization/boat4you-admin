import en from './en';
import hr from './hr';

export const i18n = {
  en,
  hr,
};

export type Locale = keyof typeof i18n;
