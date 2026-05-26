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
  authStore.token = token;
};
