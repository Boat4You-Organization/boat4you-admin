import { proxy, useSnapshot } from 'valtio';

import { getStoredToken } from '@/config/tokenStore';
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
  // Restored from localStorage on load (tokenStore), so a reload keeps the session.
  token: getStoredToken(),
});

export const useAuthStore = (): AuthStore => useSnapshot(authStore);
