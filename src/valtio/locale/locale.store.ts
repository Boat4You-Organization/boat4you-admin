import { proxy, useSnapshot } from 'valtio';

import { Locale, LocaleKeys } from '@/config/constants.config';

interface LocaleStore {
  currentLocale: string;
}

export const localeStore = proxy<LocaleStore>({
  currentLocale: localStorage.getItem(LocaleKeys.LOCALE) || Locale.EN,
});

export const useLocaleStore = (): LocaleStore => useSnapshot(localeStore);
