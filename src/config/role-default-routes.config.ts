import { UserRoleName } from '@/models/user.model';

export const roleDefaultRoute: Record<UserRoleName, string> = {
  // `/` = WorkspaceLanding: the workspace (Charter / Marketing) used last in this browser.
  [UserRoleName.SYSTEM_ADMIN]: '/',
  [UserRoleName.MANAGER]: '/bookings',
  [UserRoleName.USER]: '/login',
};
