// Contact Center (P2): safe links, display names and the poller, run with `yarn test` (node --test, type stripping).
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { displayName, formatDuration } from '../src/utils/contactCenter/display.ts';
import { createPoller } from '../src/utils/contactCenter/poller.ts';
import { safeHref } from '../src/utils/contactCenter/safeLink.ts';

describe('safeHref', () => {
  test('a path on the conversation site becomes a link on its www host', () => {
    assert.equal(safeHref('catamaran-greece', '/hr/boat/x'), 'https://www.catamaran-charter-greece.com/hr/boat/x');
    assert.equal(safeHref('boat4you', '/en/yachts?x=1#a'), 'https://www.boat4you.com/en/yachts?x=1#a');
  });

  test('anything that could leave the site is no link', () => {
    for (const bad of ['//evil.tld/x', '/\\evil', 'https://evil.tld/', 'javascript:alert(1)', '/a b', '', 'http://www.boat4you.com/x']) {
      assert.equal(safeHref('boat4you', bad), null, bad);
    }
    assert.equal(safeHref('boat4you', null), null);
    assert.equal(safeHref('boat4you', 'https://user:pw@www.boat4you.com/x'), null);
    assert.equal(safeHref('boat4you', 'https://www.boat4you.com.evil.tld/x'), null);
    assert.equal(safeHref('boat4you', '/..//evil.tld'), null);
    assert.equal(safeHref('boat4you', 'https://www.boat4you.com//evil.tld'), null);
  });

  test('a full URL of the same host stays, another site of ours is no link here', () => {
    assert.equal(safeHref('europe-yachts', 'https://www.europe-yachts.com/en/x'), 'https://www.europe-yachts.com/en/x');
    assert.equal(safeHref('boat4you', 'https://www.europe-yachts.com/en/x'), null);
  });

  test('an unknown site gives no link', () => {
    assert.equal(safeHref('evil', '/x'), null);
  });
});

describe('displayName', () => {
  test('name, then email, then #id', () => {
    assert.equal(displayName({ id: 12, visitorName: ' Ana ', visitorEmail: 'a@x.com' }), 'Ana');
    assert.equal(displayName({ id: 12, visitorName: ' ', visitorEmail: 'a@x.com' }), 'a@x.com');
    assert.equal(displayName({ id: 12, visitorName: null, visitorEmail: null }), '#12');
  });

  test('durations', () => {
    assert.equal(formatDuration(null), '—');
    assert.equal(formatDuration(45), '45 s');
    assert.equal(formatDuration(720), '12 min');
    assert.equal(formatDuration(3 * 3600 + 300), '3 h 5 min');
  });
});

const fakeTimers = (visible = { value: true }) => {
  const timers: Array<{ cb: () => void; cancelled: boolean }> = [];

  return {
    timers,
    visible,
    deps: {
      isVisible: () => visible.value,
      setTimer: (cb: () => void) => {
        const t = { cb, cancelled: false };

        timers.push(t);

        return t;
      },
      clearTimer: (t: unknown) => {
        (t as { cancelled: boolean }).cancelled = true;
      },
    },
    /** Fires the pending timer, if any. */
    fire: () => {
      const t = timers.filter(x => !x.cancelled).pop();

      if (t) {
        t.cancelled = true;
        t.cb();
      }
    },
    pending: () => timers.filter(x => !x.cancelled).length,
  };
};

const flush = () => new Promise(resolve => setImmediate(resolve));

describe('createPoller', () => {
  test('runs now, then on each timer, never while the previous call runs', async () => {
    const t = fakeTimers();
    let calls = 0;
    let release: () => void = () => {};
    const poller = createPoller(
      () => {
        calls += 1;

        return new Promise<void>(resolve => {
          release = resolve;
        });
      },
      5000,
      t.deps,
    );

    poller.start();
    assert.equal(calls, 1);
    poller.poke();
    await flush();
    assert.equal(calls, 1, 'no second call while the first is in flight');
    release();
    await flush();
    assert.equal(calls, 2, 'the poke runs right after the first call');
    release();
    await flush();
    assert.equal(t.pending(), 1);
    t.fire();
    await flush();
    assert.equal(calls, 3);
    poller.stop();
  });

  test('does not call while the document is hidden', async () => {
    const t = fakeTimers({ value: false });
    let calls = 0;
    const poller = createPoller(async () => {
      calls += 1;
    }, 5000, t.deps);

    poller.start();
    await flush();
    assert.equal(calls, 0);
    t.fire();
    await flush();
    assert.equal(calls, 0);
    t.visible.value = true;
    t.fire();
    await flush();
    assert.equal(calls, 1);
    poller.stop();
  });

  test('stop cancels the timer and later pokes', async () => {
    const t = fakeTimers();
    let calls = 0;
    const poller = createPoller(async () => {
      calls += 1;
    }, 5000, t.deps);

    poller.start();
    await flush();
    poller.stop();
    assert.equal(t.pending(), 0);
    poller.poke();
    t.fire();
    await flush();
    assert.equal(calls, 1);
  });

  test('a failing call does not stop the polling', async () => {
    const t = fakeTimers();
    let calls = 0;
    const poller = createPoller(async () => {
      calls += 1;
      throw new Error('503');
    }, 5000, t.deps);

    poller.start();
    await flush();
    t.fire();
    await flush();
    assert.equal(calls, 2);
    poller.stop();
  });
});
