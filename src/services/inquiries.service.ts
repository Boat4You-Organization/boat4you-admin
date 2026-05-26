import { api } from '@/config/axios.config';
import { SortDirection } from '@/config/constants.config';
import { UpdateInquiryStatusFormValues } from '@/config/forms/form-models.config';
import { ErrorModel } from '@/models/error.model';
import { InquiriesModel, InquiriesModelShortInfo, InquiriesStatus } from '@/models/inquiries.model';
import { PaginatedResponse, PayloadResponse } from '@/types/response.type';
import { createQueryParamsWithPage } from '@/utils/static/queryParams';

export default class InquiriesService {
  public static async getInquiries(
    pageNumber?: number,
    search?: string,
    sortBy?: string,
    sortDirection?: SortDirection,
    statuses?: InquiriesStatus
  ): Promise<PaginatedResponse<InquiriesModelShortInfo>> {
    try {
      const queryParams = createQueryParamsWithPage({
        pageNumber,
        search,
        sortBy,
        sortDirection,
        inquiriesStatuses: statuses,
      });

      const { data } = await api.get(`/admin/inquiries${queryParams}`);

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

  public static async getInquiry(id: number): Promise<InquiriesModel | null> {
    try {
      const { data } = await api.get(`/admin/inquiries/${id}`);

      return data || null;
    } catch {
      return null;
    }
  }

  public static async updateInquiryStatus(
    id: number,
    payload: UpdateInquiryStatusFormValues
  ): Promise<PayloadResponse<boolean>> {
    try {
      await api.patch(`/admin/inquiries/${id}`, payload);

      return { payload: true };
    } catch (error) {
      const { message } = error as ErrorModel;

      return { payload: false, message };
    }
  }
}
