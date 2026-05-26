import LanguageIcon from '@/components/SvgIcons/Language';

import navigation, { NavigationLink } from './navigation.config';

export type NavigationMobileItemTitle = 'about.title' | 'preferences.title';

export interface NavigationMobileItem {
  title: NavigationMobileItemTitle;
  links: NavigationLink[];
}

const navigationMobile: NavigationMobileItem[] = [
  {
    title: 'about.title',
    links: [...navigation],
  },
  {
    title: 'preferences.title',
    links: [
      {
        id: 'preferences.language',
        icon: LanguageIcon,
      },
    ],
  },
];

export default navigationMobile;
