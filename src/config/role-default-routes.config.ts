import { UserRoleName } from '@/models/user.model';

export const roleDefaultRoute: Record<UserRoleName, string> = {
  [UserRoleName.SYSTEM_ADMIN]: '/bookings',
  [UserRoleName.MANAGER]: '/bookings',
  [UserRoleName.USER]: '/login',
};
