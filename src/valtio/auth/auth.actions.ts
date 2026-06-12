import { setStoredToken } from '@/config/tokenStore';
import { UserModel } from '@/models/user.model';
import AuthService from '@/services/auth.service';

import { authStore } from './auth.store';

export const setAuthenticating = (authenticating: boolean): void => {
  authStore.authenticating = authenticating;
};

export async function getSettings(): Promise<void> {
  const response = await AuthService.getSettings();

  authStore.userSettings = response!;
}

export const setUser = (user: UserModel | null): void => {
  authStore.user = user;
};

export const setToken = (token: string | null): void => {
  // Single entry point that keeps the reactive valtio store and the
  // non-reactive in-memory holder (read by axios + authHeaders) in lockstep.
  authStore.token = token;
  setStoredToken(token);
};
