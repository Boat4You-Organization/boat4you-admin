import { api } from '@/config/axios.config';
import { PAGE_SIZE } from '@/config/constants.config';
import { CustomPaymentModel, CustomPaymentsPage, CustomPaymentsQuery } from '@/models/customPayment.model';
import { ErrorModel } from '@/models/error.model';
import { PayloadResponse } from '@/types/response.type';

// The axios interceptor rejects with the response body, which is undefined on a network error.
const errorMessage = (error: unknown): string | undefined => (error as ErrorModel | undefined)?.message;

export default class CustomPaymentsService {
  public static async getCustomPayments({
    page,
    status,
    site,
    q,
  }: CustomPaymentsQuery): Promise<PayloadResponse<CustomPaymentsPage | null>> {
    const params = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE) });

    if (status) params.set('status', status);

    if (site) params.set('site', site);

    if (q?.trim()) params.set('q', q.trim());

    try {
      const { data } = await api.get<CustomPaymentsPage>(`/admin/custom-payments?${params.toString()}`);

      return { payload: data };
    } catch (error) {
      return { payload: null, message: errorMessage(error) };
    }
  }

  public static async updateNote(id: number, note: string): Promise<PayloadResponse<boolean>> {
    try {
      await api.patch(`/admin/custom-payments/${id}/note`, { note });

      return { payload: true };
    } catch (error) {
      return { payload: false, message: errorMessage(error) };
    }
  }

  public static async refresh(id: number): Promise<PayloadResponse<CustomPaymentModel | null>> {
    try {
      const { data } = await api.post<CustomPaymentModel>(`/admin/custom-payments/${id}/refresh`);

      return { payload: data };
    } catch (error) {
      return { payload: null, message: errorMessage(error) };
    }
  }
}
