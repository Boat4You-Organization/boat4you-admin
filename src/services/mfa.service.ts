import { api } from '@/config/axios.config';
import { POST_REQUEST_PARAMETERS } from '@/config/constants.config';
import { ErrorModel } from '@/models/error.model';
import { browserStorage } from '@/utils/workspace';
import {
  PasskeyAssertionPayload,
  PasskeyCreationOptions,
  PasskeyRegistrationPayload,
  PasskeyRequestOptions,
} from '@/utils/static/webauthn';

/**
 * Two-step admin sign-in (16.11.2026): the password, then a passkey (Face ID / Touch ID), an authenticator-app code
 * or a recovery code. "Remember this device" keeps a 30-day device token in this browser.
 */

const DEVICE_TOKEN_KEY = 'b4y-admin-mfa-device';

export type MfaMethod = 'passkey' | 'totp' | 'recovery';

export interface MfaLoginResponse {
  status: 'OK' | 'MFA_REQUIRED';
  token?: string;
  refreshToken?: string;
  userId?: number;
  mfaToken?: string;
  methods?: MfaMethod[];
  deviceToken?: string;
  setupRequired?: boolean;
}

export interface PasskeyInfo {
  id: number;
  label: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface MfaStatus {
  passkeys: PasskeyInfo[];
  totpEnabled: boolean;
  recoveryCodesLeft: number;
  required: boolean;
  enrolled: boolean;
}

interface Result<T> {
  payload: T | null;
  message?: string;
  code?: number;
}

const readDeviceToken = (): string | null => {
  try {
    return browserStorage()?.getItem(DEVICE_TOKEN_KEY) ?? null;
  } catch {
    return null;
  }
};

export const keepDeviceToken = (token?: string): void => {
  if (!token) return;

  try {
    browserStorage()?.setItem(DEVICE_TOKEN_KEY, token);
  } catch {
    // Private mode: the next sign-in simply asks for the second step again.
  }
};

export const forgetDeviceToken = (): void => {
  try {
    browserStorage()?.removeItem(DEVICE_TOKEN_KEY);
  } catch {
    // nothing kept
  }
};

const post = async <T>(path: string, body: unknown): Promise<Result<T>> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_BOAT_API_URL}${path}`, {
      ...POST_REQUEST_PARAMETERS,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error: ErrorModel = await response.json().catch(() => ({}) as ErrorModel);

      return { payload: null, message: error.message, code: (error as { code?: number }).code };
    }

    return { payload: (await response.json()) as T };
  } catch {
    return { payload: null, message: 'An unexpected error occurred.' };
  }
};

export default class MfaService {
  public static login(email: string, password: string): Promise<Result<MfaLoginResponse>> {
    return post<MfaLoginResponse>('/auth/mfa/login', { email, password, deviceToken: readDeviceToken() });
  }

  public static passkeyOptions(mfaToken: string): Promise<Result<PasskeyRequestOptions>> {
    return post<PasskeyRequestOptions>('/auth/mfa/passkey/options', { mfaToken });
  }

  public static passkeyVerify(
    mfaToken: string,
    challengeToken: string,
    assertion: PasskeyAssertionPayload,
    rememberDevice: boolean
  ): Promise<Result<MfaLoginResponse>> {
    return post<MfaLoginResponse>('/auth/mfa/passkey/verify', { mfaToken, challengeToken, rememberDevice, ...assertion });
  }

  public static codeVerify(
    method: 'totp' | 'recovery',
    mfaToken: string,
    code: string,
    rememberDevice: boolean
  ): Promise<Result<MfaLoginResponse>> {
    return post<MfaLoginResponse>(`/auth/mfa/${method}/verify`, { mfaToken, code, rememberDevice });
  }

  // ---- settings of the signed-in user (Bearer through `api`)

  public static async status(): Promise<MfaStatus | null> {
    try {
      return (await api.get<MfaStatus>('/users/me/mfa')).data;
    } catch {
      return null;
    }
  }

  public static async passkeyCreationOptions(): Promise<PasskeyCreationOptions | null> {
    try {
      return (await api.post<PasskeyCreationOptions>('/users/me/mfa/passkey/options')).data;
    } catch {
      return null;
    }
  }

  public static async registerPasskey(
    challengeToken: string,
    payload: PasskeyRegistrationPayload,
    label: string
  ): Promise<boolean> {
    try {
      await api.post('/users/me/mfa/passkey', { challengeToken, label, ...payload });

      return true;
    } catch {
      return false;
    }
  }

  public static async deletePasskey(id: number): Promise<boolean> {
    try {
      await api.delete(`/users/me/mfa/passkey/${id}`);

      return true;
    } catch {
      return false;
    }
  }

  public static async totpSetup(): Promise<{ secret: string; otpauthUri: string } | null> {
    try {
      return (await api.post<{ secret: string; otpauthUri: string }>('/users/me/mfa/totp/setup')).data;
    } catch {
      return null;
    }
  }

  public static async totpConfirm(code: string): Promise<boolean> {
    try {
      await api.post('/users/me/mfa/totp/confirm', { code });

      return true;
    } catch {
      return false;
    }
  }

  public static async totpDisable(): Promise<boolean> {
    try {
      await api.delete('/users/me/mfa/totp');

      return true;
    } catch {
      return false;
    }
  }

  public static async newRecoveryCodes(): Promise<string[] | null> {
    try {
      return (await api.post<string[]>('/users/me/mfa/recovery-codes')).data;
    } catch {
      return null;
    }
  }

  public static async forgetTrustedDevices(): Promise<boolean> {
    try {
      await api.delete('/users/me/mfa/trusted-devices');
      forgetDeviceToken();

      return true;
    } catch {
      return false;
    }
  }
}
