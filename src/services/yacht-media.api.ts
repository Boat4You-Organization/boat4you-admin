/* Boats · Media (Mario 17.10.2026, gulet Allure 11769): our own photos, a video and the crew-profile PDF for ANY boat,
 * partner-synced ones included (the syncs never touch yacht_image.source = 'OWN', V9_92). The public boat page shows
 * them on all 7 sites: own photos arrive there as kind PARTNER, first by position; videoUrl / crewProfileUrl are
 * top-level fields of GET /public/yachts/{slug}. This page reads and changes them through GET /admin/yachts/{id}/media
 * (every image, hidden ones and the source included): every media call answers that same YachtMediaDto.
 *
 * No runtime imports on purpose: tests/yacht-media.test.ts runs this file with plain `node --test` (Node's type
 * stripping) against a fake HTTP client. yacht-media.service.ts binds it to the app's axios instance.
 *
 * Errors: the axios interceptor rejects with the response body (the backend's {code, message}, or a proxy's HTML page as
 * a string) or undefined (no readable answer), never the status, so callers show errorMessage(e, fallback). */
import type { AxiosInstance, AxiosProgressEvent } from 'axios';

export type ImageSource = 'OWN' | 'PARTNER';

/** GET /admin/yachts/lookup?q=&limit= (name or id). */
export interface YachtLookupItem {
  id: number;
  name: string;
  manufacturerName: string | null;
  modelName: string | null;
  slug: string;
  entryType: string | null;
  vesselType: string | null;
  mainImageId: number | null;
  imageCount: number;
  hasVideo: boolean;
  hasCrewProfile: boolean;
}

/** One yacht_image row of the selected boat, as the grid shows it. */
export interface MediaImage {
  id: number;
  position: number | null;
  /** The boat's card photo (yacht.main_image_id). */
  mainImage: boolean;
  layout: boolean;
  hidden: boolean;
  source: ImageSource;
}

/** One image of YachtMediaDto.images, and the PATCH /admin/yacht-images/{id} answer (YachtImageAdminDto). */
export interface AdminYachtImage {
  id: number;
  yachtId?: number;
  position?: number | null;
  mainImage?: boolean | null;
  layout?: boolean;
  layoutOverride?: boolean | null;
  hidden?: boolean;
  hiddenReason?: string | null;
  yachtMainImageId?: number | null;
  source?: ImageSource;
}

export interface ImagePatch {
  main?: true;
  layout?: boolean;
  hidden?: boolean;
}

/** GET /admin/yachts/{id}/media, and the answer of every media call (upload, order, delete, video, crew profile). */
export interface YachtMediaDto {
  yachtId: number;
  /** yacht.main_image_id: the card photo. */
  mainImageId: number | null;
  /** yacht.video_url (a custom boat's own video is not in it: see PublicYachtDetail). */
  videoUrl: string | null;
  /** The public PDF link, null = none. */
  crewProfileUrl: string | null;
  /** Every image of the boat in position order, hidden ones included. */
  images: AdminYachtImage[];
}

/** The part of GET /public/yachts/{slug} this page reads: which boat the sites serve (twin) and the video they show. */
export interface PublicYachtDetail {
  id: number;
  slug: string;
  videoUrl?: string | null;
  customDetails?: { videoUrl?: string | null } | null;
}

export interface MainImageFix {
  yachtId: number;
  fromImageId: number | null;
  toImageId: number | null;
}

export interface BlockedImage {
  imageId: number;
  yachtId: number;
  main: boolean;
}

export interface BlockedImageScan {
  dryRun: boolean;
  scanned: number;
  hashed: number;
  missingFiles: number;
  blocked: BlockedImage[];
  mainImagesFixed: MainImageFix[];
}

export interface MainImageFixResult {
  dryRun: boolean;
  layoutMainCount: number;
  fixed: MainImageFix[];
  withoutPhotoYachtIds: number[];
  hiddenMainCount?: number;
  missingMainCount?: number;
}

export interface LayoutCandidate {
  imageId: number;
  yachtId: number;
  main: boolean;
  score: number;
  backgroundFraction: number;
  contentBackgroundFraction: number;
  meanSaturation: number;
  width: number;
  height: number;
}

export interface LayoutScan {
  dryRun: boolean;
  onlyMain: boolean;
  scanned: number;
  unreadable: number;
  nextAfterId: number | null;
  candidates: LayoutCandidate[];
  mainImagesFixed: MainImageFix[];
  skippedImageIds?: number[];
}

export interface LayoutScanParams {
  dryRun: boolean;
  onlyMain: boolean;
  afterId?: number;
  limit?: number;
  /** Apply only: the reviewed candidates without the false positives. */
  imageIds?: number[];
}

/** Per request (contract); the backend refuses more. */
export const MAX_FILES_PER_REQUEST = 20;
/** FileSystemService refuses a bigger file (application.upload.max-file-size-mb, 10 on prod). */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
/** A batch closes at 20 files or 20 MB: the api.boat4you.com nginx refuses a body over 25 MB (client_max_body_size
 * 25m, 413) and the multipart boundaries need some room. One file is at most 10 MB, so it always fits. */
export const MAX_BATCH_BYTES = 20 * 1024 * 1024;
/** Crew profile, contract: PDF only, at most 15 MB. */
export const MAX_PDF_BYTES = 15 * 1024 * 1024;
/** What FileSystemService.detectImageType accepts (magic bytes); HEIC is not among them. */
export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';

const MB = 1024 * 1024;

const formatMb = (bytes: number) => `${(bytes / MB).toFixed(1)} MB`;

const extensionOf = (name: string) => {
  const dot = name.lastIndexOf('.');

  return dot < 0 ? '' : name.slice(dot + 1).toLowerCase();
};

/** "Manufacturer Model Name"; the model is not repeated when it already starts with the manufacturer. */
export const yachtLabel = (y: Pick<YachtLookupItem, 'manufacturerName' | 'modelName' | 'name'>): string => {
  const manufacturer = (y.manufacturerName ?? '').trim();
  const model = (y.modelName ?? '').trim();
  const parts =
    manufacturer && model.toLowerCase().startsWith(manufacturer.toLowerCase())
      ? [model, y.name]
      : [manufacturer, model, y.name];

  return parts
    .map(p => (p ?? '').trim())
    .filter(Boolean)
    .join(' ');
};

/** Why an image cannot be uploaded, or null. A missing MIME type falls back to the extension. */
export const imageFileProblem = (file: { name: string; type: string; size: number }): string | null => {
  const ext = extensionOf(file.name);
  const typeOk = file.type ? IMAGE_MIME_TYPES.includes(file.type) : ['jpg', 'jpeg', 'png', 'webp'].includes(ext);

  if (!typeOk) {
    return `${file.name}: only JPEG, PNG or WebP`;
  }

  if (file.size === 0) {
    return `${file.name}: empty file`;
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return `${file.name}: ${formatMb(file.size)}, at most ${formatMb(MAX_IMAGE_BYTES)}`;
  }

  return null;
};

export const pdfFileProblem = (file: { name: string; type: string; size: number }): string | null => {
  const typeOk = file.type ? file.type === 'application/pdf' : extensionOf(file.name) === 'pdf';

  if (!typeOk) {
    return `${file.name}: only PDF`;
  }

  if (file.size === 0) {
    return `${file.name}: empty file`;
  }

  if (file.size > MAX_PDF_BYTES) {
    return `${file.name}: ${formatMb(file.size)}, at most ${formatMb(MAX_PDF_BYTES)}`;
  }

  return null;
};

/** A PDF starts with "%PDF" (what FileSystemService.savePdfFile checks). */
export const isPdfMagic = (head: Uint8Array): boolean =>
  head.length >= 4 && head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46;

/** Upload batches in order: a batch closes at maxFiles files or when the next file would pass maxBytes (a single
 * file bigger than maxBytes still goes, alone). */
export const planBatches = <T extends { size: number }>(
  files: T[],
  maxFiles = MAX_FILES_PER_REQUEST,
  maxBytes = MAX_BATCH_BYTES
): T[][] => {
  const batches: T[][] = [];
  let current: T[] = [];
  let bytes = 0;

  files.forEach(file => {
    if (current.length > 0 && (current.length >= maxFiles || bytes + file.size > maxBytes)) {
      batches.push(current);
      current = [];
      bytes = 0;
    }

    current.push(file);
    bytes += file.size;
  });

  if (current.length > 0) {
    batches.push(current);
  }

  return batches;
};

/** Progress (0..1) of each file of a multipart request from the bytes sent so far: the parts go out in order. */
export const batchFileProgress = (sizes: number[], loaded: number, total?: number): number[] => {
  const sum = sizes.reduce((a, b) => a + b, 0);
  // The multipart body is a little bigger than the files (boundaries); scale to the files' share.
  const sent = total && total > 0 ? (loaded / total) * sum : loaded;
  let offset = 0;

  return sizes.map(size => {
    const start = offset;

    offset += size;

    if (size <= 0) {
      return sent >= start ? 1 : 0;
    }

    return Math.max(0, Math.min(1, (sent - start) / size));
  });
};

export interface VideoLink {
  provider: 'youtube' | 'vimeo';
  id: string;
  embedUrl: string;
}

/* The same rules as the backend's VideoUrlRules (PATCH /admin/yachts/{id}/media answers 400 otherwise), on the raw
 * text like java.net.URI: http(s), host youtube.com / www.youtube.com / youtu.be / vimeo.com / www.vimeo.com /
 * player.vimeo.com, no user info, no port, at most 512 characters, no whitespace. */
const MAX_VIDEO_URL_LENGTH = 512;
const URL_PARTS = /^([A-Za-z][A-Za-z0-9+.-]*):\/\/([^/?#]*)([^?#]*)(?:\?([^#]*))?(?:#[^#]*)?$/;
/** Besides whitespace and control characters, what java.net.URI refuses: "<>\^`{|}[] and a % without two hex digits. */
const NOT_A_URI = /["<>\\^`{|}[\]]|%(?![0-9A-Fa-f]{2})/;
const HOST = /^[A-Za-z0-9.-]+$/;

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_EMBED_PATH = /^\/embed\/([A-Za-z0-9_-]{11})\/?$/;
const YOUTU_BE_PATH = /^\/([A-Za-z0-9_-]{11})\/?$/;
/** vimeo.com/<id>, an unlisted film vimeo.com/<id>/<hash> too. */
const VIMEO_PATH = /^\/(\d+)(?:\/([0-9a-fA-F]+))?\/?$/;
const VIMEO_PLAYER_PATH = /^\/video\/(\d+)\/?$/;

const isControl = (c: string) => {
  const code = c.charCodeAt(0);

  return code < 0x20 || (code >= 0x7f && code <= 0x9f);
};

const isUriText = (text: string) =>
  text.length <= MAX_VIDEO_URL_LENGTH && !/\s/.test(text) && !Array.from(text).some(isControl) && !NOT_A_URI.test(text);

/** The first `name=value` of a raw query string, not decoded (as the backend reads it). */
const rawQueryParam = (query: string | undefined, name: string): string | null => {
  const pair = (query ?? '').split('&').find(p => p.includes('=') && p.slice(0, p.indexOf('=')) === name);

  return pair === undefined ? null : pair.slice(pair.indexOf('=') + 1);
};

const youtubeLink = (id: string): VideoLink => ({
  provider: 'youtube',
  id,
  embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
});

const vimeoLink = (id: string, hash?: string): VideoLink => ({
  provider: 'vimeo',
  id,
  embedUrl: `https://player.vimeo.com/video/${id}${hash ? `?h=${hash}` : ''}`,
});

/** The forms the backend accepts: youtube.com/watch?v=, youtu.be/<id>, youtube.com/embed/<id>, vimeo.com/<id>
 * (unlisted: vimeo.com/<id>/<hash>), player.vimeo.com/video/<id>. Anything else: null. */
export const parseVideoUrl = (raw: string): VideoLink | null => {
  // the backend trims the value before checking it
  const text = raw.trim();
  const parts = isUriText(text) ? URL_PARTS.exec(text) : null;

  if (!parts) {
    return null;
  }

  const [, scheme, authority, path, query] = parts;

  if (!['http', 'https'].includes(scheme.toLowerCase()) || !HOST.test(authority)) {
    return null;
  }

  const host = authority.toLowerCase();

  if (host === 'youtube.com' || host === 'www.youtube.com') {
    const v = path === '/watch' ? rawQueryParam(query, 'v') : null;
    const embed = YOUTUBE_EMBED_PATH.exec(path);

    if (v !== null) {
      return YOUTUBE_ID.test(v) ? youtubeLink(v) : null;
    }

    return embed ? youtubeLink(embed[1]) : null;
  }

  if (host === 'youtu.be') {
    const match = YOUTU_BE_PATH.exec(path);

    return match ? youtubeLink(match[1]) : null;
  }

  if (host === 'vimeo.com' || host === 'www.vimeo.com') {
    const match = VIMEO_PATH.exec(path);

    return match ? vimeoLink(match[1], match[2]) : null;
  }

  if (host === 'player.vimeo.com') {
    const match = VIMEO_PLAYER_PATH.exec(path);

    return match ? vimeoLink(match[1]) : null;
  }

  return null;
};

/** The grid from the admin media answer: every image of the boat in position order, MAIN = yacht.main_image_id. */
export const mediaImagesOf = (media: YachtMediaDto): MediaImage[] =>
  (media.images ?? []).map(img => ({
    id: img.id,
    position: img.position ?? null,
    mainImage: media.mainImageId != null ? img.id === media.mainImageId : img.mainImage === true,
    layout: img.layout === true,
    hidden: img.hidden === true,
    source: img.source === 'OWN' ? 'OWN' : 'PARTNER',
  }));

/** What a PATCH answer says about the image (only the fields it carries). */
const knownFromAdmin = (dto: AdminYachtImage): Partial<MediaImage> => {
  const state: Partial<MediaImage> = {};

  if (dto.position !== undefined) state.position = dto.position;

  if (dto.layout !== undefined) state.layout = dto.layout;

  if (dto.hidden !== undefined) state.hidden = dto.hidden;

  if (dto.source !== undefined) state.source = dto.source;

  return state;
};

/** Applies a PATCH answer to the grid: the image's flags and, when the answer names it, the boat's card photo. */
export const applyAdminImage = (images: MediaImage[], dto: AdminYachtImage): MediaImage[] => {
  const state = knownFromAdmin(dto);
  const mainId = dto.yachtMainImageId;

  return images.map(img => {
    const next = img.id === dto.id ? { ...img, ...state } : img;

    return mainId === undefined ? next : { ...next, mainImage: next.id === mainId };
  });
};

export const moveItem = <T>(items: T[], from: number, to: number): T[] => {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return items;
  }

  const next = items.slice();
  const [item] = next.splice(from, 1);

  next.splice(to, 0, item);

  return next;
};

/** A photo can be the card photo when it is visible and not a layout drawing. */
export const canBeMain = (img: MediaImage) => !img.hidden && !img.layout;

/** Own photos can be deleted; partner rows come back with the next sync (the backend answers 409) - hide them instead. */
export const canDelete = (img: MediaImage) => img.source === 'OWN';

export const PROXY_TOO_LARGE = 'Request too large (proxy limit)';

/** The backend body's message, else the fallback. A string body is a proxy page, not the API: nginx answers a body
 * over its client_max_body_size with an HTML 413 page. */
export const errorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'string') {
    return /\b413\b|too large/i.test(error) ? PROXY_TOO_LARGE : fallback;
  }

  const message = (error as { message?: unknown } | null | undefined)?.message;

  return typeof message === 'string' && message.trim() ? message : fallback;
};

const isMediaDto = (data: unknown): data is YachtMediaDto =>
  typeof data === 'object' &&
  data !== null &&
  typeof (data as YachtMediaDto).yachtId === 'number' &&
  Array.isArray((data as YachtMediaDto).images);

export interface UploadOutcome {
  /** The boat's media after the last stored batch (the backend answers YachtMediaDto); none when nothing was stored. */
  media?: YachtMediaDto;
  /** Files stored, in order. */
  uploaded: number;
  /** The first batch that failed and the files it and the later batches carried (not stored). */
  error?: unknown;
  failedFiles: number;
}

type Http = Pick<AxiosInstance, 'get' | 'post' | 'put' | 'patch' | 'delete'>;

const MULTIPART = { 'Content-Type': 'multipart/form-data' };

export const createYachtMediaApi = (http: Http) => ({
  async lookup(q: string, limit = 20): Promise<YachtLookupItem[]> {
    const { data } = await http.get<YachtLookupItem[]>('/admin/yachts/lookup', { params: { q: q.trim(), limit } });

    return Array.isArray(data) ? data : [];
  },

  async getMedia(yachtId: number): Promise<YachtMediaDto> {
    const { data } = await http.get<YachtMediaDto>(`/admin/yachts/${yachtId}/media`);

    return data;
  },

  /** Only for the twin check and a custom boat's video: the grid comes from getMedia. */
  async getPublicDetail(slug: string): Promise<PublicYachtDetail> {
    const { data } = await http.get<PublicYachtDetail>(`/public/yachts/${encodeURIComponent(slug)}`);

    return data;
  },

  /**
   * Sequential batches (planBatches) under the multipart field "files"; stops at the first failed batch.
   * onProgress: bytes sent per file (0..1) and how many files the backend has stored so far (whole batches).
   */
  async uploadImages(
    yachtId: number,
    files: File[],
    onProgress?: (perFile: number[], stored: number) => void
  ): Promise<UploadOutcome> {
    const progress = files.map(() => 0);
    const outcome: UploadOutcome = { uploaded: 0, failedFiles: 0 };
    const report = () => onProgress?.(progress.slice(), outcome.uploaded);
    let offset = 0;

    // eslint-disable-next-line no-restricted-syntax -- batches go one after the other, on purpose
    for (const batch of planBatches(files)) {
      const start = offset;
      const sizes = batch.map(f => f.size);
      const form = new FormData();

      batch.forEach(file => form.append('files', file, file.name));

      try {
        // eslint-disable-next-line no-await-in-loop -- see above
        const { data } = await http.post(`/admin/yachts/${yachtId}/images`, form, {
          headers: MULTIPART,
          onUploadProgress: (e: AxiosProgressEvent) => {
            batchFileProgress(sizes, e.loaded, e.total).forEach((p, i) => {
              progress[start + i] = p;
            });
            report();
          },
        });

        sizes.forEach((_, i) => {
          progress[start + i] = 1;
        });

        if (isMediaDto(data)) {
          outcome.media = data;
        }

        outcome.uploaded += batch.length;
        report();
      } catch (error) {
        outcome.error = error;
        outcome.failedFiles = files.length - start;

        return outcome;
      }

      offset += batch.length;
    }

    return outcome;
  },

  async patchImage(imageId: number, patch: ImagePatch): Promise<AdminYachtImage> {
    const { data } = await http.patch<AdminYachtImage>(`/admin/yacht-images/${imageId}`, patch);

    return data;
  },

  async reorderImages(yachtId: number, imageIds: number[]): Promise<YachtMediaDto> {
    const { data } = await http.put<YachtMediaDto>(`/admin/yachts/${yachtId}/images/order`, { imageIds });

    return data;
  },

  async deleteImage(yachtId: number, imageId: number): Promise<YachtMediaDto> {
    const { data } = await http.delete<YachtMediaDto>(`/admin/yachts/${yachtId}/images/${imageId}`);

    return data;
  },

  async setVideo(yachtId: number, videoUrl: string | null): Promise<YachtMediaDto> {
    const { data } = await http.patch<YachtMediaDto>(`/admin/yachts/${yachtId}/media`, { videoUrl });

    return data;
  },

  async uploadCrewProfile(yachtId: number, file: File): Promise<YachtMediaDto> {
    const form = new FormData();

    form.append('file', file, file.name);

    const { data } = await http.post<YachtMediaDto>(`/admin/yachts/${yachtId}/crew-profile`, form, {
      headers: MULTIPART,
    });

    return data;
  },

  async deleteCrewProfile(yachtId: number): Promise<YachtMediaDto> {
    const { data } = await http.delete<YachtMediaDto>(`/admin/yachts/${yachtId}/crew-profile`);

    return data;
  },

  async detectBlocked(dryRun: boolean): Promise<BlockedImageScan> {
    const { data } = await http.post<BlockedImageScan>('/admin/yachts/images/detect-blocked', undefined, {
      params: { dryRun },
    });

    return data;
  },

  async fixLayoutMains(dryRun: boolean): Promise<MainImageFixResult> {
    const { data } = await http.post<MainImageFixResult>('/admin/yachts/main-image/fix-layout', undefined, {
      params: { dryRun },
    });

    return data;
  },

  /**
   * Dry run: one page of candidates. Apply: the reviewed imageIds go in the request BODY as a form field
   * (imageIds=1,2,3): the endpoint reads them as a request parameter (Spring binds a POST form body to
   * @RequestParam) and up to 2000 ids would not fit a query string.
   */
  async detectLayout({ dryRun, onlyMain, afterId = 0, limit = 200, imageIds }: LayoutScanParams): Promise<LayoutScan> {
    const params = { dryRun, onlyMain, afterId, limit };

    if (dryRun) {
      const { data } = await http.post<LayoutScan>('/admin/yachts/images/detect-layout', undefined, { params });

      return data;
    }

    const { data } = await http.post<LayoutScan>(
      '/admin/yachts/images/detect-layout',
      `imageIds=${(imageIds ?? []).join(',')}`,
      { params, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    return data;
  },
});

export type YachtMediaApi = ReturnType<typeof createYachtMediaApi>;
