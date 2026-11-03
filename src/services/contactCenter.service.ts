/* Contact Center (P2): one call per /admin/cc endpoint (SYSTEM_ADMIN). Reply, close, delete and bulk delete stay on
 * /admin/chat through chat.service.ts. JWT and refresh go through the shared axios instance (ADMIN-15, ADMIN-16). */
import { api } from '@/config/axios.config';
import {
  CcFunnel,
  CcSearchEngines,
  CcStats,
  ContactCard,
  ContactPatch,
  ContactRow,
  ConversationDetail,
  ConversationFilter,
  ConversationRow,
  Heatmap,
  HeatmapGroup,
  LiveRow,
  ProactiveResult,
  RecDetail,
  RecFilter,
  RecInsight,
  RecRow,
  RecSiteSetting,
  SearchQuerySort,
  SearchQueryStat,
} from '@/types/contactCenter.type';

/** Drops empty and false-y defaults so the query string carries only the filters in use. */
const params = (f: object) =>
  Object.fromEntries(Object.entries(f).filter(([, v]) => v !== undefined && v !== null && v !== ''));

const ContactCenterService = {
  conversations: (filter: ConversationFilter) =>
    api.get<ConversationRow[]>('/admin/cc/conversations', { params: params(filter) }),

  unreadCount: () => api.get<{ count: number }>('/admin/cc/conversations/unread-count'),

  conversation: (id: number) => api.get<ConversationDetail>(`/admin/cc/conversations/${id}`),

  markRead: (id: number) => api.post<void>(`/admin/cc/conversations/${id}/read`),

  takeOver: (id: number) => api.post<void>(`/admin/cc/conversations/${id}/take-over`),

  returnToAi: (id: number) => api.post<void>(`/admin/cc/conversations/${id}/return-to-ai`),

  live: () => api.get<LiveRow[]>('/admin/cc/live'),

  // The visitor's tracker key goes in the body, never in the URL (access logs).
  sendProactive: (visitorKey: string, text: string) =>
    api.post<{ result: ProactiveResult }>('/admin/cc/live/message', { visitorKey, text }),

  contacts: (query: { q?: string; status?: string; tag?: string; page?: number; size?: number }) =>
    api.get<ContactRow[]>('/admin/cc/contacts', { params: params(query) }),

  contact: (id: number) => api.get<ContactCard>(`/admin/cc/contacts/${id}`),

  updateContact: (id: number, patch: ContactPatch) => api.patch<ContactRow>(`/admin/cc/contacts/${id}`, patch),

  setTags: (id: number, tags: string[]) => api.put<{ tags: string[] }>(`/admin/cc/contacts/${id}/tags`, { tags }),

  merge: (id: number, sourceId: number) => api.post<ContactCard>(`/admin/cc/contacts/${id}/merge`, { sourceId }),

  stats: (query: { from?: string; to?: string; siteId?: string }) =>
    api.get<CcStats>('/admin/cc/stats', { params: params(query) }),
  funnel: (query: { from?: string; to?: string; siteId?: string; device?: string; channel?: string }) =>
    api.get<CcFunnel>('/admin/cc/funnel', { params: params(query) }),
  searchEngines: (query: { from?: string; to?: string; siteId?: string; country?: string; device?: string }) =>
    api.get<CcSearchEngines>('/admin/cc/search-engines', { params: params(query) }),
  /** Google's query table in its own order, for one landing page when path (of siteId) is given. */
  searchEngineQueries: (query: {
    from?: string;
    to?: string;
    siteId?: string;
    country?: string;
    device?: string;
    path?: string;
    sort?: SearchQuerySort;
    dir?: 'asc' | 'desc';
  }) => api.get<SearchQueryStat[]>('/admin/cc/search-engines/queries', { params: params(query) }),
  recSettings: () => api.get<RecSiteSetting[]>('/admin/cc/rec/settings'),
  recordings: (filter: RecFilter) => api.get<RecRow[]>('/admin/cc/rec/page-views', { params: params(filter) }),
  recording: (id: number) => api.get<RecDetail>(`/admin/cc/rec/page-views/${id}`),
  /** The recording as stored, one payload per line; the API sends it gzip-encoded and the browser unzips it. */
  recordingRaw: (id: number) =>
    api.get<string>(`/admin/cc/rec/page-views/${id}/raw`, {
      responseType: 'text',
      transformResponse: (r: string) => r,
    }),
  recordingAssets: (siteId: string, paths: string[]) =>
    api.post<Record<string, string>>('/admin/cc/rec/assets', { siteId, paths }),
  heatmap: (query: { siteId: string; pageType: string; device: string; from?: string }) =>
    api.get<Heatmap>('/admin/cc/rec/heatmap', { params: params(query) }),
  heatmapGroups: (query: { siteId: string; device: string; from?: string }) =>
    api.get<HeatmapGroup[]>('/admin/cc/rec/heatmap/groups', { params: params(query) }),
  insights: (query: { siteId: string; device: string; from?: string }) =>
    api.get<RecInsight[]>('/admin/cc/rec/insights', { params: params(query) }),
  saveRecSetting: ({ siteId, ...values }: RecSiteSetting) =>
    api.put<RecSiteSetting>(`/admin/cc/rec/settings/${siteId}`, values),
};

export default ContactCenterService;
