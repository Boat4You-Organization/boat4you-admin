import { api } from '@/config/axios.config';

export interface ChatSessionDto {
  id: number;
  status: 'AI' | 'HUMAN_REQUESTED' | 'HUMAN' | 'CLOSED';
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
}

export interface ChatMessageDto {
  id: number;
  sessionId: number;
  role: 'USER' | 'ASSISTANT' | 'ADMIN' | 'SYSTEM';
  content: string;
  payload: string | null;
  createdAt: string;
}

export const getChatSessions = (needsHumanOnly: boolean) =>
  api.get<ChatSessionDto[]>('/admin/chat/sessions', { params: { needsHumanOnly, size: 100 } });

export const getChatTranscript = (id: number) => api.get<ChatMessageDto[]>(`/admin/chat/sessions/${id}/messages`);

export const replyToChat = (id: number, content: string) =>
  api.post<ChatMessageDto>(`/admin/chat/sessions/${id}/reply`, { content });

export const closeChat = (id: number) => api.post<void>(`/admin/chat/sessions/${id}/close`);
