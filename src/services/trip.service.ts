import { api } from '@/config/axios.config';
import { showToast } from '@/valtio/global/global.actions';

export interface TripChatMessageDto {
  id: number;
  participantId: number | null;
  senderName: string;
  senderRole: string;
  body: string;
  createdAt: string;
}

export interface TripParticipantDto {
  id: number;
  name: string;
  role: string;
  removed: boolean;
}

export interface TripPhotoDto {
  id: number;
  uploaderName: string | null;
  marketingConsent: boolean;
  createdAt: string;
}

/**
 * Admin side of Boat4You Trip (phase 3): chat as the Concierge (the backend
 * also pushes each concierge post to the crew's subscribed devices),
 * participant management and the album with per-photo marketing consent.
 * Fetching the chat also stamps the unread badge as seen.
 */
export default class TripService {
  public static async getChat(reservationId: number): Promise<TripChatMessageDto[]> {
    try {
      const { data } = await api.get<TripChatMessageDto[]>(`/admin/trip/${reservationId}/chat`);

      return data;
    } catch {
      return [];
    }
  }

  public static async postChat(reservationId: number, body: string): Promise<TripChatMessageDto | null> {
    try {
      const { data } = await api.post<TripChatMessageDto>(`/admin/trip/${reservationId}/chat`, { body });

      return data;
    } catch {
      showToast({ status: 'error', text: 'Sending the concierge message failed.' });

      return null;
    }
  }

  public static async getParticipants(reservationId: number): Promise<TripParticipantDto[]> {
    try {
      const { data } = await api.get<TripParticipantDto[]>(`/admin/trip/${reservationId}/participants`);

      return data;
    } catch {
      return [];
    }
  }

  public static async removeParticipant(reservationId: number, participantId: number): Promise<boolean> {
    try {
      await api.delete(`/admin/trip/${reservationId}/participants/${participantId}`);

      return true;
    } catch {
      showToast({ status: 'error', text: 'Removing the participant failed.' });

      return false;
    }
  }

  public static async getPhotos(reservationId: number): Promise<TripPhotoDto[]> {
    try {
      const { data } = await api.get<TripPhotoDto[]>(`/admin/trip/${reservationId}/photos`);

      return data;
    } catch {
      return [];
    }
  }

  /** Photo bytes need the auth header — fetch a blob and hand back an
   *  object URL (caller revokes it on unmount). */
  public static async photoObjectUrl(reservationId: number, photoId: number): Promise<string | null> {
    try {
      const { data } = await api.get<Blob>(`/admin/trip/${reservationId}/photos/${photoId}/raw`, {
        responseType: 'blob',
      });

      return URL.createObjectURL(data);
    } catch {
      return null;
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
