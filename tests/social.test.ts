// Objave (Social publisher S0): per-network rules, character counting, composer checks and the calendar grid.
// Run with `yarn test` (node --test, type stripping).
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { addMonths, dayKey, gridRange, groupByDay, monthGrid } from '../src/utils/social/calendar.ts';
import {
  EMPTY_DRAFT,
  PLATFORMS,
  PLATFORM_RULES,
  buildRequest,
  canCancel,
  canDelete,
  canRetry,
  countChars,
  countFor,
  draftFromPost,
  hashtagsOf,
  isEditable,
  isHttpUrl,
  mediaFileProblem,
  mediaTypeOf,
  parseLocal,
  suggestedSlot,
  toLocalInput,
  validateDraft,
  validateTarget,
} from '../src/utils/social/rules.ts';

const IMG = { kind: 'IMAGE' as const };
const VID = { kind: 'VIDEO' as const };
const codes = (list: { code: string }[]) => list.map(i => i.code);

describe('platform rules', () => {
  test('every platform has rules and a place in the UI order', () => {
    assert.equal(PLATFORMS.length, Object.keys(PLATFORM_RULES).length);
    PLATFORMS.forEach(p => assert.equal(PLATFORM_RULES[p].platform, p));
  });
});

describe('countChars', () => {
  test('code points, so an emoji is one character', () => {
    assert.equal(countChars('Kornati ⛵', 'codepoints'), 9);
    assert.equal(countChars('😀😀', 'codepoints'), 2);
  });

  test('X: a link is 23, an emoji is 2, Croatian letters are 1', () => {
    assert.equal(countChars('https://www.boat4you.com/en/boat/gulet-allure-11769', 'x-weighted'), 23);
    assert.equal(countChars('čćžšđ', 'x-weighted'), 5);
    assert.equal(countChars('😀', 'x-weighted'), 2);
    assert.equal(countChars('see https://x.co', 'x-weighted'), 4 + 23);
  });

  test('Bluesky counts graphemes: a family emoji is one', () => {
    assert.equal(countChars('👨‍👩‍👧', 'graphemes'), 1);
    assert.equal(countFor('BLUESKY', 'abc'), 3);
  });

  test('hashtags, Croatian letters included', () => {
    assert.deepEqual(hashtagsOf('#sailing u #Hrvatska i #čarter_2027, ne#ovo'), [
      '#sailing',
      '#Hrvatska',
      '#čarter_2027',
    ]);
  });
});

describe('validateTarget', () => {
  test('X: 281 characters is too long, 280 is fine', () => {
    assert.deepEqual(codes(validateTarget('X', 'a'.repeat(280), '', [])), []);
    const issues = validateTarget('X', 'a'.repeat(281), '', []);

    assert.deepEqual(codes(issues), ['tooLong']);
    assert.equal(issues[0].count, 281);
    assert.equal(issues[0].max, 280);
  });

  test('Instagram needs a photo or video and has no clickable links', () => {
    assert.deepEqual(codes(validateTarget('INSTAGRAM', 'Hi', '', [])), ['mediaRequired']);
    assert.deepEqual(codes(validateTarget('INSTAGRAM', 'Hi', '', [IMG])), []);
    const link = validateTarget('INSTAGRAM', 'Book at https://www.boat4you.com', '', [IMG]);

    assert.deepEqual(codes(link), ['linkNotClickable']);
    assert.equal(link[0].level, 'warning');
  });

  test('Instagram: at most 30 hashtags and 10 media, mixing is fine', () => {
    const tags = Array.from({ length: 31 }, (_, i) => `#t${i}`).join(' ');

    assert.deepEqual(codes(validateTarget('INSTAGRAM', tags, '', [IMG])), ['tooManyHashtags']);
    assert.deepEqual(codes(validateTarget('INSTAGRAM', 'x', '', [IMG, VID])), []);
    assert.deepEqual(
      codes(
        validateTarget(
          'INSTAGRAM',
          'x',
          '',
          Array.from({ length: 11 }, () => IMG)
        )
      ),
      ['tooManyImages']
    );
  });

  test('Instagram photos between 4:5 and 1.91:1; size unknown is not judged', () => {
    const photo = (width: number, height: number) => ({ kind: 'IMAGE' as const, width, height });

    assert.deepEqual(codes(validateTarget('INSTAGRAM', 'x', '', [photo(1080, 1350)])), []);
    assert.deepEqual(codes(validateTarget('INSTAGRAM', 'x', '', [photo(1910, 1000)])), []);
    assert.deepEqual(codes(validateTarget('INSTAGRAM', 'x', '', [photo(1080, 1920)])), ['aspectRatio']);
    assert.deepEqual(codes(validateTarget('INSTAGRAM', 'x', '', [photo(3000, 1000)])), ['aspectRatio']);
    assert.deepEqual(codes(validateTarget('INSTAGRAM', 'x', '', [IMG])), []);
    assert.deepEqual(codes(validateTarget('FACEBOOK', 'x', '', [photo(1080, 1920)])), []);
  });

  test('YouTube needs a video and a title, and refuses < >', () => {
    assert.deepEqual(codes(validateTarget('YOUTUBE', 'desc', '', [])), ['videoRequired', 'titleRequired']);
    assert.deepEqual(codes(validateTarget('YOUTUBE', 'desc', 'Allure', [IMG])), [
      'videoRequired',
      'imagesNotSupported',
    ]);
    assert.deepEqual(codes(validateTarget('YOUTUBE', 'desc', 'Allure', [VID])), []);
    assert.deepEqual(codes(validateTarget('YOUTUBE', 'a <b>', 'Allure', [VID])), ['angleBrackets']);
    assert.deepEqual(codes(validateTarget('YOUTUBE', 'd', 'x'.repeat(101), [VID])), ['titleTooLong']);
  });

  test('X, LinkedIn, Bluesky and TikTok do not mix photos and a video', () => {
    for (const p of ['X', 'LINKEDIN', 'BLUESKY', 'TIKTOK'] as const) {
      assert.ok(codes(validateTarget(p, 'x', '', [IMG, VID])).includes('mixedMedia'), p);
    }
  });

  test('X takes 4 photos, not 5', () => {
    assert.deepEqual(codes(validateTarget('X', 'x', '', [IMG, IMG, IMG, IMG])), []);
    assert.deepEqual(codes(validateTarget('X', 'x', '', [IMG, IMG, IMG, IMG, IMG])), ['tooManyImages']);
  });

  test('Google Business: one photo, no video', () => {
    assert.deepEqual(codes(validateTarget('GOOGLE_BUSINESS', 'x', '', [VID])), ['videoNotSupported']);
    assert.deepEqual(codes(validateTarget('GOOGLE_BUSINESS', 'x', '', [IMG, IMG])), ['tooManyImages']);
  });

  test('nothing at all is empty; text-only is fine where the network allows it', () => {
    assert.deepEqual(codes(validateTarget('FACEBOOK', '   ', '', [])), ['empty']);
    for (const p of ['FACEBOOK', 'THREADS', 'LINKEDIN', 'X', 'BLUESKY', 'GOOGLE_BUSINESS'] as const) {
      assert.deepEqual(codes(validateTarget(p, 'Dobro jutro iz Splita', '', [])), [], p);
    }
  });
});

const target = (accountId: number, platform: 'X' | 'FACEBOOK' | 'INSTAGRAM', customText: string | null = null) => ({
  accountId,
  platform,
  accountName: `acc ${accountId}`,
  customText,
  title: '',
});

describe('validateDraft', () => {
  const now = new Date(2026, 10, 3, 10, 0);

  test('publishing needs a channel; a draft does not', () => {
    const draft = { ...EMPTY_DRAFT, text: 'Hello' };

    assert.deepEqual(codes(validateDraft(draft, 'PUBLISH_NOW', now).post), ['noTargets']);
    assert.equal(validateDraft(draft, 'DRAFT', now).ok, true);
  });

  test('an empty draft is not saved', () => {
    assert.equal(validateDraft(EMPTY_DRAFT, 'DRAFT', now).ok, false);
  });

  test('a channel error blocks publishing but not saving a draft', () => {
    const draft = { ...EMPTY_DRAFT, text: 'a'.repeat(300), targets: [target(1, 'X'), target(2, 'FACEBOOK')] };
    const pub = validateDraft(draft, 'PUBLISH_NOW', now);

    assert.equal(pub.ok, false);
    assert.deepEqual(codes(pub.targets[1]), ['tooLong']);
    assert.deepEqual(codes(pub.targets[2]), []);
    assert.equal(validateDraft(draft, 'DRAFT', now).ok, true);
  });

  test('the channel own text is what gets checked', () => {
    const draft = { ...EMPTY_DRAFT, text: 'a'.repeat(300), targets: [target(1, 'X', 'Short one for X')] };

    assert.equal(validateDraft(draft, 'PUBLISH_NOW', now).ok, true);
  });

  test('schedule: required, a real date, at least 2 minutes ahead', () => {
    const base = { ...EMPTY_DRAFT, text: 'x', targets: [target(1, 'FACEBOOK')] };

    assert.deepEqual(codes(validateDraft(base, 'SCHEDULE', now).post), ['scheduleMissing']);
    assert.deepEqual(codes(validateDraft({ ...base, scheduledLocal: '2026-02-31T10:00' }, 'SCHEDULE', now).post), [
      'scheduleInvalid',
    ]);
    assert.deepEqual(codes(validateDraft({ ...base, scheduledLocal: '2026-11-03T10:01' }, 'SCHEDULE', now).post), [
      'scheduleInPast',
    ]);
    assert.equal(validateDraft({ ...base, scheduledLocal: '2026-11-04T09:00' }, 'SCHEDULE', now).ok, true);
  });

  test('the link must be http(s) without credentials', () => {
    const base = { ...EMPTY_DRAFT, text: 'x', targets: [target(1, 'FACEBOOK')] };

    assert.deepEqual(codes(validateDraft({ ...base, link: 'javascript:alert(1)' }, 'PUBLISH_NOW', now).post), [
      'linkInvalid',
    ]);
    assert.equal(isHttpUrl('https://www.boat4you.com/en'), true);
    assert.equal(isHttpUrl('https://u:p@boat4you.com'), false);
    assert.equal(isHttpUrl('ftp://boat4you.com'), false);
  });
});

describe('buildRequest', () => {
  test('trims, drops an override equal to the main text, sends the schedule as UTC ISO', () => {
    const draft = {
      ...EMPTY_DRAFT,
      text: ' Kornati this weekend ',
      link: ' https://www.boat4you.com ',
      media: [{ id: 7, kind: 'IMAGE' as const }],
      targets: [target(1, 'X', 'Kornati this weekend'), { ...target(2, 'INSTAGRAM', ' IG text '), title: ' ' }],
      scheduledLocal: '2026-11-04T09:00',
      note: ' daily ',
    };
    const req = buildRequest(draft, 'SCHEDULE');

    assert.equal(req.text, 'Kornati this weekend');
    assert.equal(req.link, 'https://www.boat4you.com');
    assert.deepEqual(req.mediaIds, [7]);
    assert.deepEqual(req.targets, [
      { accountId: 1, text: null, title: null },
      { accountId: 2, text: 'IG text', title: null },
    ]);
    assert.equal(req.scheduledAt, new Date(2026, 10, 4, 9, 0).toISOString());
    assert.equal(req.note, 'daily');
    assert.equal(buildRequest(draft, 'PUBLISH_NOW').scheduledAt, null);
  });
});

describe('schedule helpers', () => {
  test('parseLocal / toLocalInput round trip', () => {
    const d = parseLocal('2026-11-04T09:05');

    assert.ok(d);
    assert.equal(toLocalInput(d), '2026-11-04T09:05');
    assert.equal(parseLocal('2026-11-04 09:05'), null);
  });

  test('suggested slot: next full hour at least 30 minutes away', () => {
    assert.equal(suggestedSlot(new Date(2026, 10, 3, 10, 0)), '2026-11-03T11:00');
    assert.equal(suggestedSlot(new Date(2026, 10, 3, 10, 29)), '2026-11-03T11:00');
    assert.equal(suggestedSlot(new Date(2026, 10, 3, 10, 31)), '2026-11-03T12:00');
    assert.equal(suggestedSlot(new Date(2026, 10, 3, 23, 45)), '2026-11-04T01:00');
  });
});

const post = (over: Record<string, unknown> = {}) => ({
  id: 1,
  text: 'Main',
  link: null,
  media: [],
  status: 'SCHEDULED' as const,
  scheduledAt: new Date(2026, 10, 4, 9, 0).toISOString(),
  publishedAt: null,
  createdAt: new Date(2026, 10, 3, 8, 0).toISOString(),
  updatedAt: new Date(2026, 10, 3, 8, 0).toISOString(),
  createdBy: 'Mario',
  source: 'ADMIN' as const,
  note: 'n',
  targets: [
    {
      id: 11,
      accountId: 1,
      platform: 'X' as const,
      accountName: 'Boat4You',
      text: 'For X',
      title: null,
      status: 'SCHEDULED' as const,
      publishedAt: null,
      externalUrl: null,
      error: null,
      attempts: 0,
    },
  ],
  ...over,
});

describe('post helpers', () => {
  test('draftFromPost keeps the schedule for edit, drops it for a copy', () => {
    const edit = draftFromPost(post());

    assert.equal(edit.scheduledLocal, '2026-11-04T09:00');
    assert.equal(edit.targets[0].customText, 'For X');
    assert.equal(edit.note, 'n');
    const copy = draftFromPost(post(), true);

    assert.equal(copy.scheduledLocal, '');
    assert.equal(copy.note, '');
  });

  test('edit / cancel / retry by status', () => {
    assert.equal(isEditable({ status: 'DRAFT' }), true);
    assert.equal(isEditable({ status: 'PUBLISHED' }), false);
    assert.equal(canCancel({ status: 'SCHEDULED' }), true);
    assert.equal(canCancel({ status: 'DRAFT' }), false);
    assert.equal(canDelete({ status: 'FAILED' }), true);
    assert.equal(canDelete({ status: 'PARTIAL' }), false);
    assert.equal(canDelete({ status: 'PUBLISHED' }), false);
    const failed = post({ status: 'PARTIAL' });

    failed.targets[0].status = 'FAILED' as never;
    assert.equal(canRetry(failed), true);
    assert.equal(canRetry(post()), false);
  });
});

describe('calendar', () => {
  test('November 2026 starts on a Sunday: the grid starts Monday 26 October', () => {
    const grid = monthGrid(2026, 10);

    assert.equal(grid.length, 6);
    assert.equal(grid[0].length, 7);
    assert.equal(grid[0][0].key, '2026-10-26');
    assert.equal(grid[0][0].inMonth, false);
    assert.equal(grid[0][6].key, '2026-11-01');
    assert.equal(grid[0][6].inMonth, true);
    assert.equal(grid[5][6].key, '2026-12-06');
  });

  test('gridRange covers the whole grid, end exclusive', () => {
    const { from, to } = gridRange(2026, 10);

    assert.equal(from, new Date(2026, 9, 26).toISOString());
    assert.equal(to, new Date(2026, 11, 7).toISOString());
  });

  test('groupByDay sorts within a day and uses schedule, then publish, then create time', () => {
    const a = {
      scheduledAt: new Date(2026, 10, 4, 18, 0).toISOString(),
      publishedAt: null,
      createdAt: '2026-01-01T00:00:00Z',
    };
    const b = {
      scheduledAt: new Date(2026, 10, 4, 9, 0).toISOString(),
      publishedAt: null,
      createdAt: '2026-01-01T00:00:00Z',
    };
    const c = {
      scheduledAt: null,
      publishedAt: new Date(2026, 10, 5, 7, 0).toISOString(),
      createdAt: '2026-01-01T00:00:00Z',
    };
    const map = groupByDay([a, c, b]);

    assert.deepEqual(map.get('2026-11-04'), [b, a]);
    assert.deepEqual(map.get('2026-11-05'), [c]);
    assert.equal(dayKey(new Date(2026, 0, 5)), '2026-01-05');
  });

  test('addMonths crosses years', () => {
    assert.deepEqual(addMonths(2026, 11, 1), { year: 2027, month0: 0 });
    assert.deepEqual(addMonths(2026, 0, -1), { year: 2025, month0: 11 });
  });
});

describe('mediaFileProblem', () => {
  const MB = 1024 * 1024;

  test('JPEG/PNG/WebP up to 20 MB, MP4/MOV up to 500 MB', () => {
    assert.equal(mediaFileProblem({ name: 'a.jpg', type: 'image/jpeg', size: 5 * MB }), null);
    assert.equal(mediaFileProblem({ name: 'a.png', type: 'image/png', size: 21 * MB }), 'imageTooLarge');
    assert.equal(mediaFileProblem({ name: 'a.mp4', type: 'video/mp4', size: 400 * MB }), null);
    assert.equal(mediaFileProblem({ name: 'a.mov', type: 'video/quicktime', size: 501 * MB }), 'videoTooLarge');
  });

  test('HEIC, GIF and PDF are refused; a missing type falls back to the extension', () => {
    assert.equal(mediaFileProblem({ name: 'a.heic', type: 'image/heic', size: MB }), 'type');
    assert.equal(mediaFileProblem({ name: 'a.gif', type: 'image/gif', size: MB }), 'type');
    assert.equal(mediaFileProblem({ name: 'a.pdf', type: 'application/pdf', size: MB }), 'type');
    assert.equal(mediaFileProblem({ name: 'IMG_1.JPG', type: '', size: MB }), null);
    assert.equal(mediaTypeOf({ name: 'clip.MOV', type: '' }), 'video/quicktime');
  });
});
