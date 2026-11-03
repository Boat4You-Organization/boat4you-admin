/* Objave (Social publisher, S0 3.11.2026): one post, many channels, published now or on a schedule by our own backend
 * (/admin/social/**, SYSTEM_ADMIN). The shapes below are the API contract in
 * docs/superpowers/specs/2026-11-03-social-publisher-design.md; the backend owns OAuth tokens, media storage, the
 * scheduler and every call to the networks. Type-only file: tests import it through `node --test` type stripping. */

export type SocialPlatform =
  | 'FACEBOOK'
  | 'INSTAGRAM'
  | 'THREADS'
  | 'LINKEDIN'
  | 'X'
  | 'TIKTOK'
  | 'YOUTUBE'
  | 'PINTEREST'
  | 'BLUESKY'
  | 'GOOGLE_BUSINESS';

/** CONNECTED = can publish; EXPIRED = the token ran out, reconnect; ERROR = the last call was refused (lastError). */
export type SocialAccountStatus = 'CONNECTED' | 'EXPIRED' | 'ERROR';

/** One place we can publish to: a Facebook page, an Instagram business account, a LinkedIn page, an X handle… */
export interface SocialAccount {
  id: number;
  platform: SocialPlatform;
  /** Page / channel / handle name as the network shows it. */
  name: string;
  /** @handle, page URL or channel URL, when the network has one. */
  handle: string | null;
  avatarUrl: string | null;
  status: SocialAccountStatus;
  /** ISO; null = the token does not expire (or the backend refreshes it itself). */
  tokenExpiresAt: string | null;
  lastError: string | null;
  connectedAt: string;
  /** TikTok before the app audit / YouTube before verification: posts land as private (SELF_ONLY). */
  privateOnly?: boolean;
}

export type SocialMediaKind = 'IMAGE' | 'VIDEO';

/** POST /admin/social/media answer: a file stored by our backend, publicly readable so the networks can fetch it. */
export interface SocialMedia {
  id: number;
  kind: SocialMediaKind;
  url: string;
  thumbnailUrl: string | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  durationSec: number | null;
}

/** Post as a whole. PARTIAL = some channels published, some failed. */
export type SocialPostStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHING' | 'PUBLISHED' | 'PARTIAL' | 'FAILED' | 'CANCELLED';

/** One channel of a post. */
export type SocialTargetStatus = 'PENDING' | 'SCHEDULED' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED' | 'CANCELLED';

/** Who made the post: a person in the admin, or the automation API (e.g. the daily Claude task). */
export type SocialPostSource = 'ADMIN' | 'API';

export interface SocialPostTarget {
  id: number;
  accountId: number;
  platform: SocialPlatform;
  accountName: string;
  /** This channel's own text; null = the post's text. */
  text: string | null;
  /** YouTube video title, Pinterest pin title, TikTok photo title. */
  title: string | null;
  status: SocialTargetStatus;
  publishedAt: string | null;
  /** Link to the published post on the network. */
  externalUrl: string | null;
  error: string | null;
  attempts: number;
}

export interface SocialPost {
  id: number;
  text: string;
  /** Link for networks that take one apart from the text (Pinterest destination, Google Business button, FB preview). */
  link: string | null;
  media: SocialMedia[];
  status: SocialPostStatus;
  /** ISO, UTC; null = draft or "publish now". */
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  source: SocialPostSource;
  /** Free text from the automation (e.g. "daily-claude 2026-11-04: Kornati"). */
  note: string | null;
  targets: SocialPostTarget[];
}

export type SocialPostAction = 'DRAFT' | 'SCHEDULE' | 'PUBLISH_NOW';

export interface SocialTargetRequest {
  accountId: number;
  text?: string | null;
  title?: string | null;
}

/** POST /admin/social/posts and PUT /admin/social/posts/{id}. */
export interface SocialPostRequest {
  text: string;
  link: string | null;
  mediaIds: number[];
  targets: SocialTargetRequest[];
  action: SocialPostAction;
  /** ISO with offset; required for SCHEDULE. */
  scheduledAt: string | null;
  note?: string | null;
}

export interface SocialPostFilter {
  /** ISO date-time, inclusive. Matches scheduledAt, else publishedAt, else createdAt. */
  from?: string;
  /** ISO date-time, exclusive. */
  to?: string;
  status?: SocialPostStatus;
  platform?: SocialPlatform;
  page?: number;
  size?: number;
}

export interface SocialPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/** Automation key for the public API (/api/social/v1/**, header X-Api-Key). The secret is shown once, on create. */
export interface SocialApiKey {
  id: number;
  name: string;
  /** First characters, to recognise the key ("b4ys_7Kq2…"). */
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  /** When true the API may only create drafts; a person publishes them from the admin. */
  draftsOnly: boolean;
}

export interface SocialApiKeyCreated extends SocialApiKey {
  /** The full key, returned once. */
  secret: string;
}
