import { roleDefaultRoute } from '@/config/role-default-routes.config';
import { UserRole } from '@/models/user.model';

export default class UserUtils {
  public static getDefaultRoute = (roles: UserRole[]): string => {
    const matchingRole = roles.find(({ roleName }) => roleDefaultRoute[roleName]);

    return matchingRole ? roleDefaultRoute[matchingRole.roleName] : '/login';
  };
}
