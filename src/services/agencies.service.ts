import { api } from '@/config/axios.config';
import { SortDirection } from '@/config/constants.config';
import { UpdateAgencyFormValues } from '@/config/forms/form-models.config';
import { AgencyModel, AgencyYachtModel } from '@/models/agencies.model';
import { ErrorModel } from '@/models/error.model';
import { PaginatedResponse, PayloadResponse } from '@/types/response.type';
import { createQueryParamsWithPage } from '@/utils/static/queryParams';

export default class AgenciesService {
  // Agencies list caps at 100 per page — brokers scan the grid visually
  // for a partner by name / country and paginate by 100s rather than
  // clicking through many 20-row pages. Keep in sync with AGENCIES_PAGE_SIZE
  // in Agencies.tsx used for total-page math.
  public static AGENCIES_PAGE_SIZE = 100;

  public static async getAgencies(
    pageNumber?: number,
    name?: string,
    sortBy?: string,
    sortDirection?: SortDirection,
    country?: string,
    source?: string
  ): Promise<PaginatedResponse<AgencyModel>> {
    try {
      const queryParams = createQueryParamsWithPage({
        pageNumber,
        pageSize: AgenciesService.AGENCIES_PAGE_SIZE,
        name,
        sortBy,
        sortDirection,
        countryCode: country,
        primarySource: source,
      });
      const { data } = await api.get(`/admin/agencies${queryParams}`);

      return data;
    } catch {
      return {
        content: [],
        page: {
          size: 0,
          number: 0,
          totalElements: 0,
          totalPages: 0,
        },
      };
    }
  }

  public static async getAgency(id: number): Promise<AgencyModel | null> {
    try {
      const { data } = await api.get(`/admin/agencies/${id}`);

      return data || null;
    } catch {
      return null;
    }
  }

  public static async updateAgency(id: number, payload: UpdateAgencyFormValues): Promise<PayloadResponse<boolean>> {
    try {
      await api.put(`/admin/agencies/${id}`, { id, ...payload });

      return { payload: true };
    } catch (error) {
      const { message } = error as ErrorModel;

      return { payload: false, message };
    }
  }

  public static async getYachtsAgency(id: number): Promise<AgencyYachtModel[] | []> {
    try {
      const { data } = await api.get(`/admin/agencies/${id}/yachts`);

      return data || [];
    } catch {
      return [];
    }
  }

  public static async updateYachtsAgency(id: number, payload: AgencyYachtModel[]): Promise<PayloadResponse<boolean>> {
    try {
      await api.post(`/admin/agencies/${id}/yachts`, payload);

      return { payload: true };
    } catch (error) {
      const { message } = error as ErrorModel;

      return { payload: false, message };
    }
  }

  public static async activateAgency(id: number): Promise<PayloadResponse<boolean>> {
    try {
      await api.patch(`/admin/agencies/${id}/activate`);

      return { payload: true };
    } catch (error) {
      const { message } = error as ErrorModel;

      return { payload: false, message };
    }
  }

  public static async deactivateAgency(id: number): Promise<PayloadResponse<boolean>> {
    try {
      await api.patch(`/admin/agencies/${id}/deactivate`);

      return { payload: true };
    } catch (error) {
      const { message } = error as ErrorModel;

      return { payload: false, message };
    }
  }

  public static async recalculatePrices(id: number): Promise<PayloadResponse<number>> {
    try {
      const { data } = await api.post<{ updatedOffers: number }>(`/admin/agencies/${id}/recalculate-prices`);

      return { payload: data.updatedOffers };
    } catch (error) {
      const { message } = error as ErrorModel;

      return { payload: -1, message };
    }
  }
}
