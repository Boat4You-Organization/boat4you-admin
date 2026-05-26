import { proxy, useSnapshot } from 'valtio';

import { AuthKeys } from '@/config/constants.config';
import { UserModel, UserSettings } from '@/models/user.model';

interface AuthStore {
  user: UserModel | null;
  userSettings: UserSettings[] | null;
  authenticating: boolean;
  token: string | null;
}

export const authStore = proxy<AuthStore>({
  user: null,
  userSettings: null,
  authenticating: true,
  token: localStorage.getItem(AuthKeys.TOKEN),
});

export const useAuthStore = (): AuthStore => useSnapshot(authStore);
