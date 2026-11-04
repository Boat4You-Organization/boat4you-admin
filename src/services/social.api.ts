/* Objave (Social publisher S0): one call per /admin/social endpoint (SYSTEM_ADMIN). Contract and backend design:
 * docs/superpowers/specs/2026-11-03-social-publisher-design.md. The backend keeps the OAuth tokens, stores the media,
 * runs the scheduler and talks to the networks; the admin never sees a network token.
 *
 * Type-only imports on purpose (like yacht-media.api.ts): social.service.ts binds it to the admin's axios instance.
 * Errors: the axios interceptor rejects with the response body ({code, message}) or a proxy page string, never the
 * status, so callers show errorMessage(e, fallback) from yacht-media.api.ts. */
import type { AxiosInstance, AxiosProgressEvent } from 'axios';

import type {
  SocialAccount,
  SocialAiOverview,
  SocialAiRun,
  SocialAiSetting,
  SocialApiKey,
  SocialApiKeyCreated,
  SocialMedia,
  SocialPage,
  SocialPlatform,
  SocialPlatformAvailability,
  SocialPost,
  SocialPostFilter,
  SocialPostRequest,
} from '@/types/social.type';

/** Drops empty filters so the query string carries only the ones in use. */
const params = (f: object) =>
  Object.fromEntries(Object.entries(f).filter(([, v]) => v !== undefined && v !== null && v !== ''));

export const createSocialApi = (api: AxiosInstance) => ({
  /* ---- Channels ---- */
  accounts: () => api.get<SocialAccount[]>('/admin/social/accounts').then(r => r.data),

  platforms: () => api.get<SocialPlatformAvailability>('/admin/social/platforms').then(r => r.data),

  /** OAuth start: the backend answers the network's consent URL (with its own state); the browser goes there and the
   * network comes back to the backend's callback, which stores the token and redirects to /social/channels. */
  connect: (platform: SocialPlatform, site: string | null) =>
    api
      .post<{ authorizeUrl: string }>(`/admin/social/accounts/connect/${platform}`, {
        returnUrl: `${window.location.origin}/social/channels`,
        site,
      })
      .then(r => r.data),

  /** Which site a channel belongs to; null = all sites (shared channel). */
  setSite: (id: number, site: string | null) =>
    api.patch<SocialAccount>(`/admin/social/accounts/${id}`, { site }).then(r => r.data),

  /** Networks without OAuth for us (Bluesky: handle + app password). */
  connectWithCredentials: (platform: SocialPlatform, identifier: string, secret: string, site: string | null) =>
    api
      .post<SocialAccount[]>('/admin/social/accounts/credentials', { platform, identifier, secret, site })
      .then(r => r.data),

  disconnect: (id: number) => api.delete<void>(`/admin/social/accounts/${id}`),

  /* ---- Media ---- */
  /** The raw file as the body (no multipart: videos are far above the server's multipart limit). */
  uploadMedia: (file: File, onProgress?: (fraction: number) => void) =>
    api
      .post<SocialMedia>('/admin/social/media', file, {
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        params: { fileName: file.name },
        onUploadProgress: (e: AxiosProgressEvent) => {
          if (e.total) onProgress?.(Math.min(1, e.loaded / e.total));
        },
      })
      .then(r => r.data),

  /* ---- Posts ---- */
  posts: (filter: SocialPostFilter) =>
    api.get<SocialPage<SocialPost>>('/admin/social/posts', { params: params(filter) }).then(r => r.data),

  post: (id: number) => api.get<SocialPost>(`/admin/social/posts/${id}`).then(r => r.data),

  create: (body: SocialPostRequest) => api.post<SocialPost>('/admin/social/posts', body).then(r => r.data),

  update: (id: number, body: SocialPostRequest) =>
    api.put<SocialPost>(`/admin/social/posts/${id}`, body).then(r => r.data),

  /** A scheduled post goes back to nothing being sent; it stays in the list as CANCELLED. */
  cancel: (id: number) => api.post<SocialPost>(`/admin/social/posts/${id}/cancel`).then(r => r.data),

  /** Sends the FAILED channels of the post again. */
  retry: (id: number) => api.post<SocialPost>(`/admin/social/posts/${id}/retry`).then(r => r.data),

  /** Drafts and cancelled posts only; never deletes anything already on a network. */
  remove: (id: number) => api.delete<void>(`/admin/social/posts/${id}`),

  /* ---- Automation keys (public API /api/social/v1, header X-Api-Key) ---- */
  apiKeys: () => api.get<SocialApiKey[]>('/admin/social/api-keys').then(r => r.data),

  createApiKey: (name: string, draftsOnly: boolean) =>
    api.post<SocialApiKeyCreated>('/admin/social/api-keys', { name, draftsOnly }).then(r => r.data),

  revokeApiKey: (id: number) => api.delete<void>(`/admin/social/api-keys/${id}`),

  /* ---- AI daily posts ---- */
  ai: () => api.get<SocialAiOverview>('/admin/social/ai').then(r => r.data),

  saveAi: (setting: SocialAiSetting) =>
    api.put<SocialAiSetting>(`/admin/social/ai/${setting.site}`, setting).then(r => r.data),

  /** Today's AI post for this site now. */
  runAi: (site: string) => api.post<SocialAiRun>(`/admin/social/ai/${site}/run`).then(r => r.data),
});

export type SocialApi = ReturnType<typeof createSocialApi>;
