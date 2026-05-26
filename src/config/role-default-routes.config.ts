import { UserRoleName } from '@/models/user.model';

export const roleDefaultRoute: Record<UserRoleName, string> = {
  [UserRoleName.SYSTEM_ADMIN]: '/dashboard',
  [UserRoleName.MANAGER]: '/dashboard',
  [UserRoleName.USER]: '/login',
};
