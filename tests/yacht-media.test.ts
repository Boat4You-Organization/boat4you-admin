// Boats · Media: helpers and HTTP calls of src/services/yacht-media.api.ts, run with `yarn test`
// (node --test, Node's own type stripping: no bundler, no axios instance, a fake HTTP client).
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  MAX_BATCH_BYTES,
  MAX_IMAGE_BYTES,
  MAX_PDF_BYTES,
  PROXY_TOO_LARGE,
  applyAdminImage,
  batchFileProgress,
  canBeMain,
  canDelete,
  createYachtMediaApi,
  errorMessage,
  imageFileProblem,
  isPdfMagic,
  mediaImagesOf,
  moveItem,
  parseVideoUrl,
  pdfFileProblem,
  planBatches,
  yachtLabel,
} from '../src/services/yacht-media.api.ts';
import type { AdminYachtImage, MediaImage, YachtMediaDto } from '../src/services/yacht-media.api.ts';

type Call = { method: string; url: string; data?: unknown; config?: Record<string, any> };

const fakeHttp = (answers: Array<unknown | Error> = []) => {
  const calls: Call[] = [];
  const queue = answers.slice();
  const answer = async (call: Call) => {
    calls.push(call);
    const next = queue.length ? queue.shift() : undefined;

    if (next instanceof Error) throw next;

    return { data: next };
  };
  const http = {
    get: (url: string, config?: Record<string, any>) => answer({ method: 'get', url, config }),
    delete: (url: string, config?: Record<string, any>) => answer({ method: 'delete', url, config }),
    post: (url: string, data?: unknown, config?: Record<string, any>) => answer({ method: 'post', url, data, config }),
    put: (url: string, data?: unknown, config?: Record<string, any>) => answer({ method: 'put', url, data, config }),
    patch: (url: string, data?: unknown, config?: Record<string, any>) =>
      answer({ method: 'patch', url, data, config }),
  };

  return { http: http as any, calls };
};

const file = (name: string, size: number, type = 'image/jpeg') => new File([new Uint8Array(size)], name, { type });

const img = (id: number, position: number | null, extra: Partial<MediaImage> = {}): MediaImage => ({
  id,
  position,
  mainImage: false,
  layout: false,
  hidden: false,
  source: 'PARTNER',
  ...extra,
});

/** One row of YachtMediaDto.images as the backend sends it (YachtImageAdminDto). */
const row = (id: number, position: number, extra: Partial<AdminYachtImage> = {}): AdminYachtImage => ({
  id,
  yachtId: 11769,
  position,
  mainImage: false,
  layout: false,
  layoutOverride: null,
  hidden: false,
  hiddenReason: null,
  yachtMainImageId: null,
  source: 'PARTNER',
  ...extra,
});

const mediaDto = (images: AdminYachtImage[], extra: Partial<YachtMediaDto> = {}): YachtMediaDto => ({
  yachtId: 11769,
  mainImageId: null,
  videoUrl: null,
  crewProfileUrl: null,
  images,
  ...extra,
});

describe('yachtLabel', () => {
  test('Manufacturer Model Name', () => {
    assert.equal(
      yachtLabel({ manufacturerName: 'Custom', modelName: 'Gulet 30', name: 'Allure' }),
      'Custom Gulet 30 Allure'
    );
  });

  test('model already starting with the manufacturer is not doubled; blanks are skipped', () => {
    assert.equal(yachtLabel({ manufacturerName: 'Bavaria', modelName: 'Bavaria C42', name: 'Lea' }), 'Bavaria C42 Lea');
    assert.equal(yachtLabel({ manufacturerName: null, modelName: ' ', name: 'Allure' }), 'Allure');
  });
});

describe('file checks', () => {
  test('images: JPEG / PNG / WebP up to 10 MB', () => {
    assert.equal(imageFileProblem(file('a.jpg', 10)), null);
    assert.equal(imageFileProblem(file('a.webp', 10, 'image/webp')), null);
    assert.equal(imageFileProblem(file('a.png', MAX_IMAGE_BYTES, 'image/png')), null);
    assert.match(imageFileProblem(file('a.heic', 10, 'image/heic')) ?? '', /only JPEG, PNG or WebP/);
    assert.match(imageFileProblem(file('a.jpg', MAX_IMAGE_BYTES + 1)) ?? '', /at most 10\.0 MB/);
    assert.match(imageFileProblem(file('a.jpg', 0)) ?? '', /empty/);
  });

  test('images without a MIME type fall back to the extension', () => {
    assert.equal(imageFileProblem({ name: 'IMG_1.JPG', type: '', size: 5 }), null);
    assert.notEqual(imageFileProblem({ name: 'notes.txt', type: '', size: 5 }), null);
  });

  test('crew profile: PDF up to 15 MB, magic bytes %PDF', () => {
    assert.equal(pdfFileProblem(file('crew.pdf', 100, 'application/pdf')), null);
    assert.match(pdfFileProblem(file('crew.docx', 100, 'application/msword')) ?? '', /only PDF/);
    assert.match(pdfFileProblem(file('crew.pdf', MAX_PDF_BYTES + 1, 'application/pdf')) ?? '', /at most 15\.0 MB/);
    assert.equal(isPdfMagic(new TextEncoder().encode('%PDF-1.7')), true);
    assert.equal(isPdfMagic(new TextEncoder().encode('<htm')), false);
    assert.equal(isPdfMagic(new Uint8Array([0x25, 0x50])), false);
  });
});

describe('planBatches', () => {
  test('at most 20 files per request', () => {
    const files = Array.from({ length: 54 }, (_, i) => ({ size: 1, i }));

    assert.deepEqual(
      planBatches(files).map(b => b.length),
      [20, 20, 14]
    );
  });

  test('20 MB per request: under the 25 MB nginx body limit of api.boat4you.com with room for the boundaries', () => {
    assert.equal(MAX_BATCH_BYTES, 20 * 1024 * 1024);

    // the Allure set: 54 photos, 69.2 MB (largest 2.9 MB) - 3 batches of 20 / 20 / 14 used to reach 28.5 MB
    const sizes = Array.from({ length: 54 }, (_, i) => Math.round((0.6 + (i % 10) * 0.25) * 1024 * 1024));
    const batches = planBatches(sizes.map(size => ({ size })));

    batches.forEach(batch => {
      assert.ok(batch.length <= 20);
      assert.ok(batch.reduce((sum, f) => sum + f.size, 0) <= MAX_BATCH_BYTES);
    });
    assert.equal(
      batches.reduce((n, b) => n + b.length, 0),
      54
    );
    // a single file at the 10 MB cap always fits a request
    assert.ok(MAX_IMAGE_BYTES <= MAX_BATCH_BYTES);
  });

  test('a batch closes before passing the byte cap; an oversize file goes alone', () => {
    const batches = planBatches([{ size: 30 }, { size: 20 }, { size: 5 }, { size: 100 }, { size: 1 }], 20, 40);

    assert.deepEqual(
      batches.map(b => b.map(f => f.size)),
      [[30], [20, 5], [100], [1]]
    );
    assert.deepEqual(planBatches([]), []);
  });
});

describe('batchFileProgress', () => {
  test('files fill in order', () => {
    assert.deepEqual(batchFileProgress([10, 10], 15), [1, 0.5]);
    assert.deepEqual(batchFileProgress([10, 10], 0), [0, 0]);
    assert.deepEqual(batchFileProgress([10, 10], 999), [1, 1]);
  });

  test('scaled by the multipart total (boundaries included)', () => {
    assert.deepEqual(batchFileProgress([50, 50], 55, 110), [1, 0]);
  });
});

describe('parseVideoUrl', () => {
  test('the owner link (Vimeo)', () => {
    assert.deepEqual(parseVideoUrl('https://vimeo.com/982130882'), {
      provider: 'vimeo',
      id: '982130882',
      embedUrl: 'https://player.vimeo.com/video/982130882',
    });
    assert.equal(parseVideoUrl('https://player.vimeo.com/video/982130882')?.id, '982130882');
  });

  test('YouTube watch, youtu.be and embed', () => {
    const embed = 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ';

    assert.equal(parseVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10')?.embedUrl, embed);
    assert.equal(parseVideoUrl('https://youtu.be/dQw4w9WgXcQ')?.embedUrl, embed);
    assert.equal(parseVideoUrl(' https://youtube.com/embed/dQw4w9WgXcQ ')?.embedUrl, embed);
  });

  test('an unlisted Vimeo film vimeo.com/<id>/<hash> (the backend accepts it) embeds with its hash', () => {
    assert.deepEqual(parseVideoUrl('https://vimeo.com/982130882/0a1b2c3d4e'), {
      provider: 'vimeo',
      id: '982130882',
      embedUrl: 'https://player.vimeo.com/video/982130882?h=0a1b2c3d4e',
    });
  });

  test('the backend forms with a trailing slash, an upper-case scheme or host, http', () => {
    assert.equal(parseVideoUrl('https://youtu.be/dQw4w9WgXcQ/')?.id, 'dQw4w9WgXcQ');
    assert.equal(parseVideoUrl('https://www.youtube.com/embed/dQw4w9WgXcQ/')?.id, 'dQw4w9WgXcQ');
    assert.equal(parseVideoUrl('HTTPS://Vimeo.com/982130882/')?.id, '982130882');
    assert.equal(parseVideoUrl('http://player.vimeo.com/video/982130882/')?.id, '982130882');
    assert.equal(parseVideoUrl('https://youtube.com/watch?t=10&v=dQw4w9WgXcQ#top')?.id, 'dQw4w9WgXcQ');
  });

  test('anything else is refused (what the backend VideoUrlRules answers with 400)', () => {
    [
      '',
      'vimeo.com/982130882',
      'javascript:alert(1)',
      'https://vimeo.com/channels/staffpicks/982130882',
      'https://vimeo.com/abc',
      'https://vimeo.com/982130882/not-a-hash',
      'https://www.youtube.com/watch?v=short',
      'https://www.youtube.com/watch/?v=dQw4w9WgXcQ',
      'https://www.youtube.com/watch?v=dQw4w9WgXc%51',
      'https://www.youtube.com/shorts/dQw4w9WgXcQ',
      'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://user@vimeo.com/982130882',
      'https://user:pw@www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://vimeo.com:443/982130882',
      'https://youtu.be:8443/dQw4w9WgXcQ',
      'https://vimeo.com/982130882 x',
      'https://vimeo.com/982130882#a#b',
      'https://youtube.com/watch?v=dQw4w9WgXcQ&x=|',
      'https://youtube.com.evil.tld/watch?v=dQw4w9WgXcQ',
      'https://evil.tld/https://vimeo.com/982130882',
      'ftp://vimeo.com/982130882',
      `https://vimeo.com/${'1'.repeat(520)}`,
    ].forEach(url => assert.equal(parseVideoUrl(url), null, url));
  });
});

describe('grid state', () => {
  test('the grid from the admin media: every row in order, hidden ones too, source as the backend says, MAIN = yacht.main_image_id', () => {
    const images = mediaImagesOf(
      mediaDto(
        [
          row(11, 0, { source: 'OWN' }),
          row(12, 1, { source: 'OWN', hidden: true, hiddenReason: 'ADMIN' }),
          row(3, 2, { mainImage: true }),
          row(4, 3, { layout: true }),
        ],
        { mainImageId: 11 }
      )
    );

    assert.deepEqual(
      images.map(i => [i.id, i.source, i.mainImage, i.hidden, i.layout]),
      [
        [11, 'OWN', true, false, false],
        [12, 'OWN', false, true, false],
        [3, 'PARTNER', false, false, false],
        [4, 'PARTNER', false, false, true],
      ]
    );
    assert.deepEqual(
      images.filter(canDelete).map(i => i.id),
      [11, 12]
    );
  });

  test('a PATCH answer moves the main flag to yachtMainImageId', () => {
    const next = applyAdminImage([img(1, 0, { mainImage: true }), img(2, 1)], {
      id: 2,
      hidden: false,
      layout: false,
      yachtMainImageId: 2,
    });

    assert.deepEqual(
      next.map(i => [i.id, i.mainImage]),
      [
        [1, false],
        [2, true],
      ]
    );
  });

  test('hiding an image without a main answer keeps the other flags', () => {
    const next = applyAdminImage([img(1, 0, { mainImage: true }), img(2, 1)], { id: 2, hidden: true });

    assert.deepEqual(
      next.map(i => [i.id, i.mainImage, i.hidden]),
      [
        [1, true, false],
        [2, false, true],
      ]
    );
  });

  test('moveItem, canBeMain, canDelete', () => {
    assert.deepEqual(moveItem([1, 2, 3, 4], 0, 2), [2, 3, 1, 4]);
    assert.deepEqual(moveItem([1, 2, 3], 2, 0), [3, 1, 2]);
    assert.deepEqual(moveItem([1, 2], 0, 5), [1, 2]);
    assert.equal(canBeMain(img(1, 0, { layout: true })), false);
    assert.equal(canBeMain(img(1, 0, { hidden: true })), false);
    assert.equal(canBeMain(img(1, 0)), true);
    assert.equal(canDelete(img(1, 0, { source: 'PARTNER' })), false);
    assert.equal(canDelete(img(1, 0, { source: 'OWN' })), true);
  });

  test('errorMessage: backend body message, a proxy 413 page, else the fallback', () => {
    assert.equal(errorMessage({ code: 1102, message: 'Invalid video URL' }, 'x'), 'Invalid video URL');
    assert.equal(errorMessage(undefined, 'Network error'), 'Network error');
    assert.equal(errorMessage({ message: '  ' }, 'fallback'), 'fallback');
    assert.equal(
      errorMessage('<html><head><title>413 Request Entity Too Large</title></head></html>', 'x'),
      PROXY_TOO_LARGE
    );
    assert.equal(errorMessage('<html><title>502 Bad Gateway</title></html>', 'fallback'), 'fallback');
  });
});

describe('createYachtMediaApi', () => {
  test('lookup: GET /admin/yachts/lookup with q and limit', async () => {
    const { http, calls } = fakeHttp([[{ id: 11769, name: 'Allure' }]]);
    const result = await createYachtMediaApi(http).lookup(' allure ');

    assert.equal(result[0].id, 11769);
    assert.deepEqual(calls[0], {
      method: 'get',
      url: '/admin/yachts/lookup',
      config: { params: { q: 'allure', limit: 20 } },
    });
  });

  test('admin media by id; public detail by slug (twin check only)', async () => {
    const { http, calls } = fakeHttp([mediaDto([]), { id: 11769, slug: 'gulet-allure-11769' }]);
    const media = createYachtMediaApi(http);

    assert.equal((await media.getMedia(11769)).yachtId, 11769);
    await media.getPublicDetail('gulet-allure-11769');
    assert.deepEqual(
      calls.map(c => [c.method, c.url]),
      [
        ['get', '/admin/yachts/11769/media'],
        ['get', '/public/yachts/gulet-allure-11769'],
      ]
    );
  });

  test('54 photos: 3 sequential requests of 20 / 20 / 14 under "files", progress per file, the last media answer kept', async () => {
    // each batch answers the boat's whole media (YachtMediaDto): the partner rows stay PARTNER, only uploads are OWN
    const partner = [row(1, 0, { mainImage: true }), row(2, 1, { layout: true }), row(3, 2)];
    const own = (n: number) => Array.from({ length: n }, (_, i) => row(100 + i, i, { source: 'OWN' }));
    const after = (n: number) =>
      mediaDto([...own(n), ...partner.map((r, i) => ({ ...r, position: n + i }))], { mainImageId: 1 });
    const { http, calls } = fakeHttp([after(20), after(40), after(54)]);
    const files = Array.from({ length: 54 }, (_, i) => file(`allure-${i}.jpg`, 1000));
    const reports: number[][] = [];
    const stored: number[] = [];
    const outcome = await createYachtMediaApi(http).uploadImages(11769, files, (p, n) => {
      reports.push(p);
      stored.push(n);
    });

    assert.equal(calls.length, 3);
    calls.forEach(c => {
      assert.equal(c.method, 'post');
      assert.equal(c.url, '/admin/yachts/11769/images');
      assert.equal(c.config?.headers['Content-Type'], 'multipart/form-data');
    });
    assert.deepEqual(
      calls.map(c => (c.data as FormData).getAll('files').length),
      [20, 20, 14]
    );
    assert.equal(((calls[2].data as FormData).getAll('files')[0] as File).name, 'allure-40.jpg');
    assert.equal(outcome.uploaded, 54);
    assert.equal(outcome.failedFiles, 0);
    assert.equal(outcome.media?.images.length, 57);

    const grid = mediaImagesOf(outcome.media as YachtMediaDto);

    assert.equal(grid.filter(i => i.source === 'OWN').length, 54);
    assert.deepEqual(
      grid.filter(i => i.source === 'PARTNER').map(i => [i.id, i.mainImage, i.layout]),
      [
        [1, true, false],
        [2, false, true],
        [3, false, false],
      ]
    );
    assert.deepEqual(
      grid.slice(0, 2).map(i => i.id),
      [100, 101]
    );
    assert.ok(reports.at(-1)?.every(p => p === 1));
    assert.deepEqual(stored, [20, 40, 54]);

    calls[0].config?.onUploadProgress({ loaded: 10_000, total: 20_000 });
    assert.equal(reports.at(-1)?.[9], 1);
    assert.equal(reports.at(-1)?.[10], 0);
  });

  test('a failed batch stops the upload, counts the files not stored and keeps the media of the stored batch', async () => {
    const stored = mediaDto([row(1, 0, { source: 'OWN' })]);
    const { http, calls } = fakeHttp([stored, new Error('boom')]);
    const files = Array.from({ length: 25 }, (_, i) => file(`p${i}.jpg`, 10));
    const outcome = await createYachtMediaApi(http).uploadImages(5, files);

    assert.equal(calls.length, 2);
    assert.equal(outcome.uploaded, 20);
    assert.equal(outcome.failedFiles, 5);
    assert.ok(outcome.error instanceof Error);
    assert.equal(outcome.media, stored);
  });

  test('nothing stored: no media; an answer that is not YachtMediaDto is not taken for one', async () => {
    const failed = await createYachtMediaApi(fakeHttp([new Error('413')]).http).uploadImages(5, [file('a.jpg', 10)]);
    const odd = await createYachtMediaApi(fakeHttp([[{ id: 1 }]]).http).uploadImages(5, [file('a.jpg', 10)]);

    assert.equal(failed.media, undefined);
    assert.equal(failed.uploaded, 0);
    assert.equal(odd.media, undefined);
    assert.equal(odd.uploaded, 1);
  });

  test('image PATCH, order, delete, video, crew profile: each media call answers the boat media', async () => {
    const answer = mediaDto([row(7, 0, { source: 'OWN' })], {
      mainImageId: 7,
      videoUrl: 'https://vimeo.com/982130882',
    });
    const { http, calls } = fakeHttp([{ id: 7, yachtMainImageId: 7 }, answer, answer, answer, answer, answer, answer]);
    const media = createYachtMediaApi(http);

    assert.equal((await media.patchImage(7, { main: true })).yachtMainImageId, 7);
    assert.equal(await media.reorderImages(11769, [7, 3, 1]), answer);
    assert.equal(await media.deleteImage(11769, 7), answer);
    assert.equal((await media.setVideo(11769, 'https://vimeo.com/982130882')).videoUrl, 'https://vimeo.com/982130882');
    assert.equal(await media.setVideo(11769, null), answer);
    assert.equal(await media.uploadCrewProfile(11769, file('crew.pdf', 10, 'application/pdf')), answer);
    assert.equal(await media.deleteCrewProfile(11769), answer);

    assert.deepEqual(
      calls.map(c => [c.method, c.url]),
      [
        ['patch', '/admin/yacht-images/7'],
        ['put', '/admin/yachts/11769/images/order'],
        ['delete', '/admin/yachts/11769/images/7'],
        ['patch', '/admin/yachts/11769/media'],
        ['patch', '/admin/yachts/11769/media'],
        ['post', '/admin/yachts/11769/crew-profile'],
        ['delete', '/admin/yachts/11769/crew-profile'],
      ]
    );
    assert.deepEqual(calls[0].data, { main: true });
    assert.deepEqual(calls[1].data, { imageIds: [7, 3, 1] });
    assert.deepEqual(calls[3].data, { videoUrl: 'https://vimeo.com/982130882' });
    assert.deepEqual(calls[4].data, { videoUrl: null });
    assert.equal(((calls[5].data as FormData).get('file') as File).name, 'crew.pdf');
    assert.equal(calls[5].config?.headers['Content-Type'], 'multipart/form-data');
  });

  test('image hygiene: dry runs as query params, layout apply sends the reviewed ids in the form body', async () => {
    const { http, calls } = fakeHttp([{}, {}, {}, {}]);
    const media = createYachtMediaApi(http);

    await media.detectBlocked(true);
    await media.fixLayoutMains(false);
    await media.detectLayout({ dryRun: true, onlyMain: false, afterId: 500, limit: 200 });
    await media.detectLayout({ dryRun: false, onlyMain: false, imageIds: [11, 12] });

    assert.deepEqual(
      calls.map(c => [c.url, c.data, c.config?.params]),
      [
        ['/admin/yachts/images/detect-blocked', undefined, { dryRun: true }],
        ['/admin/yachts/main-image/fix-layout', undefined, { dryRun: false }],
        ['/admin/yachts/images/detect-layout', undefined, { dryRun: true, onlyMain: false, afterId: 500, limit: 200 }],
        [
          '/admin/yachts/images/detect-layout',
          'imageIds=11,12',
          { dryRun: false, onlyMain: false, afterId: 0, limit: 200 },
        ],
      ]
    );
    assert.equal(calls[3].config?.headers['Content-Type'], 'application/x-www-form-urlencoded');
  });
});
