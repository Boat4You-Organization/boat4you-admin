import { api } from '@/config/axios.config';
import { SortDirection } from '@/config/constants.config';
import { UpdateInvoiceFormValues } from '@/config/forms/form-models.config';
import { ErrorModel } from '@/models/error.model';
import { InvoiceLanguage, InvoiceModel, InvoiceStatus, RecipientType } from '@/models/invoices.model';
import { PaginatedResponse, PayloadResponse } from '@/types/response.type';
import { createQueryParamsWithPage } from '@/utils/static/queryParams';

export default class InvoicesService {
  public static async getInvoices(
    pageNumber?: number,
    sortBy?: string,
    sortDirection?: SortDirection,
    status?: InvoiceStatus,
    search?: string,
    reservationId?: string,
    recipientType?: RecipientType | string,
    language?: InvoiceLanguage,
    departureDate?: string,
    agencyId?: string
  ): Promise<PaginatedResponse<InvoiceModel>> {
    try {
      const queryParams = createQueryParamsWithPage({
        pageNumber,
        sortBy,
        sortDirection,
        invoiceStatus: status,
        recipientName: search,
        reservationId,
        recipientType,
        language,
        departureDate,
        agencyId,
      });

      const { data } = await api.get(`/admin/invoices${queryParams}`);

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

  public static async getInvoice(id: number): Promise<InvoiceModel | null> {
    try {
      const { data } = await api.get(`/admin/invoices/${id}`);

      return data || null;
    } catch {
      return null;
    }
  }

  public static async updateInvoice(id: number, payload: UpdateInvoiceFormValues): Promise<PayloadResponse<boolean>> {
    try {
      await api.put(`/admin/invoices/${id}`, { id, ...payload });

      return { payload: true };
    } catch (error) {
      const { message } = error as ErrorModel;

      return { payload: false, message };
    }
  }

  public static async markAsReadInvoice(id: number): Promise<PayloadResponse<boolean>> {
    try {
      await api.put(`/admin/invoices/${id}/markAsSent`, { id });

      return { payload: true };
    } catch (error) {
      const { message } = error as ErrorModel;

      return { payload: false, message };
    }
  }

  public static async deleteInvoice(id: number): Promise<PayloadResponse<boolean>> {
    try {
      await api.delete(`/admin/invoices/${id}`);

      return { payload: true };
    } catch (error) {
      const { message } = error as ErrorModel;

      return { payload: false, message };
    }
  }
}
