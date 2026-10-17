// Boats · Media: helpers and HTTP calls of src/services/yacht-media.api.ts, run with `yarn test`
// (node --test, Node's own type stripping: no bundler, no axios instance, a fake HTTP client).
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  MAX_IMAGE_BYTES,
  MAX_PDF_BYTES,
  applyAdminImage,
  batchFileProgress,
  canBeMain,
  canDelete,
  createYachtMediaApi,
  errorMessage,
  imageFileProblem,
  isPdfMagic,
  mergeMedia,
  moveItem,
  parseVideoUrl,
  pdfFileProblem,
  planBatches,
  publicImagesOf,
  yachtLabel,
} from '../src/services/yacht-media.api.ts';
import type { MediaImage } from '../src/services/yacht-media.api.ts';

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
  source: null,
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

  test('anything else is refused', () => {
    [
      '',
      'vimeo.com/982130882',
      'javascript:alert(1)',
      'https://vimeo.com/channels/staffpicks/982130882',
      'https://vimeo.com/abc',
      'https://www.youtube.com/watch?v=short',
      'https://www.youtube.com/shorts/dQw4w9WgXcQ',
      'https://youtube.com.evil.tld/watch?v=dQw4w9WgXcQ',
      'https://evil.tld/https://vimeo.com/982130882',
      'ftp://vimeo.com/982130882',
    ].forEach(url => assert.equal(parseVideoUrl(url), null, url));
  });
});

describe('grid state', () => {
  test('public rows: the boat own kinds only (no donor MODEL_SAMPLE, no MARINA, no id-less row)', () => {
    const images = publicImagesOf({
      id: 11769,
      slug: 'gulet-allure-11769',
      yachtImages: [
        { id: 3, position: 2, mainImage: false, kind: 'LAYOUT', layout: true },
        { id: 1, position: 0, mainImage: true, kind: 'PARTNER' },
        { id: 900, position: 1000, kind: 'MODEL_SAMPLE' },
        { id: 77, position: 2000, kind: 'MARINA' },
        { id: null, position: 5 },
        { id: 2, position: 1 },
      ],
    });

    assert.deepEqual(
      images.map(i => [i.id, i.mainImage, i.layout]),
      [
        [3, false, true],
        [1, true, false],
        [2, false, false],
      ]
    );
  });

  test('merge: origin from this session, session-hidden images kept, position order', () => {
    const known = new Map<number, Partial<MediaImage>>([
      [10, { source: 'OWN' }],
      [5, { hidden: true, position: 1, source: 'PARTNER' }],
    ]);
    const merged = mergeMedia([img(20, 2), img(10, 0)], known);

    assert.deepEqual(
      merged.map(i => [i.id, i.source, i.hidden]),
      [
        [10, 'OWN', false],
        [5, 'PARTNER', true],
        [20, null, false],
      ]
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

  test('errorMessage: backend body message, else the fallback', () => {
    assert.equal(errorMessage({ code: 1102, message: 'Invalid video URL' }, 'x'), 'Invalid video URL');
    assert.equal(errorMessage(undefined, 'Network error'), 'Network error');
    assert.equal(errorMessage({ message: '  ' }, 'fallback'), 'fallback');
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

  test('public detail by slug', async () => {
    const { http, calls } = fakeHttp([{ id: 11769, slug: 'gulet-allure-11769' }]);

    await createYachtMediaApi(http).getPublicDetail('gulet-allure-11769');
    assert.equal(calls[0].url, '/public/yachts/gulet-allure-11769');
  });

  test('54 photos: 3 sequential requests of 20 / 20 / 14 under "files", progress per file, ids collected', async () => {
    const answers = [
      Array.from({ length: 20 }, (_, i) => ({ id: 100 + i })),
      Array.from({ length: 20 }, (_, i) => ({ id: 200 + i })),
      Array.from({ length: 14 }, (_, i) => ({ id: 300 + i })),
    ];
    const { http, calls } = fakeHttp(answers);
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
    assert.equal(outcome.ids.length, 54);
    assert.ok(reports.at(-1)?.every(p => p === 1));
    assert.deepEqual(stored, [20, 40, 54]);

    calls[0].config?.onUploadProgress({ loaded: 10_000, total: 20_000 });
    assert.equal(reports.at(-1)?.[9], 1);
    assert.equal(reports.at(-1)?.[10], 0);
  });

  test('a failed batch stops the upload and counts the files not stored', async () => {
    const { http, calls } = fakeHttp([[{ id: 1 }], new Error('boom')]);
    const files = Array.from({ length: 25 }, (_, i) => file(`p${i}.jpg`, 10));
    const outcome = await createYachtMediaApi(http).uploadImages(5, files);

    assert.equal(calls.length, 2);
    assert.equal(outcome.uploaded, 20);
    assert.equal(outcome.failedFiles, 5);
    assert.ok(outcome.error instanceof Error);
  });

  test('image PATCH, order, delete, video, crew profile', async () => {
    const { http, calls } = fakeHttp([{ id: 7, yachtMainImageId: 7 }]);
    const media = createYachtMediaApi(http);

    assert.equal((await media.patchImage(7, { main: true })).yachtMainImageId, 7);
    await media.reorderImages(11769, [7, 3, 1]);
    await media.deleteImage(11769, 7);
    await media.setVideo(11769, 'https://vimeo.com/982130882');
    await media.setVideo(11769, null);
    await media.uploadCrewProfile(11769, file('crew.pdf', 10, 'application/pdf'));
    await media.deleteCrewProfile(11769);

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
