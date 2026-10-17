/* Boats · Media (Mario 17.10.2026, gulet Allure 11769): our own photos, a video and the crew-profile PDF for ANY boat,
 * partner-synced ones included (the syncs never touch yacht_image.source = 'OWN', V9_92). The public boat page shows
 * them on all 7 sites: own photos arrive there as kind PARTNER, first by position; videoUrl / crewProfileUrl are
 * top-level fields of GET /public/yachts/{slug}.
 *
 * No runtime imports on purpose: tests/yacht-media.test.ts runs this file with plain `node --test` (Node's type
 * stripping) against a fake HTTP client. yacht-media.service.ts binds it to the app's axios instance.
 *
 * Errors: the axios interceptor rejects with the backend body ({code, message}) or undefined, never the status, so
 * callers show errorMessage(e, fallback). */
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
  mainImage: boolean;
  layout: boolean;
  hidden: boolean;
  /** null: not known here. The public detail sends own photos as kind PARTNER; this session's uploads and an admin
   * answer that carries `source` tell them apart. */
  source: ImageSource | null;
}

/** PATCH /admin/yacht-images/{id} answer (YachtImageAdminDto). */
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

export interface PublicYachtImage {
  id: number | null;
  position?: number | null;
  mainImage?: boolean | null;
  layout?: boolean;
  kind?: string;
}

/** The part of GET /public/yachts/{slug} this page reads. */
export interface PublicYachtDetail {
  id: number;
  slug: string;
  yachtImages?: PublicYachtImage[] | null;
  videoUrl?: string | null;
  crewProfileUrl?: string | null;
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
/** Keeps one multipart request well under any proxy body limit; a batch closes at 20 files or 40 MB. */
export const MAX_BATCH_BYTES = 40 * 1024 * 1024;
/** Crew profile, contract: PDF only, at most 15 MB. */
export const MAX_PDF_BYTES = 15 * 1024 * 1024;
/** What FileSystemService.detectImageType accepts (magic bytes); HEIC is not among them. */
export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';

/** Gallery kinds that are yacht_image rows of THIS boat. MODEL_SAMPLE ids belong to a donor boat, MARINA ids to a
 * location: never patched, ordered or deleted from here. No kind (GALLERY_EXTENDED off) = the boat's own rows. */
const OWN_ROW_KINDS = ['PARTNER', 'LAYOUT'];

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

const YOUTUBE_HOSTS = ['youtube.com', 'www.youtube.com', 'm.youtube.com'];
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID = /^\d{1,12}$/;

/** The forms the backend accepts (PATCH /admin/yachts/{id}/media): youtube.com/watch?v=, youtu.be/<id>,
 * youtube.com/embed/<id>, vimeo.com/<id>, player.vimeo.com/video/<id>. Anything else: null. */
export const parseVideoUrl = (raw: string): VideoLink | null => {
  let url: URL;

  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return null;
  }

  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split('/').filter(Boolean);
  const youtube = (id: string | null | undefined): VideoLink | null =>
    id && YOUTUBE_ID.test(id)
      ? { provider: 'youtube', id, embedUrl: `https://www.youtube-nocookie.com/embed/${id}` }
      : null;
  const vimeo = (id: string | undefined): VideoLink | null =>
    id && VIMEO_ID.test(id) ? { provider: 'vimeo', id, embedUrl: `https://player.vimeo.com/video/${id}` } : null;

  if (YOUTUBE_HOSTS.includes(host)) {
    if (segments.length === 1 && segments[0] === 'watch') {
      return youtube(url.searchParams.get('v'));
    }

    if (segments.length === 2 && segments[0] === 'embed') {
      return youtube(segments[1]);
    }

    return null;
  }

  if (host === 'youtu.be') {
    return segments.length === 1 ? youtube(segments[0]) : null;
  }

  if (host === 'vimeo.com' || host === 'www.vimeo.com') {
    return segments.length === 1 ? vimeo(segments[0]) : null;
  }

  if (host === 'player.vimeo.com') {
    return segments.length === 2 && segments[0] === 'video' ? vimeo(segments[1]) : null;
  }

  return null;
};

/** The boat's own yacht_image rows from the public detail (visible ones only: hidden images are never public). */
export const publicImagesOf = (detail: PublicYachtDetail): MediaImage[] =>
  (detail.yachtImages ?? [])
    .filter(img => img.id != null && (!img.kind || OWN_ROW_KINDS.includes(img.kind)))
    .map(img => ({
      id: img.id as number,
      position: img.position ?? null,
      mainImage: img.mainImage === true,
      layout: img.layout === true || img.kind === 'LAYOUT',
      hidden: false,
      source: null,
    }));

const byPosition = (a: MediaImage, b: MediaImage) =>
  (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER) || a.id - b.id;

/**
 * The grid: the public rows in position order, each with the origin known from this session (`known`: uploads and
 * PATCH answers), plus the images hidden in this session (no longer public) so they can be shown again.
 */
export const mergeMedia = (publicImages: MediaImage[], known: Map<number, Partial<MediaImage>>): MediaImage[] => {
  const ids = new Set(publicImages.map(img => img.id));
  const visible = publicImages.map(img => ({ ...img, source: known.get(img.id)?.source ?? img.source }));
  const hiddenHere: MediaImage[] = [];

  known.forEach((state, id) => {
    if (!ids.has(id) && state.hidden === true) {
      hiddenHere.push({
        id,
        position: state.position ?? null,
        mainImage: false,
        layout: state.layout === true,
        hidden: true,
        source: state.source ?? null,
      });
    }
  });

  return [...visible, ...hiddenHere].sort(byPosition);
};

/** What a PATCH answer says about the image (only the fields it carries). */
export const knownFromAdmin = (dto: AdminYachtImage): Partial<MediaImage> => {
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
export const canDelete = (img: MediaImage) => img.source !== 'PARTNER';

export const errorMessage = (error: unknown, fallback: string): string => {
  const message = (error as { message?: unknown } | null | undefined)?.message;

  return typeof message === 'string' && message.trim() ? message : fallback;
};

const idsOf = (data: unknown): number[] => {
  const list = Array.isArray(data) ? data : (data as { images?: unknown[] } | null)?.images;

  if (!Array.isArray(list)) return [];

  return list
    .map(item => (typeof item === 'number' ? item : (item as { id?: unknown } | null)?.id))
    .filter((id): id is number => typeof id === 'number' && Number.isFinite(id));
};

export interface UploadOutcome {
  /** Ids of the stored own photos (when the backend answers with them). */
  ids: number[];
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
    const outcome: UploadOutcome = { ids: [], uploaded: 0, failedFiles: 0 };
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
        outcome.ids.push(...idsOf(data));
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

  async reorderImages(yachtId: number, imageIds: number[]): Promise<void> {
    await http.put(`/admin/yachts/${yachtId}/images/order`, { imageIds });
  },

  async deleteImage(yachtId: number, imageId: number): Promise<void> {
    await http.delete(`/admin/yachts/${yachtId}/images/${imageId}`);
  },

  async setVideo(yachtId: number, videoUrl: string | null): Promise<void> {
    await http.patch(`/admin/yachts/${yachtId}/media`, { videoUrl });
  },

  async uploadCrewProfile(yachtId: number, file: File): Promise<void> {
    const form = new FormData();

    form.append('file', file, file.name);
    await http.post(`/admin/yachts/${yachtId}/crew-profile`, form, { headers: MULTIPART });
  },

  async deleteCrewProfile(yachtId: number): Promise<void> {
    await http.delete(`/admin/yachts/${yachtId}/crew-profile`);
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
