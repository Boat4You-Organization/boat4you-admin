import { ElementType } from 'react';

import Boat from '@/components/SvgIcons/Boat';
import { People } from '@/components/SvgIcons/BoatFeatures';
import Bookings from '@/components/SvgIcons/Bookings';
import Contact from '@/components/SvgIcons/Contact';
import Invoices from '@/components/SvgIcons/Invoices';
import { UserRoleName } from '@/models/user.model';

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
    // Contact Center (P2, replaces /chat): backend /admin/cc/** and /admin/chat/** are SYSTEM_ADMIN only.
    id: 'contactCenter',
    icon: Contact,
    path: '/contact-center',
    accessLevel: [UserRoleName.SYSTEM_ADMIN],
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
];

export default navigation;
