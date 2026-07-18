import { ElementType } from 'react';

import Boat from '@/components/SvgIcons/Boat';
import { People } from '@/components/SvgIcons/BoatFeatures';
import Bookings from '@/components/SvgIcons/Bookings';
import Contact from '@/components/SvgIcons/Contact';
import Extras from '@/components/SvgIcons/Extras';
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
    // Broker Desk landing page — top of the nav, default redirect for
    // SYSTEM_ADMIN / MANAGER after login (see role-default-routes.config).
    id: 'dashboard',
    path: '/dashboard',
    accessLevel: [UserRoleName.SYSTEM_ADMIN, UserRoleName.MANAGER],
  },
  {
    id: 'offers',
    icon: Boat,
    path: '/offers',
    accessLevel: [UserRoleName.SYSTEM_ADMIN, UserRoleName.MANAGER],
  },
  {
    id: 'bookings',
    icon: Bookings,
    path: '/bookings',
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
    id: 'customBoats',
    icon: Boat,
    path: '/custom-boats',
    accessLevel: [UserRoleName.SYSTEM_ADMIN, UserRoleName.MANAGER],
  },
  {
    id: 'extras',
    icon: Extras,
    path: '/extras',
    accessLevel: [UserRoleName.SYSTEM_ADMIN, UserRoleName.MANAGER],
  },
  {
    id: 'chat',
    icon: Contact,
    path: '/chat',
    accessLevel: [UserRoleName.SYSTEM_ADMIN, UserRoleName.MANAGER],
  },
  {
    id: 'agencies',
    icon: Contact,
    path: '/agencies',
    accessLevel: [UserRoleName.SYSTEM_ADMIN, UserRoleName.MANAGER],
  },
];

export default navigation;
