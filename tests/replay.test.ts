// Session replay helpers (P6 R2): the stylesheets of a recording, the link handler of the player, idle skipping and the
// timeline. Run with `yarn test` (node --test, type stripping).
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  createSeekQueue,
  eventsBetween,
  formatClock,
  lazyWithReload,
  loadErrorKind,
  makeUseproxy,
  markerLeft,
  rewriteDomUrls,
  skipIdle,
  stylesheetPaths,
} from '../src/utils/contactCenter/replay.ts';

describe('stylesheetPaths', () => {
  test('a real recording line names its stylesheet under chunks with the deploy query; other hosts are left out', () => {
    const line =
      '{"e":["0.8.73",1],"a":[[1,8,"rel=stylesheet","href=/_next/static/chunks/2f8oz9_lbyyt8.css?dpl=98d38a672995-mvqab1tm",' +
      '"href=https://www.boat4you.com/_next/static/css/b2.css","href=https://evil.example/_next/static/chunks/e.css"]]}';
    assert.deepEqual(stylesheetPaths([line, line], 'www.boat4you.com'), [
      '/_next/static/chunks/2f8oz9_lbyyt8.css',
      '/_next/static/css/b2.css',
    ]);
  });
});

describe('makeUseproxy', () => {
  const page = 'https://www.boat4you.com/boat/lagoon-42?startDate=2027-07-03';
  const assets = { '/_next/static/chunks/x1.css': '/replay-assets/www.boat4you.com/abc.css' };
  const proxy = makeUseproxy(page, assets, 'https://admin.boat4you.com');

  test('an archived stylesheet of the recorded site goes to its archived copy, with or without the deploy query', () => {
    assert.equal(proxy('/_next/static/chunks/x1.css?dpl=1'), '/replay-assets/www.boat4you.com/abc.css');
    assert.equal(
      proxy('https://www.boat4you.com/_next/static/chunks/x1.css'),
      '/replay-assets/www.boat4you.com/abc.css'
    );
  });

  test('a link the visualizer resolved against the admin page is re-based onto the recorded page', () => {
    assert.equal(
      proxy('https://admin.boat4you.com/_next/static/chunks/x1.css'),
      '/replay-assets/www.boat4you.com/abc.css'
    );
    assert.equal(proxy('https://admin.boat4you.com/images/a.png'), 'https://www.boat4you.com/images/a.png');
  });

  test('other links of the recorded site go to the live site; other hosts, data: and archived paths are unchanged', () => {
    assert.equal(proxy('/images/a.png'), 'https://www.boat4you.com/images/a.png');
    assert.equal(proxy('https://cdn.example.com/x.jpg'), 'https://cdn.example.com/x.jpg');
    assert.equal(proxy('data:image/png;base64,AAAA'), 'data:image/png;base64,AAAA');
    assert.equal(proxy('/replay-assets/www.boat4you.com/abc.css'), '/replay-assets/www.boat4you.com/abc.css');
  });
});

describe('skipIdle', () => {
  const times = [0, 1000, 2000, 30_000, 31_000];

  test('inside a gap of more than 5 s the clock jumps to 1 s before the next event', () => {
    assert.equal(skipIdle(3000, times), 29_000);
    assert.equal(skipIdle(29_500, times), 29_500);
  });

  test('a short gap, the very end and the time before the first event are left alone', () => {
    assert.equal(skipIdle(1500, times), 1500);
    assert.equal(skipIdle(40_000, times), 40_000);
    assert.equal(skipIdle(500, [1000, 60_000]), 500);
  });
});

describe('eventsBetween', () => {
  test('the events after from and up to to, in order', () => {
    const events = [{ time: 0 }, { time: 10 }, { time: 20 }, { time: 20 }, { time: 30 }];
    assert.deepEqual(
      eventsBetween(events, 10, 20).map(e => e.time),
      [20, 20]
    );
    assert.deepEqual(
      eventsBetween(events, -1, 0).map(e => e.time),
      [0]
    );
    assert.deepEqual(eventsBetween(events, 30, 99), []);
  });
});

describe('timeline', () => {
  test('clock and marker positions', () => {
    assert.equal(formatClock(0), '0:00');
    assert.equal(formatClock(61_000), '1:01');
    assert.equal(formatClock(3_600_000), '60:00');
    assert.equal(markerLeft(500, 2000), 25);
    assert.equal(markerLeft(5000, 2000), 100);
    assert.equal(markerLeft(10, 0), 0);
  });
});

describe('rewriteDomUrls', () => {
  test('srcset candidates and url() in style attributes of the recorded DOM go through the link handler', () => {
    const proxy = makeUseproxy('https://www.boat4you.com/boat/x', {}, 'https://admin.boat4you.com');
    const data = [
      {
        id: 1,
        tag: 'IMG',
        attributes: {
          srcset: '/_next/image?url=%2Fa.jpg&w=640 640w, /_next/image?url=%2Fa.jpg&w=1080 1080w',
          src: '/x.jpg',
        },
      },
      { id: 2, tag: 'DIV', attributes: { style: "background-image:url('/images/hero.jpg');color:red" } },
      { id: 3, tag: 'SOURCE', attributes: { srcset: 'https://cdn.example.com/a.webp 1x' } },
      { id: 4, tag: 'P' },
    ];
    const decoded = [{ dom: [{ time: 0, event: 5, data }] }, {}];

    rewriteDomUrls(decoded, proxy);
    assert.equal(
      data[0].attributes!.srcset,
      'https://www.boat4you.com/_next/image?url=%2Fa.jpg&w=640 640w, https://www.boat4you.com/_next/image?url=%2Fa.jpg&w=1080 1080w'
    );
    assert.equal(data[0].attributes!.src, '/x.jpg');
    assert.equal(
      data[1].attributes!.style,
      "background-image:url('https://www.boat4you.com/images/hero.jpg');color:red"
    );
    assert.equal(data[2].attributes!.srcset, 'https://cdn.example.com/a.webp 1x');
  });
});

describe('loadErrorKind', () => {
  test('the API body says what failed: not_found is gone, busy is busy, the raw call carries it as text', () => {
    assert.equal(loadErrorKind({ error: 'not_found' }), 'gone');
    assert.equal(loadErrorKind('{"error":"busy"}'), 'busy');
    assert.equal(loadErrorKind({ error: 'site' }), 'failed');
    assert.equal(loadErrorKind(new Error('network')), 'failed');
    assert.equal(loadErrorKind('<html>'), 'failed');
    assert.equal(loadErrorKind(undefined), 'failed');
  });
});

describe('createSeekQueue', () => {
  test('while a seek runs only the latest target waits, and a failed seek never stops the next one', async () => {
    const ran: number[] = [];
    let release = () => {};
    const q = createSeekQueue(async t => {
      ran.push(t);
      if (t === 1) await new Promise<void>(r => (release = r));
      if (t === 3) throw new Error('setup failed');
    });

    q.seek(1);
    q.seek(2);
    q.seek(3);
    q.seek(4);
    release();
    await q.idle();
    assert.deepEqual(ran, [1, 4]);
    q.seek(3);
    await q.idle();
    q.seek(5);
    await q.idle();
    assert.deepEqual(ran, [1, 4, 3, 5]);
  });
});

describe('lazyWithReload', () => {
  test('a chunk gone after a deploy reloads the page instead of failing; a good one loads', async () => {
    let reloaded = 0;
    const gone = lazyWithReload(
      () => Promise.reject(new Error('Failed to fetch dynamically imported module')),
      () => {
        reloaded += 1;
      }
    );
    const result = await Promise.race([gone(), new Promise(r => setTimeout(() => r('pending'), 20))]);

    assert.equal(result, 'pending');
    assert.equal(reloaded, 1);
    const ok = lazyWithReload(
      () => Promise.resolve({ default: 7 }),
      () => {
        reloaded += 1;
      }
    );

    assert.deepEqual(await ok(), { default: 7 });
    assert.equal(reloaded, 1);
  });
});
