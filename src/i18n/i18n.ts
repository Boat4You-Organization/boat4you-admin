import { initReactI18next } from 'react-i18next';

import i18n from 'i18next';

import { Locale } from '@/config/constants.config';
import actionsEn from '@/locales/en/actions.json';
import amenitiesEn from '@/locales/en/amenities.json';
import bookingEn from '@/locales/en/booking.json';
import chatEn from '@/locales/en/chat.json';
import commonEn from '@/locales/en/common.json';
import extrasEn from '@/locales/en/extras.json';
import formEn from '@/locales/en/form.json';
import inquiriesEn from '@/locales/en/inquiries.json';
import invoicesEn from '@/locales/en/invoices.json';
import loginEn from '@/locales/en/login.json';
import navigationEn from '@/locales/en/navigation.json';
import tableEn from '@/locales/en/table.json';
import tabsEn from '@/locales/en/tabs.json';
import toastMessagesEn from '@/locales/en/toast-messages.json';
import yachtEn from '@/locales/en/yacht.json';
import actionsHr from '@/locales/hr/actions.json';
import amenitiesHr from '@/locales/hr/amenities.json';
import bookingHr from '@/locales/hr/booking.json';
import chatHr from '@/locales/hr/chat.json';
import commonHr from '@/locales/hr/common.json';
import extrasHr from '@/locales/hr/extras.json';
import formHr from '@/locales/hr/form.json';
import inquiriesHr from '@/locales/hr/inquiries.json';
import invoicesHr from '@/locales/hr/invoices.json';
import loginHr from '@/locales/hr/login.json';
import navigationHr from '@/locales/hr/navigation.json';
import tableHr from '@/locales/hr/table.json';
import tabsHr from '@/locales/hr/tabs.json';
import toastMessagesHr from '@/locales/hr/toast-messages.json';
import yachtHr from '@/locales/hr/yacht.json';
import { localeStore } from '@/valtio/locale/locale.store';

i18n.use(initReactI18next).init({
  resources: {
    en: {
      common: commonEn,
      navigation: navigationEn,
      actions: actionsEn,
      table: tableEn,
      yacht: yachtEn,
      form: formEn,
      login: loginEn,
      'toast-messages': toastMessagesEn,
      tabs: tabsEn,
      extras: extrasEn,
      amenities: amenitiesEn,
      booking: bookingEn,
      inquiries: inquiriesEn,
      invoices: invoicesEn,
      chat: chatEn,
    },
    hr: {
      common: commonHr,
      navigation: navigationHr,
      actions: actionsHr,
      table: tableHr,
      yacht: yachtHr,
      form: formHr,
      login: loginHr,
      'toast-messages': toastMessagesHr,
      tabs: tabsHr,
      extras: extrasHr,
      amenities: amenitiesHr,
      booking: bookingHr,
      inquiries: inquiriesHr,
      invoices: invoicesHr,
      chat: chatHr,
    },
  },

  lng: localeStore.currentLocale,
  fallbackLng: Locale.EN,
  ns: [
    'common',
    'navigation',
    'actions',
    'table',
    'yacht',
    'form',
    'login',
    'toast-messages',
    'tabs',
    'extras',
    'amenities',
    'booking',
    'inquiries',
    'invoices',
    'chat',
  ],
  defaultNS: 'common',
  nsSeparator: '.',
});

export default i18n;
