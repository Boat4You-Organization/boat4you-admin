// Call center: the backend's CallSite keys shown as the admin's sites (label, colour) and sent by the site filter.
// Run with `yarn test` (node --test, type stripping).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';

import { CALL_SITE_KEYS, callSiteId } from '../src/utils/callCenter/callSite.ts';
import { SITE_IDS, siteLabel } from '../src/utils/contactCenter/safeLink.ts';

const callSiteLabel = (key: string) => siteLabel(callSiteId(key));

describe('call center sites', () => {
  test('the filter sends the 7 keys the backend stores', () => {
    assert.deepEqual(CALL_SITE_KEYS, ['boat4you', 'cc', 'greece', 'italy', 'caribbean', 'ey', 'cy']);
  });

  test('every key is one of the admin sites, each exactly once', () => {
    assert.deepEqual([...CALL_SITE_KEYS.map(callSiteId)].sort(), [...SITE_IDS].sort());
  });

  test('"cc" reads Catamaran Croatia, never the raw key', () => {
    assert.equal(callSiteLabel('cc'), 'Catamaran Croatia');
    assert.equal(callSiteLabel('cy'), 'Croatia Yachting');
    assert.deepEqual(
      CALL_SITE_KEYS.filter(key => key !== 'boat4you' && callSiteLabel(key) === key),
      []
    );
  });

  test('an unknown key is shown as it is', () => {
    assert.equal(callSiteId('new-site'), 'new-site');
    assert.equal(callSiteLabel('new-site'), 'new-site');
  });

  test('every admin site has its own colour in SiteChip', () => {
    const source = readFileSync(new URL('../src/views/ContactCenter/common.tsx', import.meta.url), 'utf8');
    const colours = SITE_IDS.map(id => source.match(new RegExp(`['"]?${id}['"]?: \\{ bg: '(#[0-9A-F]{6})'`))?.[1]);

    assert.ok(colours.every(Boolean), 'a site without a colour');
    assert.equal(new Set(colours).size, SITE_IDS.length);
  });
});
