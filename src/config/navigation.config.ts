import { ElementType } from 'react';

import Campaign from '@mui/icons-material/Campaign';

import Boat from '@/components/SvgIcons/Boat';
import { People } from '@/components/SvgIcons/BoatFeatures';
import Bookings from '@/components/SvgIcons/Bookings';
import Contact from '@/components/SvgIcons/Contact';
import Invoices from '@/components/SvgIcons/Invoices';
import Share from '@/components/SvgIcons/Share';
import { UserModel, UserRoleName } from '@/models/user.model';

export interface NavigationLink {
  id: string;
  icon?: ElementType;
  accessLevel?: UserRoleName[];
  path?: string;
  news?: number;
}

const navigation: NavigationLink[] = [
  {
    // Landing page and first menu item since the Dashboard was folded into it (Mario 30.10.2026).
    id: 'bookings',
    icon: Bookings,
    path: '/bookings',
    accessLevel: [UserRoleName.SYSTEM_ADMIN, UserRoleName.MANAGER],
  },
  {
    id: 'offers',
    icon: Boat,
    path: '/offers',
    accessLevel: [UserRoleName.SYSTEM_ADMIN, UserRoleName.MANAGER],
  },
  {
    id: 'users',
    icon: People,
    path: '/users',
    accessLevel: [UserRoleName.SYSTEM_ADMIN, UserRoleName.MANAGER],
  },
  {
    id: 'invoices',
    icon: Invoices,
    path: '/invoices',
    accessLevel: [UserRoleName.SYSTEM_ADMIN, UserRoleName.MANAGER],
  },
  {
    id: 'customPayments',
    icon: Invoices,
    path: '/custom-payments',
    // Backend /admin/custom-payments/** is SYSTEM_ADMIN only; a MANAGER would only see a load error.
    accessLevel: [UserRoleName.SYSTEM_ADMIN],
  },
  {
    id: 'customBoats',
    icon: Boat,
    path: '/custom-boats',
    accessLevel: [UserRoleName.SYSTEM_ADMIN, UserRoleName.MANAGER],
  },
  {
    // Own photos / video / crew profile for any boat + image hygiene; the backend endpoints are SYSTEM_ADMIN only.
    id: 'boatsMedia',
    icon: Boat,
    path: '/boats/media',
    accessLevel: [UserRoleName.SYSTEM_ADMIN],
  },
  {
    id: 'agencies',
    icon: Contact,
    path: '/agencies',
    accessLevel: [UserRoleName.SYSTEM_ADMIN, UserRoleName.MANAGER],
  },
  // --- Marketing workspace (Mario 5.11.2026): Statistics, Live visitors, Contact center, Heatmaps, Social posts; call center and
  // backlinks come next. Statistics, Live visitors and Heatmaps keep their /contact-center/* routes (bookmarks, links) but
  // are menu items of their own; the header lights the item with the longest matching path.
  {
    id: 'stats',
    icon: Contact,
    path: '/contact-center/stats',
    accessLevel: [UserRoleName.SYSTEM_ADMIN],
  },
  {
    // Live visitors: own menu item since 5.11.2026 (Mario), keeps its /contact-center/live route.
    id: 'live',
    icon: Contact,
    path: '/contact-center/live',
    accessLevel: [UserRoleName.SYSTEM_ADMIN],
  },
  {
    // Contact Center (P2, replaces /chat): backend /admin/cc/** and /admin/chat/** are SYSTEM_ADMIN only.
    id: 'contactCenter',
    icon: Contact,
    path: '/contact-center',
    accessLevel: [UserRoleName.SYSTEM_ADMIN],
  },
  {
    id: 'heatmaps',
    icon: Contact,
    path: '/contact-center/recording',
    accessLevel: [UserRoleName.SYSTEM_ADMIN],
  },
  {
    // Objave (Social publisher S0, 3.11.2026): one post to many channels; backend /admin/social/** is SYSTEM_ADMIN only.
    id: 'social',
    icon: Share,
    path: '/social',
    accessLevel: [UserRoleName.SYSTEM_ADMIN],
  },
  {
    // PR (5.11.2026): journalists, studies, pitches from press@; backend /admin/pr/** is SYSTEM_ADMIN only.
    id: 'pr',
    icon: Campaign,
    path: '/pr',
    accessLevel: [UserRoleName.SYSTEM_ADMIN],
  },
];

/** Only the items this user's roles may open (a MANAGER does not see SYSTEM_ADMIN-only items). */
export const navigationForUser = (user: Pick<UserModel, 'roles'> | null | undefined): NavigationLink[] =>
  navigation.filter(
    item => !item.accessLevel || !!user?.roles?.some(role => item.accessLevel?.includes(role.roleName))
  );

export default navigation;
