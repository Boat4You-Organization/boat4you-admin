import { api } from '@/config/axios.config';
import { POST_REQUEST_PARAMETERS, SortDirection } from '@/config/constants.config';
import { CreateUserFormValues, ProfileFormValues, SignUpFormValues } from '@/config/forms/form-models.config';
import { ErrorModel } from '@/models/error.model';
import { UserModel, UserRoleName, UserStatus } from '@/models/user.model';
import { PaginatedResponse, PayloadResponse } from '@/types/response.type';
import { createQueryParams } from '@/utils/static/queryParams';

export type UpdateUserFormValues = Omit<ProfileFormValues, 'id' | 'password' | 'newPassword' | 'repeatNewPassword'>;

export default class UsersService {
  public static async getUsers(
    pageNumber?: number,
    search?: string,
    sortBy?: string,
    sortDirection?: SortDirection,
    role?: UserRoleName,
    status?: UserStatus
  ): Promise<PaginatedResponse<UserModel>> {
    try {
      const queryParams = createQueryParams({
        pageNumber,
        search,
        sortBy,
        sortDirection,
        role,
        status,
      });
      const { data } = await api.get(`/users${queryParams}`);

      return data;
    } catch {
      return { content: [] };
    }
  }

  public static async getUser(id: number): Promise<UserModel | null> {
    try {
      const { data } = await api.get(`/users/${id}`);

      return data || null;
    } catch {
      return null;
    }
  }

  public static async createUser(payload: CreateUserFormValues): Promise<PayloadResponse<UserModel | null>> {
    try {
      const { data } = await api.put('/users', payload);

      return { payload: data };
    } catch (error) {
      const { message } = error as ErrorModel;

      return { payload: null, message };
    }
  }

  public static async updateUser(id: number, payload: UpdateUserFormValues): Promise<PayloadResponse<boolean>> {
    try {
      await api.post(`/users/${id}`, { id, ...payload });

      return { payload: true };
    } catch (error) {
      const { message } = error as ErrorModel;

      return { payload: false, message };
    }
  }

  public static async deleteUser(id: number): Promise<PayloadResponse<boolean>> {
    try {
      await api.delete(`/users/${id}`);

      return { payload: true };
    } catch (error) {
      const { message } = error as ErrorModel;

      return { payload: false, message };
    }
  }

  public static async getUserByToken(token: string): Promise<UserModel | null> {
    try {
      const { userId } = JSON.parse(token);
      const { data } = await api.get(`/users/${userId}`);

      return data || null;
    } catch {
      return null;
    }
  }

  public static async inviteUser(ids: number[]): Promise<PayloadResponse<boolean>> {
    try {
      await api.put(`/users/invite/${ids}`);

      return { payload: true };
    } catch (error) {
      const { message } = error as ErrorModel;

      return { payload: false, message };
    }
  }

  public static async checkInviteCode(inviteCode: string): Promise<PayloadResponse<boolean>> {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BOAT_API_URL}/users/invite?inviteCode=${encodeURIComponent(inviteCode)}`
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

  public static async signUpUser(
    inviteCode: string,
    payload: Pick<SignUpFormValues, 'password'>
  ): Promise<PayloadResponse<UserModel | null>> {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BOAT_API_URL}/users/invite?inviteCode=${encodeURIComponent(inviteCode)}`,
        {
          ...POST_REQUEST_PARAMETERS,
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const body: ErrorModel = await response.json();

        return { payload: null, message: body.message };
      }

      return { payload: await response.json() };
    } catch {
      return { payload: null };
    }
  }
}
