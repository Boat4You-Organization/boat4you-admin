/* Objave: what each network accepts in one post (text length, media, title), as the official publishing APIs document it
 * (checked 3.11.2026, see docs/superpowers/specs/2026-11-03-social-publisher-design.md § Platforms), plus the composer's
 * draft, its checks against those rules and the request it sends. The composer warns before saving; the backend
 * validates again and the network has the last word.
 *
 * Type-only imports on purpose: tests/social.test.ts runs this file with plain `node --test` (type stripping). */
import type { SocialMedia, SocialPlatform, SocialPost, SocialPostAction, SocialPostRequest } from '@/types/social.type';

export type CharCounting = 'codepoints' | 'graphemes' | 'x-weighted';

export interface PlatformRules {
  platform: SocialPlatform;
  label: string;
  /** Brand colour for the badge. */
  color: string;
  /** Max text length (null = no practical limit we would reach). */
  maxChars: number;
  counting: CharCounting;
  /** The post cannot go out without at least one photo or video. */
  mediaRequired: boolean;
  /** The post needs a video (YouTube). */
  videoRequired: boolean;
  maxImages: number;
  maxVideos: number;
  /** Photos and a video in the same post. */
  allowMixed: boolean;
  /** Network has a separate title field. */
  title: 'required' | 'optional' | 'none';
  maxTitle: number;
  maxHashtags: number | null;
  /** Links in the text are not clickable there (Instagram, TikTok): warn. */
  linksClickable: boolean;
  /** Reaches the network through: shown on the Channels tab. */
  connectHint: string;
}

const rules = (r: PlatformRules) => r;

export const PLATFORM_RULES: Record<SocialPlatform, PlatformRules> = {
  FACEBOOK: rules({
    platform: 'FACEBOOK',
    label: 'Facebook',
    color: '#1877F2',
    maxChars: 63206,
    counting: 'codepoints',
    mediaRequired: false,
    videoRequired: false,
    maxImages: 10,
    maxVideos: 1,
    allowMixed: false,
    title: 'none',
    maxTitle: 0,
    maxHashtags: null,
    linksClickable: true,
    connectHint: 'Facebook stranica (Page) na kojoj si admin — Meta Graph API.',
  }),
  INSTAGRAM: rules({
    platform: 'INSTAGRAM',
    label: 'Instagram',
    color: '#E4405F',
    maxChars: 2200,
    counting: 'codepoints',
    mediaRequired: true,
    videoRequired: false,
    maxImages: 10,
    maxVideos: 10,
    allowMixed: true,
    title: 'none',
    maxTitle: 0,
    maxHashtags: 30,
    linksClickable: false,
    connectHint: 'Instagram Business ili Creator račun povezan s Facebook stranicom — Meta Graph API.',
  }),
  THREADS: rules({
    platform: 'THREADS',
    label: 'Threads',
    color: '#101010',
    maxChars: 500,
    counting: 'codepoints',
    mediaRequired: false,
    videoRequired: false,
    maxImages: 20,
    maxVideos: 20,
    allowMixed: true,
    title: 'none',
    maxTitle: 0,
    maxHashtags: null,
    linksClickable: true,
    connectHint: 'Threads profil (isti Meta račun kao Instagram) — Threads API.',
  }),
  LINKEDIN: rules({
    platform: 'LINKEDIN',
    label: 'LinkedIn',
    color: '#0A66C2',
    maxChars: 3000,
    counting: 'codepoints',
    mediaRequired: false,
    videoRequired: false,
    maxImages: 20,
    maxVideos: 1,
    allowMixed: false,
    title: 'none',
    maxTitle: 0,
    maxHashtags: null,
    linksClickable: true,
    connectHint: 'LinkedIn stranica tvrtke ili osobni profil — LinkedIn Posts API.',
  }),
  X: rules({
    platform: 'X',
    label: 'X',
    color: '#000000',
    maxChars: 280,
    counting: 'x-weighted',
    mediaRequired: false,
    videoRequired: false,
    maxImages: 4,
    maxVideos: 1,
    allowMixed: false,
    title: 'none',
    maxTitle: 0,
    maxHashtags: null,
    linksClickable: true,
    connectHint: 'X (Twitter) račun — X API v2 (pisanje objava se naplaćuje po X-ovom cjeniku).',
  }),
  TIKTOK: rules({
    platform: 'TIKTOK',
    label: 'TikTok',
    color: '#FE2C55',
    maxChars: 2200,
    counting: 'codepoints',
    mediaRequired: true,
    videoRequired: false,
    maxImages: 35,
    maxVideos: 1,
    allowMixed: false,
    title: 'optional',
    maxTitle: 90,
    maxHashtags: null,
    linksClickable: false,
    connectHint: 'TikTok račun — Content Posting API (do TikTokove revizije aplikacije objave su privatne).',
  }),
  YOUTUBE: rules({
    platform: 'YOUTUBE',
    label: 'YouTube',
    color: '#FF0000',
    maxChars: 5000,
    counting: 'codepoints',
    mediaRequired: true,
    videoRequired: true,
    maxImages: 0,
    maxVideos: 1,
    allowMixed: false,
    title: 'required',
    maxTitle: 100,
    maxHashtags: null,
    linksClickable: true,
    connectHint: 'YouTube kanal (video ili Shorts) — YouTube Data API v3.',
  }),
  PINTEREST: rules({
    platform: 'PINTEREST',
    label: 'Pinterest',
    color: '#E60023',
    maxChars: 500,
    counting: 'codepoints',
    mediaRequired: true,
    videoRequired: false,
    maxImages: 1,
    maxVideos: 1,
    allowMixed: false,
    title: 'optional',
    maxTitle: 100,
    maxHashtags: null,
    linksClickable: true,
    connectHint: 'Pinterest business račun i ploča (board) — Pinterest API v5.',
  }),
  BLUESKY: rules({
    platform: 'BLUESKY',
    label: 'Bluesky',
    color: '#1185FE',
    maxChars: 300,
    counting: 'graphemes',
    mediaRequired: false,
    videoRequired: false,
    maxImages: 4,
    maxVideos: 1,
    allowMixed: false,
    title: 'none',
    maxTitle: 0,
    maxHashtags: null,
    linksClickable: true,
    connectHint: 'Bluesky handle + App Password (Settings → App passwords) — AT Protocol.',
  }),
  GOOGLE_BUSINESS: rules({
    platform: 'GOOGLE_BUSINESS',
    label: 'Google Business',
    color: '#4285F4',
    maxChars: 1500,
    counting: 'codepoints',
    mediaRequired: false,
    videoRequired: false,
    maxImages: 1,
    maxVideos: 0,
    allowMixed: false,
    title: 'none',
    maxTitle: 0,
    maxHashtags: null,
    linksClickable: false,
    connectHint: 'Google Business Profile (lokacija tvrtke na Google kartama) — Business Profile API.',
  }),
};

/** Order of the platforms everywhere in the UI. */
export const PLATFORMS: SocialPlatform[] = [
  'FACEBOOK',
  'INSTAGRAM',
  'THREADS',
  'LINKEDIN',
  'X',
  'TIKTOK',
  'YOUTUBE',
  'PINTEREST',
  'BLUESKY',
  'GOOGLE_BUSINESS',
];

/** Connected with a handle + app password instead of an OAuth redirect. */
export const CREDENTIAL_PLATFORMS: SocialPlatform[] = ['BLUESKY'];

const URL_RE = /\bhttps?:\/\/[^\s<>"]+|\bwww\.[^\s<>"]+/gi;

/** X counts every link as 23 and most non-Latin characters and emoji as 2 (twitter-text v3 weights). */
const xWeight = (cp: number) =>
  (cp >= 0 && cp <= 4351) || (cp >= 8192 && cp <= 8205) || (cp >= 8208 && cp <= 8223) || (cp >= 8242 && cp <= 8247)
    ? 1
    : 2;

const countGraphemes = (text: string) => {
  const { Segmenter } = Intl as unknown as { Segmenter?: typeof Intl.Segmenter };

  if (!Segmenter) return Array.from(text).length;

  return Array.from(new Segmenter(undefined, { granularity: 'grapheme' }).segment(text)).length;
};

const countXWeighted = (text: string) => {
  let total = 0;
  const withoutUrls = text.replace(URL_RE, () => {
    total += 23;

    return '';
  });

  return Array.from(withoutUrls).reduce((sum, ch) => sum + xWeight(ch.codePointAt(0) ?? 0), total);
};

/** Length of the text the way the network counts it. */
export const countChars = (text: string, counting: CharCounting): number => {
  if (counting === 'graphemes') return countGraphemes(text);

  if (counting === 'x-weighted') return countXWeighted(text);

  return Array.from(text).length;
};

export const countFor = (platform: SocialPlatform, text: string) => countChars(text, PLATFORM_RULES[platform].counting);

/** #hashtags in the text (letters, digits, underscore; Croatian letters included). */
export const hashtagsOf = (text: string): string[] => text.match(/(^|\s)#[\p{L}\p{N}_]+/gu)?.map(h => h.trim()) ?? [];

export const hasLink = (text: string) => {
  URL_RE.lastIndex = 0;

  return URL_RE.test(text);
};

/* ---- Composer ---- */

export interface ComposerTarget {
  accountId: number;
  platform: SocialPlatform;
  accountName: string;
  /** null = this channel uses the post's text. */
  customText: string | null;
  title: string;
}

export type ComposerMedia = Pick<SocialMedia, 'id' | 'kind'> & Partial<SocialMedia>;

export interface ComposerDraft {
  text: string;
  link: string;
  media: ComposerMedia[];
  targets: ComposerTarget[];
  /** `YYYY-MM-DDTHH:mm` in the admin's local time (an <input type="datetime-local"> value), '' = not set. */
  scheduledLocal: string;
  note: string;
}

export const EMPTY_DRAFT: ComposerDraft = { text: '', link: '', media: [], targets: [], scheduledLocal: '', note: '' };

export type IssueCode =
  | 'empty'
  | 'tooLong'
  | 'mediaRequired'
  | 'videoRequired'
  | 'tooManyImages'
  | 'tooManyVideos'
  | 'imagesNotSupported'
  | 'videoNotSupported'
  | 'mixedMedia'
  | 'titleRequired'
  | 'titleTooLong'
  | 'angleBrackets'
  | 'tooManyHashtags'
  | 'linkNotClickable'
  | 'aspectRatio';

export type PostIssueCode = 'noTargets' | 'scheduleMissing' | 'scheduleInvalid' | 'scheduleInPast' | 'linkInvalid';

export interface Issue<C extends string = IssueCode> {
  level: 'error' | 'warning';
  code: C;
  count?: number;
  max?: number;
}

export const effectiveText = (draft: Pick<ComposerDraft, 'text'>, target: Pick<ComposerTarget, 'customText'>) =>
  target.customText ?? draft.text;

const aspectOk = (ratio: number) => ratio >= 0.8 - 0.005 && ratio <= 1.91 + 0.005;

/** What one channel would refuse (errors) or show badly (warnings) for this text, title and media. */
export const validateTarget = (
  platform: SocialPlatform,
  text: string,
  title: string,
  media: (Pick<SocialMedia, 'kind'> & Partial<Pick<SocialMedia, 'width' | 'height'>>)[]
): Issue[] => {
  const r = PLATFORM_RULES[platform];
  const issues: Issue[] = [];
  const images = media.filter(m => m.kind === 'IMAGE').length;
  const videos = media.filter(m => m.kind === 'VIDEO').length;
  const trimmed = text.trim();

  if (!trimmed && media.length === 0) issues.push({ level: 'error', code: 'empty' });

  const count = countFor(platform, text);

  if (count > r.maxChars) issues.push({ level: 'error', code: 'tooLong', count, max: r.maxChars });

  if (r.videoRequired && videos === 0) issues.push({ level: 'error', code: 'videoRequired' });
  else if (r.mediaRequired && media.length === 0) issues.push({ level: 'error', code: 'mediaRequired' });

  if (images > 0 && r.maxImages === 0) issues.push({ level: 'error', code: 'imagesNotSupported' });
  else if (images > r.maxImages) {
    issues.push({ level: 'error', code: 'tooManyImages', count: images, max: r.maxImages });
  }

  if (videos > 0 && r.maxVideos === 0) issues.push({ level: 'error', code: 'videoNotSupported' });
  else if (videos > r.maxVideos) {
    issues.push({ level: 'error', code: 'tooManyVideos', count: videos, max: r.maxVideos });
  }

  if (!r.allowMixed && images > 0 && videos > 0 && r.maxImages > 0 && r.maxVideos > 0) {
    issues.push({ level: 'error', code: 'mixedMedia' });
  }

  if (r.title === 'required' && !title.trim()) issues.push({ level: 'error', code: 'titleRequired' });

  if (r.title !== 'none' && Array.from(title).length > r.maxTitle) {
    issues.push({ level: 'error', code: 'titleTooLong', count: Array.from(title).length, max: r.maxTitle });
  }

  // YouTube refuses < and > in the title and the description.
  if (platform === 'YOUTUBE' && /[<>]/.test(`${title}${text}`)) issues.push({ level: 'error', code: 'angleBrackets' });

  const tags = hashtagsOf(text).length;

  if (r.maxHashtags != null && tags > r.maxHashtags) {
    issues.push({ level: 'error', code: 'tooManyHashtags', count: tags, max: r.maxHashtags });
  }

  if (!r.linksClickable && hasLink(text)) issues.push({ level: 'warning', code: 'linkNotClickable' });

  // Instagram refuses feed photos narrower than 4:5 or wider than 1.91:1.
  if (
    platform === 'INSTAGRAM' &&
    media.some(m => m.kind === 'IMAGE' && m.width && m.height && !aspectOk(m.width / m.height))
  ) {
    issues.push({ level: 'error', code: 'aspectRatio' });
  }

  return issues;
};

export const isHttpUrl = (s: string) => {
  try {
    const u = new URL(s);

    return (u.protocol === 'https:' || u.protocol === 'http:') && !!u.hostname && !u.username && !u.password;
  } catch {
    return false;
  }
};

/** `YYYY-MM-DDTHH:mm` (local) → Date, or null. */
export const parseLocal = (local: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);

  if (!m) return null;

  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));

  // 2026-02-31 rolls over to March: not a real date.
  return d.getMonth() === Number(m[2]) - 1 && d.getDate() === Number(m[3]) ? d : null;
};

/** The networks need a moment: a schedule must be at least this far ahead. */
export const MIN_LEAD_MS = 2 * 60 * 1000;

export interface DraftCheck {
  ok: boolean;
  post: Issue<PostIssueCode>[];
  targets: Record<number, Issue[]>;
}

/** Everything the composer must fix before this action; drafts only need something to save. */
export const validateDraft = (draft: ComposerDraft, action: SocialPostAction, now: Date): DraftCheck => {
  const post: Issue<PostIssueCode>[] = [];
  const targets: Record<number, Issue[]> = {};

  if (draft.link.trim() && !isHttpUrl(draft.link.trim())) post.push({ level: 'error', code: 'linkInvalid' });

  if (action !== 'DRAFT' && draft.targets.length === 0) post.push({ level: 'error', code: 'noTargets' });

  if (action === 'SCHEDULE') {
    if (!draft.scheduledLocal) post.push({ level: 'error', code: 'scheduleMissing' });
    else {
      const at = parseLocal(draft.scheduledLocal);

      if (!at) post.push({ level: 'error', code: 'scheduleInvalid' });
      else if (at.getTime() < now.getTime() + MIN_LEAD_MS) post.push({ level: 'error', code: 'scheduleInPast' });
    }
  }

  draft.targets.forEach(t => {
    targets[t.accountId] = validateTarget(t.platform, effectiveText(draft, t), t.title, draft.media);
  });

  const blocking =
    post.some(i => i.level === 'error') ||
    (action !== 'DRAFT' && Object.values(targets).some(list => list.some(i => i.level === 'error')));

  // A draft with nothing in it is not worth saving.
  const emptyDraft = action === 'DRAFT' && !draft.text.trim() && draft.media.length === 0 && draft.targets.length === 0;

  return { ok: !blocking && !emptyDraft, post, targets };
};

/** The body of POST/PUT /admin/social/posts. An override equal to the main text is sent as "no override". */
export const buildRequest = (draft: ComposerDraft, action: SocialPostAction): SocialPostRequest => {
  const at = action === 'SCHEDULE' ? parseLocal(draft.scheduledLocal) : null;

  return {
    text: draft.text.trim(),
    link: draft.link.trim() || null,
    mediaIds: draft.media.map(m => m.id),
    targets: draft.targets.map(t => {
      const custom = t.customText?.trim();

      return {
        accountId: t.accountId,
        text: custom && custom !== draft.text.trim() ? custom : null,
        title: t.title.trim() || null,
      };
    }),
    action,
    scheduledAt: at ? at.toISOString() : null,
    note: draft.note.trim() || null,
  };
};

const pad = (n: number) => String(n).padStart(2, '0');

/** Date → `YYYY-MM-DDTHH:mm` in local time. */
export const toLocalInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** A sensible first schedule: the next full hour at least 30 minutes away. */
export const suggestedSlot = (now: Date) => {
  const d = new Date(now.getTime() + 30 * 60 * 1000);

  if (d.getMinutes() !== 0 || d.getSeconds() !== 0 || d.getMilliseconds() !== 0) {
    d.setHours(d.getHours() + 1, 0, 0, 0);
  }

  return toLocalInput(d);
};

/** An existing post back into the composer (edit, or "duplicate" with `copy`). */
export const draftFromPost = (post: SocialPost, copy = false): ComposerDraft => ({
  text: post.text,
  link: post.link ?? '',
  media: post.media,
  targets: post.targets.map(t => ({
    accountId: t.accountId,
    platform: t.platform,
    accountName: t.accountName,
    customText: t.text,
    title: t.title ?? '',
  })),
  scheduledLocal: !copy && post.scheduledAt ? toLocalInput(new Date(post.scheduledAt)) : '',
  note: copy ? '' : (post.note ?? ''),
});

/** Only drafts and posts still waiting for their time can be changed; the rest already reached a network. */
export const isEditable = (post: Pick<SocialPost, 'status'>) => post.status === 'DRAFT' || post.status === 'SCHEDULED';

export const canRetry = (post: Pick<SocialPost, 'status' | 'targets'>) =>
  (post.status === 'FAILED' || post.status === 'PARTIAL') && post.targets.some(t => t.status === 'FAILED');

export const canCancel = (post: Pick<SocialPost, 'status'>) => post.status === 'SCHEDULED';

/** Only posts with nothing on any network: drafts, cancelled ones and ones that failed everywhere. */
export const canDelete = (post: Pick<SocialPost, 'status'>) =>
  post.status === 'DRAFT' || post.status === 'CANCELLED' || post.status === 'FAILED';

/* ---- Media files ---- */

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const VIDEO_TYPES = ['video/mp4', 'video/quicktime'];
/** Instagram takes photos up to 8 MB; the backend re-encodes bigger ones, so 20 MB is the upload ceiling. */
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
/** YouTube and Reels videos; needs the larger nginx body limit on /admin/social/media (spec § Media). */
export const MAX_VIDEO_BYTES = 500 * 1024 * 1024;

const EXT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
};

export type MediaFileProblem = 'type' | 'imageTooLarge' | 'videoTooLarge';

/** The file's MIME type, falling back to the extension when the browser gives none. */
export const mediaTypeOf = (file: { name: string; type: string }) =>
  file.type || EXT_TYPES[file.name.split('.').pop()?.toLowerCase() ?? ''] || '';

/** Why a file cannot be uploaded, or null. */
export const mediaFileProblem = (file: { name: string; type: string; size: number }): MediaFileProblem | null => {
  const type = mediaTypeOf(file);

  if (IMAGE_TYPES.includes(type)) return file.size > MAX_IMAGE_BYTES ? 'imageTooLarge' : null;

  if (VIDEO_TYPES.includes(type)) return file.size > MAX_VIDEO_BYTES ? 'videoTooLarge' : null;

  return 'type';
};
