// Heatmaps (P6 R3): the clickmap and scrollmap inputs of clarity-visualize, reach and labels. `yarn test` (node --test).
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { elementLabel, reachAt, shownShare, toActivity, toScrollMap } from '../src/utils/contactCenter/heatmap.ts';

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
