import { api } from '@/config/axios.config';
import { showToast } from '@/valtio/global/global.actions';

export interface TripAlbumSummary {
  total: number;
  marketingConsented: number;
}

/**
 * Admin side of Boat4You Trip — GDPR-minimal (Mario 5.7.2026): no chat, no
 * participant list, no photo browsing. Only the trip-link kill-switch and an
 * on-demand album DOWNLOAD (all photos, or just the marketing-consented ones
 * we're allowed to reuse).
 */
export default class TripService {
  public static async getAlbumSummary(reservationId: number): Promise<TripAlbumSummary> {
    try {
      const { data } = await api.get<TripAlbumSummary>(`/admin/trip/${reservationId}/album-summary`);

      return data;
    } catch {
      return { total: 0, marketingConsented: 0 };
    }
  }

  /** Fetch the ZIP and trigger a download via a hidden anchor (dodges pop-up
   *  blockers on the async fetch). */
  public static async downloadAlbum(reservationId: number, marketingOnly: boolean): Promise<void> {
    try {
      const { data } = await api.get<Blob>(`/admin/trip/${reservationId}/album.zip?marketingOnly=${marketingOnly}`, {
        responseType: 'blob',
      });

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');

      a.href = url;
      a.download = marketingOnly ? `trip-${reservationId}-marketing.zip` : `trip-${reservationId}-photos.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      showToast({ status: 'error', text: 'Downloading the album failed.' });
    }
  }

  public static async regenerateToken(reservationId: number): Promise<string | null> {
    try {
      const { data } = await api.post<{ tripToken: string }>(`/admin/trip/${reservationId}/regenerate-token`);

      return data.tripToken;
    } catch {
      showToast({ status: 'error', text: 'Regenerating the trip link failed.' });

      return null;
    }
  }
}
