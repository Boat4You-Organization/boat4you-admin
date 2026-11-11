import { api } from '@/config/axios.config';
import { PAGE_SIZE } from '@/config/constants.config';
import {
  CardPaymentModel,
  CardPaymentsPage,
  CardPaymentsQuery,
  MolliePaymentDetails,
} from '@/models/cardPayment.model';
import { ErrorModel } from '@/models/error.model';
import { PayloadResponse } from '@/types/response.type';

// The axios interceptor rejects with the response body, which is undefined on a network error.
const errorMessage = (error: unknown): string | undefined => (error as ErrorModel | undefined)?.message;

export default class CardPaymentsService {
  public static async getCardPayments({
    page,
    size = PAGE_SIZE,
    statuses,
    q,
    reservationId,
  }: CardPaymentsQuery): Promise<PayloadResponse<CardPaymentsPage | null>> {
    const params = new URLSearchParams({ page: String(page), size: String(size) });

    if (statuses?.length) params.set('status', statuses.join(','));

    if (q?.trim()) params.set('q', q.trim());

    if (reservationId) params.set('reservationId', String(reservationId));

    try {
      const { data } = await api.get<CardPaymentsPage>(`/admin/card-payments?${params.toString()}`);

      return { payload: data };
    } catch (error) {
      return { payload: null, message: errorMessage(error) };
    }
  }

  public static async refresh(id: number): Promise<PayloadResponse<CardPaymentModel | null>> {
    try {
      const { data } = await api.post<CardPaymentModel>(`/admin/card-payments/${id}/refresh`);

      return { payload: data };
    } catch (error) {
      return { payload: null, message: errorMessage(error) };
    }
  }

  /**
   * The accounting PDF of a period (Mollie payments, refunds, transfers to the bank); `from` / `to` are `YYYY-MM-DD`,
   * both inclusive. Null when the API could not make it.
   */
  public static async getPaymentsReport(from: string, to: string): Promise<Blob | null> {
    try {
      const { data } = await api.get<Blob>('/admin/payments-report', { params: { from, to }, responseType: 'blob' });

      return data;
    } catch {
      return null;
    }
  }

  /** Live read from Mollie; works for booking card payments and /pay link payments alike. */
  public static async getMolliePayment(paymentId: string): Promise<PayloadResponse<MolliePaymentDetails | null>> {
    try {
      const { data } = await api.get<MolliePaymentDetails>(`/admin/mollie-payments/${encodeURIComponent(paymentId)}`);

      return { payload: data };
    } catch (error) {
      return { payload: null, message: errorMessage(error) };
    }
  }
}
