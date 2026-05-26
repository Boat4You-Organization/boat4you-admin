import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

import { AuthKeys } from '@/config/constants.config';
import { ErrorModel } from '@/models/error.model';
import { setToken } from '@/valtio/auth/auth.actions';

interface TokenData {
  token: string;
  refreshToken: string;
  userId: number;
}

const getTokenData = (): TokenData | null => {
  const tokenString = localStorage.getItem(AuthKeys.TOKEN);

  if (!tokenString) return null;

  try {
    return JSON.parse(tokenString);
  } catch {
    return null;
  }
};

const saveTokenData = (tokenData: TokenData): void => {
  localStorage.setItem(AuthKeys.TOKEN, JSON.stringify(tokenData));
  setToken(JSON.stringify(tokenData));
};

const clearTokenData = (): void => {
  localStorage.removeItem(AuthKeys.TOKEN);
  setToken(null);
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_BOAT_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const tokenData = getTokenData();

    if (tokenData?.token) {
      config.headers.Authorization = `Bearer ${tokenData.token}`;
    }

    return config;
  },
  error => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string | null) => void;
  reject: (reason: AxiosError) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null): void => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  response => response,
  async (error: AxiosError<ErrorModel>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 403 || originalRequest._retry) {
      return Promise.reject(error.response?.data);
    }

    const tokenData = getTokenData();

    if (!tokenData?.token || !tokenData?.refreshToken) {
      clearTokenData();
      window.location.href = '/login';

      return Promise.reject(error.response?.data);
    }

    if (isRefreshing) {
      return new Promise<string | null>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;

          return api(originalRequest);
        })
        .catch(err => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const response = await axios.post<TokenData>(
        `${import.meta.env.VITE_BOAT_API_URL}/auth/refreshToken`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokenData.refreshToken}`,
          },
        }
      );

      const newTokenData: TokenData = {
        userId: response.data.userId,
        token: response.data.token,
        refreshToken: response.data.refreshToken,
      };

      saveTokenData(newTokenData);
      originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
      processQueue(null, response.data.token);

      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError as AxiosError, null);
      clearTokenData();
      window.location.href = '/login';

      const axiosError = refreshError as AxiosError<ErrorModel>;

      return Promise.reject(axiosError.response?.data);
    } finally {
      isRefreshing = false;
    }
  }
);
