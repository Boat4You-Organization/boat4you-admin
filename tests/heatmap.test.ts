// Heatmaps (P6 R3): the clickmap and scrollmap inputs of clarity-visualize, reach and labels. `yarn test` (node --test).
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  elementLabel,
  heatPoints,
  reachAt,
  shownShare,
  toActivity,
  toHoverActivity,
  toScrollMap,
} from '../src/utils/contactCenter/heatmap.ts';

const el = (hash: string, clicks: number, text: string | null = 'Reach out', tag: string | null = 'button') => ({
  hash,
  text,
  tag,
  link: null,
  clicks,
  pageViews: 1,
  rage: 0,
  dead: 0,
  inquiryClicks: 0,
  inquiryPageViews: 0,
  hoverMs: 0,
});

describe('toActivity', () => {
  test('one entry per element with its points (eX, eY, clicks) as clarity-visualize reads them', () => {
    const activity = toActivity([el('reach', 3), el('nopoints', 1)], {
      reach: [
        { eX: 512, eY: 1536, clicks: 2 },
        { eX: 16896, eY: 512, clicks: 1 },
      ],
    });

    assert.deepEqual(activity, [
      { hash: 'reach', selector: '', totalclicks: 3, x: [512, 16896], y: [1536, 512], clicks: [2, 1], points: 2 },
      { hash: 'nopoints', selector: '', totalclicks: 1, x: [16383], y: [16383], clicks: [1], points: 1 },
    ]);
  });
});

describe('scroll', () => {
  const scroll = [
    { pct: 0, pageViews: 4 },
    { pct: 50, pageViews: 2 },
    { pct: 100, pageViews: 1 },
  ];

  test('the scrollmap: every step with the share of page views that reached it', () => {
    assert.deepEqual(toScrollMap(scroll), [
      { scrollReachY: 0, cumulativeSum: 4, percUsers: 100 },
      { scrollReachY: 50, cumulativeSum: 2, percUsers: 50 },
      { scrollReachY: 100, cumulativeSum: 1, percUsers: 25 },
    ]);
    assert.deepEqual(toScrollMap([]), []);
  });

  test('reach at a depth: the nearest step at or below it, in % of page views', () => {
    assert.equal(reachAt(scroll, 50), 50);
    assert.equal(reachAt(scroll, 60), 50);
    assert.equal(reachAt(scroll, 100), 25);
    assert.equal(reachAt([], 50), 0);
  });
});

describe('elementLabel', () => {
  test('its text, else its tag, else a dash', () => {
    assert.equal(elementLabel(el('a', 1, 'Reach out')), 'Reach out');
    assert.equal(elementLabel(el('a', 1, '', 'img')), '<img>');
    assert.equal(elementLabel(el('a', 1, null, null)), '—');
  });
});

describe('shownShare', () => {
  test('% of the clicks on elements the background page has (the others open later: menus, dialogs)', () => {
    const on = new Set(['a', 'c']);

    assert.equal(
      shownShare([el('a', 6), el('b', 3), el('c', 1)], h => on.has(h)),
      70
    );
    assert.equal(
      shownShare([], () => true),
      0
    );
  });
});

describe('toHoverActivity', () => {
  test('one entry per hovered element, weights in tenths of a second (at least 1), the busiest cell first', () => {
    const act = toHoverActivity({
      a: [
        { eX: 512, eY: 1536, ms: 2500 },
        { eX: 16384, eY: 16384, ms: 40 },
      ],
      b: [{ eX: 100, eY: 100, ms: 900 }],
    });

    assert.deepEqual(act, [
      { hash: 'a', selector: '', totalclicks: 26, x: [512, 16384], y: [1536, 16384], clicks: [25, 1], points: 2 },
      { hash: 'b', selector: '', totalclicks: 9, x: [100], y: [100], clicks: [9], points: 1 },
    ]);
    assert.deepEqual(toHoverActivity({}), []);
  });
});

describe('heatPoints', () => {
  test('page points from element rects: a 32767 grid within the rect, same spot merged, unknown or unlaid-out elements skipped', () => {
    const act = (hash: string, x: number[], y: number[], clicks: number[]) => ({
      hash,
      selector: '',
      totalclicks: clicks.reduce((n, v) => n + v, 0),
      x,
      y,
      clicks,
      points: x.length,
    });
    const rects: Record<string, { left: number; top: number; width: number; height: number }> = {
      a: { left: 10, top: 20, width: 100, height: 50 },
      z: { left: 0, top: 0, width: 0, height: 0 },
    };
    const out = heatPoints(
      [
        act('a', [0, 32767, 16383], [0, 32767, 16383], [3, 1, 2]),
        act('a', [16384], [16384], [4]),
        act('z', [0], [0], [9]),
        act('q', [0], [0], [9]),
      ],
      h => rects[h] ?? null
    );

    assert.deepEqual(out, {
      points: [
        { x: 10, y: 20, w: 3 },
        { x: 110, y: 70, w: 1 },
        { x: 60, y: 45, w: 6 },
      ],
      max: 6,
    });
    assert.deepEqual(
      heatPoints([], () => null),
      { points: [], max: 0 }
    );
  });
});
