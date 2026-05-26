import { api } from '@/config/axios.config';
import { POST_REQUEST_PARAMETERS } from '@/config/constants.config';
import {
  ForgotPasswordFormValues,
  LoginFormValues,
  ResetPasswordFormValues,
  UpdatePasswordFormValues,
} from '@/config/forms/form-models.config';
import { ErrorModel } from '@/models/error.model';
import { UserSettings } from '@/models/user.model';
import { LoginResponse, PayloadResponse } from '@/types/response.type';

export default class AuthService {
  public static async login(payload: LoginFormValues): Promise<PayloadResponse<string | null>> {
    try {
      const response = await fetch(`${import.meta.env.VITE_BOAT_API_URL}/auth/login`, {
        ...POST_REQUEST_PARAMETERS,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body: ErrorModel = await response.json();

        return { payload: null, message: body.message };
      }

      const { userId, token, refreshToken }: LoginResponse = await response.json();

      return { payload: JSON.stringify({ userId, token, refreshToken }) };
    } catch {
      return { payload: null, message: 'An unexpected error occurred.' };
    }
  }

  public static async logout(): Promise<void> {
    try {
      await api.get('/auth/logout');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Logout failed:', error);
    }
  }

  public static async requestPasswordReset(payload: ResetPasswordFormValues): Promise<PayloadResponse<boolean>> {
    try {
      const response = await fetch(`${import.meta.env.VITE_BOAT_API_URL}/auth/requestPasswordReset`, {
        ...POST_REQUEST_PARAMETERS,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body: ErrorModel = await response.json();

        return { payload: false, message: body.message };
      }

      return { payload: true };
    } catch {
      return { payload: false };
    }
  }

  public static async checkPasswordResetCode(passwordResetCode: string): Promise<PayloadResponse<boolean>> {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BOAT_API_URL}/auth/resetPassword?passwordResetCode=${encodeURIComponent(passwordResetCode)}`
      );

      if (!response.ok) {
        const body: ErrorModel = await response.json();

        return { payload: false, message: body.message };
      }

      return { payload: true };
    } catch {
      return { payload: false };
    }
  }

  public static async resetPassword(
    passwordResetCode: string,
    { password }: ForgotPasswordFormValues
  ): Promise<PayloadResponse<boolean>> {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BOAT_API_URL}/auth/resetPassword?passwordResetCode=${encodeURIComponent(passwordResetCode)}`,
        {
          ...POST_REQUEST_PARAMETERS,
          body: JSON.stringify({ password }),
        }
      );

      if (!response.ok) {
        const body: ErrorModel = await response.json();

        return { payload: false, message: body.message };
      }

      return { payload: true };
    } catch {
      return { payload: false };
    }
  }

  public static async updatePassword(payload: UpdatePasswordFormValues): Promise<PayloadResponse<boolean>> {
    try {
      await api.post('/auth/updatePassword', payload);

      return { payload: true };
    } catch (error) {
      const { message } = error as ErrorModel;

      return { payload: false, message };
    }
  }

  public static async getSettings(): Promise<UserSettings[] | null> {
    try {
      const { data } = await api.get('/admin/settings');

      return data || null;
    } catch {
      return null;
    }
  }

  public static async updateSettings(payload: UserSettings): Promise<PayloadResponse<boolean>> {
    try {
      await api.patch('/admin/settings', payload);

      return { payload: true };
    } catch (error) {
      const { message } = error as ErrorModel;

      return { payload: false, message };
    }
  }
}
