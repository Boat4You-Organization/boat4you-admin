// PR module: decision labels, link-state colours, follow-up timing and every /admin/pr call of src/services/pr.api.ts,
// run with `yarn test` (node --test, Node's own type stripping: no bundler, no axios instance, a fake HTTP client).
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createPrApi } from '../src/services/pr.api.ts';
import {
  PR_DECISION_CODES,
  PR_DECISION_UNKNOWN_KEY,
  decisionLabelKey,
  followUpDueOn,
  isFollowUpDue,
  linkStateTone,
} from '../src/utils/pr/format.ts';

type Call = { method: string; url: string; data?: unknown; config?: Record<string, any> };

const fakeHttp = (answers: unknown[] = []) => {
  const calls: Call[] = [];
  const queue = answers.slice();
  const answer = async (call: Call) => {
    calls.push(call);

    return { data: queue.length ? queue.shift() : { ok: call.url } };
  };
  const http = {
    get: (url: string, config?: Record<string, any>) => answer({ method: 'get', url, config }),
    post: (url: string, data?: unknown, config?: Record<string, any>) => answer({ method: 'post', url, data, config }),
    patch: (url: string, data?: unknown, config?: Record<string, any>) =>
      answer({ method: 'patch', url, data, config }),
  };

  return { http: http as any, calls };
};

describe('decisionLabelKey', () => {
  // PrComplianceRules block codes in rule order (backend Task 2), then the pitch DTO's "ALLOWED".
  const BACKEND_CODES = [
    'TRIPADVISOR_FORBIDDEN',
    'SUPPRESSED',
    'OPTED_OUT',
    'DO_NOT_CONTACT',
    'NO_EMAIL_SOURCE',
    'MARKET_UNKNOWN',
    'MARKET_DE_NO_COLD_EMAIL',
    'ZA_CONSENT_REQUIRED',
    'MARKET_NOT_CLEARED',
    'FOLLOWUP_TOO_EARLY',
    'ALLOWED',
  ];

  test('maps every backend code to its own key in the pr namespace', () => {
    const keys = BACKEND_CODES.map(decisionLabelKey);

    assert.equal(new Set(keys).size, BACKEND_CODES.length);
    keys.forEach(k => {
      assert.match(k, /^decision\.[a-z][A-Za-z]+$/);
      assert.notEqual(k, PR_DECISION_UNKNOWN_KEY);
    });
    assert.equal(decisionLabelKey('MARKET_DE_NO_COLD_EMAIL'), 'decision.deNoColdEmail');
    assert.equal(decisionLabelKey('ALLOWED'), 'decision.allowed');
    assert.equal(decisionLabelKey('FOLLOWUP_TOO_EARLY'), 'decision.followUpTooEarly');
  });

  test('exports exactly the backend codes, so the locale file can be built from them', () => {
    assert.deepEqual([...PR_DECISION_CODES].sort(), [...BACKEND_CODES].sort());
  });

  test('an unknown code (or an Object property name) falls back to one key', () => {
    assert.equal(PR_DECISION_UNKNOWN_KEY, 'decision.unknown');
    ['PITCH_EXISTS', '', 'allowed', 'toString', '__proto__', 'constructor'].forEach(c =>
      assert.equal(decisionLabelKey(c), 'decision.unknown', c)
    );
  });
});

describe('linkStateTone', () => {
  test('follow is success, nofollow and not checked are default, blocked is warning, missing and gone are error', () => {
    assert.equal(linkStateTone('OK_FOLLOW'), 'success');
    assert.equal(linkStateTone('OK_NOFOLLOW'), 'default');
    assert.equal(linkStateTone('NOT_CHECKED'), 'default');
    assert.equal(linkStateTone('BLOCKED_UNKNOWN'), 'warning');
    assert.equal(linkStateTone('LINK_MISSING'), 'error');
    assert.equal(linkStateTone('PAGE_GONE'), 'error');
  });
});

describe('follow-up timing (5 days, as FOLLOWUP_TOO_EARLY)', () => {
  const SENT = '2026-11-04T10:15:30Z';

  test('due exactly 5 days after sending, not a millisecond earlier', () => {
    assert.equal(isFollowUpDue(SENT, '2026-11-09T10:15:30Z'), true);
    assert.equal(isFollowUpDue(SENT, '2026-11-09T10:15:29.999Z'), false);
    assert.equal(isFollowUpDue(SENT, '2026-11-20T00:00:00Z'), true);
    assert.equal(isFollowUpDue(SENT, SENT), false);
  });

  test('Jackson Instants with micro- or nanoseconds and offsets compare correctly', () => {
    assert.equal(isFollowUpDue('2026-11-04T10:15:30.123456Z', '2026-11-09T10:15:30.124Z'), true);
    assert.equal(isFollowUpDue('2026-11-04T10:15:30.123456789Z', '2026-11-09T10:15:30.122Z'), false);
    assert.equal(isFollowUpDue('2026-11-04T11:15:30+01:00', '2026-11-09T10:15:30Z'), true);
  });

  test('an unreadable date is never due', () => {
    assert.equal(isFollowUpDue('', '2026-11-20T00:00:00Z'), false);
    assert.equal(isFollowUpDue(SENT, 'not a date'), false);
  });

  test('due date is the UTC calendar day 5 days after sending', () => {
    assert.equal(followUpDueOn(SENT), '2026-11-09');
    assert.equal(followUpDueOn('2026-11-04T23:59:59.999999Z'), '2026-11-09');
    assert.equal(followUpDueOn('2026-11-05T00:30:00+01:00'), '2026-11-09');
    assert.equal(followUpDueOn('2026-12-29T08:00:00Z'), '2027-01-03');
    assert.equal(followUpDueOn('2028-02-25T08:00:00Z'), '2028-03-01');
  });

  test('due date of an unreadable date is empty, not a crash', () => {
    assert.equal(followUpDueOn('soon'), '');
  });
});

describe('createPrApi', () => {
  test('every admin route with its verb, path and body', async () => {
    const { http, calls } = fakeHttp();
    const pr = createPrApi(http);

    await pr.overview();
    await pr.outlets();
    await pr.createOutlet({ name: 'The Times', market: 'GB', tier: 1 });
    await pr.updateOutlet(3, { notes: '' });
    await pr.createContact({ email: 'a@b.com' });
    await pr.updateContact(4, { status: 'CONSENTED' });
    await pr.optOut(4);
    await pr.bounce(5);
    await pr.studies();
    await pr.createStudy({ number: 1, siteId: 'boat4you', title: 'T' });
    await pr.updateStudy(6, { status: 'LIVE' });
    await pr.createPitch({ studyId: 6, contactId: 4, template: 'DATA_PITCH', subject: 's', body: 'b' });
    await pr.updatePitch(7, { subject: 's2' });
    await pr.followUp(7, { body: 'nudge' });
    await pr.setPitchStatus(7, { status: 'REPLIED', replyNote: 'yes' });
    await pr.send(7);
    await pr.createPlacement({ articleUrl: 'https://x.com/a' });
    await pr.updatePlacement(8, { anchorText: 'boat4you' });
    await pr.checkPlacement(8);
    await pr.clearPlacementAlert(8);
    await pr.feeds();
    await pr.createFeed({ name: 'GA', url: 'https://www.google.com/alerts/feeds/1/2' });
    await pr.updateFeed(9, { enabled: false });
    await pr.setMentionStatus(10, { status: 'ASK_FOR_LINK' });

    assert.deepEqual(
      calls.map(c => [c.method, c.url, c.data]),
      [
        ['get', '/admin/pr/overview', undefined],
        ['get', '/admin/pr/outlets', undefined],
        ['post', '/admin/pr/outlets', { name: 'The Times', market: 'GB', tier: 1 }],
        ['patch', '/admin/pr/outlets/3', { notes: '' }],
        ['post', '/admin/pr/contacts', { email: 'a@b.com' }],
        ['patch', '/admin/pr/contacts/4', { status: 'CONSENTED' }],
        ['post', '/admin/pr/contacts/4/opt-out', undefined],
        ['post', '/admin/pr/contacts/5/bounce', undefined],
        ['get', '/admin/pr/studies', undefined],
        ['post', '/admin/pr/studies', { number: 1, siteId: 'boat4you', title: 'T' }],
        ['patch', '/admin/pr/studies/6', { status: 'LIVE' }],
        ['post', '/admin/pr/pitches', { studyId: 6, contactId: 4, template: 'DATA_PITCH', subject: 's', body: 'b' }],
        ['patch', '/admin/pr/pitches/7', { subject: 's2' }],
        ['post', '/admin/pr/pitches/7/follow-up', { body: 'nudge' }],
        ['patch', '/admin/pr/pitches/7/status', { status: 'REPLIED', replyNote: 'yes' }],
        ['post', '/admin/pr/pitches/7/send', undefined],
        ['post', '/admin/pr/placements', { articleUrl: 'https://x.com/a' }],
        ['patch', '/admin/pr/placements/8', { anchorText: 'boat4you' }],
        ['post', '/admin/pr/placements/8/check', undefined],
        ['post', '/admin/pr/placements/8/clear-alert', undefined],
        ['get', '/admin/pr/feeds', undefined],
        ['post', '/admin/pr/feeds', { name: 'GA', url: 'https://www.google.com/alerts/feeds/1/2' }],
        ['patch', '/admin/pr/feeds/9', { enabled: false }],
        ['patch', '/admin/pr/mentions/10', { status: 'ASK_FOR_LINK' }],
      ]
    );
  });

  test('answers the response body', async () => {
    const pitch = { id: 7, status: 'FAILED', error: 'SMTP 550' };
    const { http } = fakeHttp([pitch]);

    assert.deepEqual(await createPrApi(http).send(7), pitch);
  });

  test('list filters: empty ones are dropped, linksToUs=false and page 0 are kept', async () => {
    const { http, calls } = fakeHttp();
    const pr = createPrApi(http);

    await pr.contacts({ market: 'GB', status: undefined, q: '', page: 0, size: 100 });
    await pr.contacts({});
    await pr.pitches({ studyId: 6, status: 'DRAFT' });
    await pr.pitches({});
    await pr.placements({ studyId: 6 });
    await pr.placements({});
    await pr.mentions({ status: 'NEW', linksToUs: false, page: 0, size: 50 });
    await pr.mentions({ linksToUs: null });

    assert.deepEqual(
      calls.map(c => [c.url, c.config?.params]),
      [
        ['/admin/pr/contacts', { market: 'GB', page: 0, size: 100 }],
        ['/admin/pr/contacts', {}],
        ['/admin/pr/pitches', { studyId: 6, status: 'DRAFT' }],
        ['/admin/pr/pitches', {}],
        ['/admin/pr/placements', { studyId: 6 }],
        ['/admin/pr/placements', {}],
        ['/admin/pr/mentions', { status: 'NEW', linksToUs: false, page: 0, size: 50 }],
        ['/admin/pr/mentions', {}],
      ]
    );
  });

  test('CSV import sends the file text as the body with Content-Type text/csv', async () => {
    const csv = 'name,email,market\nJane,jane@times.co.uk,UK\n';
    const result = { created: 1, updated: 0, skipped: [] };
    const { http, calls } = fakeHttp([result]);

    assert.deepEqual(await createPrApi(http).importContacts(csv), result);
    assert.equal(calls[0].method, 'post');
    assert.equal(calls[0].url, '/admin/pr/contacts/import');
    assert.equal(calls[0].data, csv);
    assert.equal(calls[0].config?.headers['Content-Type'], 'text/csv');
  });
});
