import { LocaleKeys } from '@/config/constants.config';
import { i18n } from '@/i18n';

import { localeStore } from './locale.store';

export async function setLocale(locale: string) {
  localeStore.currentLocale = locale;
  localStorage.setItem(LocaleKeys.LOCALE, locale.toLowerCase());

  await i18n.changeLanguage(locale);
}
