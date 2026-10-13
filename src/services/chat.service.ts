import { api } from '@/config/axios.config';

// LOCKED (IRIS guard, 11.10.2026): the backend stopped the AI for good after a
// suspicious message; the visitor got the live-agent handoff text.
export type ChatSessionStatus = 'AI' | 'HUMAN_REQUESTED' | 'HUMAN' | 'CLOSED' | 'LOCKED';

export interface ChatSessionDto {
  id: number;
  status: ChatSessionStatus;
  locale: string;
  visitorName: string | null;
  visitorEmail: string | null;
  adminUnread: boolean;
  lastActivityAt: string;
  lastMessage: string | null;
  lastSeenAt: string | null;
  currentPage: string | null;
  referrer: string | null;
  pageTrail: string | null;
  countryCode: string | null;
  country: string | null;
  ip: string | null;
  // Guard fields, optional: a backend from before 11.10.2026 sends none of
  // them (then only a LOCKED status marks a session as suspicious).
  flagged?: boolean;
  lockReason?: string | null;
  lockedAt?: string | null;
}

export interface ChatMessageDto {
  id: number;
  sessionId: number;
  role: 'USER' | 'ASSISTANT' | 'ADMIN' | 'SYSTEM';
  content: string;
  payload: string | null;
  createdAt: string;
}

// An older backend ignores flaggedOnly; the inbox filters client-side too.
export const getChatSessions = (needsHumanOnly: boolean, flaggedOnly: boolean) =>
  api.get<ChatSessionDto[]>('/admin/chat/sessions', { params: { needsHumanOnly, flaggedOnly, size: 100 } });

export const getChatTranscript = (id: number) => api.get<ChatMessageDto[]>(`/admin/chat/sessions/${id}/messages`);

export const replyToChat = (id: number, content: string) =>
  api.post<ChatMessageDto>(`/admin/chat/sessions/${id}/reply`, { content });

export const closeChat = (id: number) => api.post<void>(`/admin/chat/sessions/${id}/close`);

export const deleteChat = (id: number) => api.delete<void>(`/admin/chat/sessions/${id}`);

export const bulkDeleteChats = (ids: number[]) =>
  api.post<{ deleted: number }>('/admin/chat/sessions/bulk-delete', { ids });
