import { api } from '@/config/axios.config';
import { SortDirection } from '@/config/constants.config';
import { CreateInvoiceFormValues, UpdateInvoiceFormValues } from '@/config/forms/form-models.config';
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
    agencyId?: string,
    year?: number
  ): Promise<PaginatedResponse<InvoiceModel>> {
    try {
      const queryParams = createQueryParamsWithPage({
        pageNumber,
        // No pagination for invoices (Mario 28.8.2026) — the whole year's
        // list renders on one page; 1000 comfortably covers a year.
        pageSize: 1000,
        sortBy,
        sortDirection,
        invoiceStatus: status,
        search,
        reservationId,
        recipientType,
        language,
        departureDate,
        agencyId,
        year,
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

  /** Distinct invoice years (by invoice date), newest first — year tabs. */
  public static async getInvoiceYears(): Promise<number[]> {
    try {
      const { data } = await api.get('/admin/invoices/years');

      return data || [];
    } catch {
      return [];
    }
  }

  public static async createInvoice(payload: CreateInvoiceFormValues): Promise<PayloadResponse<InvoiceModel | null>> {
    try {
      const { data } = await api.post('/admin/invoices', {
        ...payload,
        reservationId: payload.reservationId || null,
        invoiceNumber: payload.invoiceNumber || null,
        // Backend derives nothing from agencyId — it's picker-side only.
        agencyId: undefined,
      });

      return { payload: data };
    } catch (error) {
      const { message } = error as ErrorModel;

      return { payload: null, message };
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
