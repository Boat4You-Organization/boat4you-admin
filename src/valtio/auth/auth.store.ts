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
  // In-memory only — null on a fresh load/reload, so the app shows the login
  // screen until the user re-authenticates (token no longer persisted).
  token: getStoredToken(),
});

export const useAuthStore = (): AuthStore => useSnapshot(authStore);
