// Admin workspaces (Charter / Marketing): which routes belong where, which one the shell shows, and where
// `/` lands. Run with `yarn test` (node --test, type stripping).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';

import {
  WORKSPACE_HOME,
  activeNavId,
  activeWorkspace,
  landingPath,
  rememberWorkspace,
  workspaceForPath,
  workspacesFor,
} from '../src/utils/workspace.ts';

const memoryStorage = (initial: Record<string, string> = {}) => {
  const data = new Map(Object.entries(initial));

  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    data,
  };
};

const throwingStorage = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('blocked');
  },
};

const BOTH = ['charter', 'marketing'] as const;

describe('workspaceForPath', () => {
  test('charter operations stay in Charter', () => {
    for (const path of [
      '/bookings',
      '/bookings/123',
      '/dashboard',
      '/offers',
      '/users',
      '/invoices/2026',
      '/custom-boats/7',
      '/boats/media',
      '/agencies',
      '/extras',
    ]) {
      assert.equal(workspaceForPath(path), 'charter', path);
    }
  });

  test('Contact Center, the old chat inbox and social posts are Marketing', () => {
    for (const path of [
      '/contact-center',
      '/contact-center/recording/list',
      '/contact-center/stats',
      '/chat',
      '/social',
      '/social/new',
      '/social/edit/4',
      '/call-center',
      '/call-center/calls/10',
    ]) {
      assert.equal(workspaceForPath(path), 'marketing', path);
    }
  });

  test('profile, auth pages, the root and unknown routes are neutral', () => {
    for (const path of ['/', '/my-profile', '/login', '/forgot-password', '/backlinks', '/no-such-page']) {
      assert.equal(workspaceForPath(path), null, path);
    }
  });

  test('a prefix only matches on a path boundary', () => {
    assert.equal(workspaceForPath('/socials'), null);
    assert.equal(workspaceForPath('/contact-centers'), null);
  });

  test('ignores a query string and a trailing slash', () => {
    assert.equal(workspaceForPath('/social/?page=2'), 'marketing');
    assert.equal(workspaceForPath('/bookings/?tab=past'), 'charter');
  });

  test('every menu item in navigation.config.ts belongs to a workspace (no silent drift)', () => {
    const source = readFileSync(new URL('../src/config/navigation.config.ts', import.meta.url), 'utf8');
    const paths = [...source.matchAll(/path: '([^']+)'/g)].map(match => match[1]);

    assert.ok(paths.length >= 9, `expected the menu paths, found ${paths.length}`);

    for (const path of paths) {
      assert.notEqual(workspaceForPath(path), null, `${path} is in neither workspace`);
    }
  });
});

describe('workspacesFor', () => {
  test('lists the workspaces that have at least one item, in fixed order', () => {
    assert.deepEqual(workspacesFor([{ path: '/social' }, { path: '/bookings' }, { path: '/contact-center' }]), [
      'charter',
      'marketing',
    ]);
  });

  test('a user without Marketing items gets Charter only', () => {
    assert.deepEqual(workspacesFor([{ path: '/bookings' }, { path: '/offers' }]), ['charter']);
  });

  test('no items at all still yields Charter so the shell has a home', () => {
    assert.deepEqual(workspacesFor([]), ['charter']);
  });
});

describe('activeWorkspace', () => {
  test('the route decides, whatever is remembered', () => {
    const storage = memoryStorage({ 'b4y-admin:workspace': 'marketing' });

    assert.equal(activeWorkspace('/offers', storage, BOTH), 'charter');
    assert.equal(activeWorkspace('/social/new', memoryStorage(), BOTH), 'marketing');
  });

  test('a neutral route keeps the remembered workspace', () => {
    const storage = memoryStorage({ 'b4y-admin:workspace': 'marketing' });

    assert.equal(activeWorkspace('/my-profile', storage, BOTH), 'marketing');
    assert.equal(activeWorkspace('/login', storage, BOTH), 'marketing');
  });

  test('a neutral route with nothing remembered → Charter', () => {
    assert.equal(activeWorkspace('/my-profile', memoryStorage(), BOTH), 'charter');
    assert.equal(activeWorkspace('/my-profile', throwingStorage, BOTH), 'charter');
    assert.equal(activeWorkspace('/my-profile', undefined, BOTH), 'charter');
  });

  test('never returns a workspace this user cannot open', () => {
    const storage = memoryStorage({ 'b4y-admin:workspace': 'marketing' });

    assert.equal(activeWorkspace('/contact-center', storage, ['charter']), 'charter');
    assert.equal(activeWorkspace('/my-profile', storage, ['charter']), 'charter');
  });
});

describe('landingPath', () => {
  test('lands on the remembered workspace home', () => {
    assert.equal(landingPath(memoryStorage({ 'b4y-admin:workspace': 'marketing' }), BOTH), WORKSPACE_HOME.marketing);
    assert.equal(WORKSPACE_HOME.marketing, '/contact-center');
  });

  test('nothing remembered or junk → Charter home (Bookings)', () => {
    assert.equal(landingPath(memoryStorage(), BOTH), '/bookings');
    assert.equal(landingPath(memoryStorage({ 'b4y-admin:workspace': 'kitchen' }), BOTH), '/bookings');
  });

  test('a remembered workspace this user cannot open is ignored', () => {
    assert.equal(landingPath(memoryStorage({ 'b4y-admin:workspace': 'marketing' }), ['charter']), '/bookings');
  });

  test('blocked storage (private mode) never throws', () => {
    assert.equal(landingPath(throwingStorage, BOTH), '/bookings');
    assert.equal(landingPath(undefined, BOTH), '/bookings');
  });
});

describe('rememberWorkspace', () => {
  test('writes the workspace under one key', () => {
    const storage = memoryStorage();

    rememberWorkspace(storage, 'marketing');
    assert.equal(storage.data.get('b4y-admin:workspace'), 'marketing');
  });

  test('blocked storage never throws', () => {
    assert.doesNotThrow(() => rememberWorkspace(throwingStorage, 'charter'));
    assert.doesNotThrow(() => rememberWorkspace(undefined, 'charter'));
  });
});

describe('activeNavId', () => {
  const items = [
    { id: 'bookings', path: '/bookings' },
    { id: 'stats', path: '/contact-center/stats' },
    { id: 'live', path: '/contact-center/live' },
    { id: 'contactCenter', path: '/contact-center' },
    { id: 'heatmaps', path: '/contact-center/recording' },
    { id: 'social', path: '/social' },
  ];

  test('the longest matching path wins, whatever the item order', () => {
    assert.equal(activeNavId('/contact-center/stats', items), 'stats');
    assert.equal(activeNavId('/contact-center/stats?range=30', items), 'stats');
    assert.equal(activeNavId('/contact-center/recording/list', items), 'heatmaps');
    assert.equal(activeNavId('/contact-center/recording/8532', items), 'heatmaps');
  });

  test('the section home and its other tabs light the section item', () => {
    assert.equal(activeNavId('/contact-center', items), 'contactCenter');
    assert.equal(activeNavId('/contact-center/live', items), 'live');
    assert.equal(activeNavId('/contact-center/contacts/12', items), 'contactCenter');
    assert.equal(activeNavId('/bookings/100197', items), 'bookings');
  });

  test('neutral or unknown routes light nothing; prefixes match on a boundary only', () => {
    assert.equal(activeNavId('/my-profile', items), null);
    assert.equal(activeNavId('/contact-centers', items), null);
    assert.equal(activeNavId('/socials', items), null);
  });
});
