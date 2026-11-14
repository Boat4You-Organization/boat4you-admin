/* Call centar: one call per /admin/calls endpoint (SYSTEM_ADMIN). JWT and refresh go through the shared axios
 * instance; the recording is fetched as a blob for the same reason (an <audio src> would carry no token). */
import { api } from '@/config/axios.config';
import {
  CallDetail,
  CallFilter,
  CallInquiryListItem,
  CallListItem,
  CallSettings,
  OfferEmailPreview,
  Paged,
} from '@/types/callCenter.type';

const params = (f: object) =>
  Object.fromEntries(Object.entries(f).filter(([, v]) => v !== undefined && v !== null && v !== ''));

const CallCenterService = {
  calls: (filter: CallFilter) => api.get<Paged<CallListItem>>('/admin/calls', { params: params(filter) }),

  call: (id: number) => api.get<CallDetail>(`/admin/calls/${id}`),

  audio: (id: number) => api.get<Blob>(`/admin/calls/${id}/audio`, { responseType: 'blob' }),

  inquiries: (filter: { site?: string; q?: string; page: number; size: number }) =>
    api.get<Paged<CallInquiryListItem>>('/admin/calls/inquiries', { params: params(filter) }),

  callNow: (inquiryId: number) => api.post<CallListItem>(`/admin/calls/inquiries/${inquiryId}/call-now`),

  humanTakeover: (inquiryId: number) => api.post<void>(`/admin/calls/inquiries/${inquiryId}/human-takeover`),

  offerEmail: (inquiryId: number) => api.get<OfferEmailPreview>(`/admin/calls/inquiries/${inquiryId}/offer-email`),

  offerSent: (inquiryId: number, note: string, emailText: string, emailSentAt: string | null) =>
    api.post<void>(`/admin/calls/inquiries/${inquiryId}/offer-sent`, {
      note: note.trim() || null,
      emailText: emailText.trim() || null,
      emailSentAt: emailText.trim() ? emailSentAt : null,
    }),

  doNotCall: (inquiryId: number) => api.post<void>(`/admin/calls/inquiries/${inquiryId}/do-not-call`),

  resolve: (id: number) => api.post<void>(`/admin/calls/${id}/resolve`),

  settings: () => api.get<CallSettings>('/admin/calls/settings'),

  updateSettings: (values: CallSettings) => api.put<void>('/admin/calls/settings', values),
};

export default CallCenterService;
