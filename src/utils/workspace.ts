/**
 * Admin workspaces (Mario 5.11.2026): one admin, two menus.
 *
 *   charter   – the charter desk: Bookings, Offers, Users, Invoices, Custom boats, Boats · Media, Agencies
 *   marketing – web and marketing tools: Contact Center, Social posts (later backlinks, call center)
 *
 * The workspace is derived from the route, so every existing URL (offer links in e-mails, bookmarks) keeps
 * working; only the menu changes. Routes that belong to neither (profile, auth pages, 404) are neutral and
 * keep the workspace used last, which is remembered per browser so `/` lands there too.
 * A new route must be listed below, otherwise its menu item shows in neither workspace (tests check the
 * navigation config). No React in here: `tests/workspace.test.ts` runs this file under node --test.
 */

export type WorkspaceId = 'charter' | 'marketing';

/** Fixed display order of the workspace switch. */
export const WORKSPACE_IDS: readonly WorkspaceId[] = ['charter', 'marketing'];

const PREFIXES: Record<WorkspaceId, readonly string[]> = {
  charter: [
    '/bookings',
    '/dashboard',
    '/offers',
    '/users',
    '/invoices',
    '/custom-boats',
    '/boats',
    '/agencies',
    '/extras',
    '/inquiries',
  ],
  marketing: ['/contact-center', '/chat', '/social'],
};

/** Where a workspace opens when it is selected or when `/` lands on it. */
export const WORKSPACE_HOME: Record<WorkspaceId, string> = {
  charter: '/bookings',
  marketing: '/contact-center',
};

export const WORKSPACE_STORAGE_KEY = 'b4y-admin:workspace';

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

const isWorkspaceId = (value: unknown): value is WorkspaceId =>
  typeof value === 'string' && (WORKSPACE_IDS as readonly string[]).includes(value);

const underPrefix = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`);

/** The workspace a route belongs to, or null for a neutral route (profile, auth pages, unknown). */
export const workspaceForPath = (pathname: string): WorkspaceId | null => {
  const path = pathname.split('?')[0];

  return WORKSPACE_IDS.find(id => PREFIXES[id].some(prefix => underPrefix(path, prefix))) ?? null;
};

/** The workspaces that have at least one of the given (already role-filtered) menu items; never empty. */
export const workspacesFor = (items: readonly { path?: string }[]): WorkspaceId[] => {
  const present = new Set(items.map(item => workspaceForPath(item.path ?? '/')));
  const ids = WORKSPACE_IDS.filter(id => present.has(id));

  return ids.length > 0 ? ids : ['charter'];
};

/** `window.localStorage`, or undefined where the browser blocks it (private mode, disabled cookies). */
export const browserStorage = (): Storage | undefined => {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
};

export const rememberedWorkspace = (storage: StorageLike | undefined): WorkspaceId | null => {
  try {
    const value = storage?.getItem(WORKSPACE_STORAGE_KEY);

    return isWorkspaceId(value) ? value : null;
  } catch {
    return null;
  }
};

/**
 * The workspace the shell shows for a route: the route's own workspace, else (neutral route) the remembered
 * one, else the first one this user may open. Always one of `available`.
 */
export const activeWorkspace = (
  pathname: string,
  storage: StorageLike | undefined,
  available: readonly WorkspaceId[]
): WorkspaceId => {
  const wanted = workspaceForPath(pathname) ?? rememberedWorkspace(storage);

  return wanted && available.includes(wanted) ? wanted : (available[0] ?? 'charter');
};

/** Home of the remembered workspace when this user may open it, otherwise the Charter home. */
export const landingPath = (storage: StorageLike | undefined, available: readonly WorkspaceId[]): string =>
  WORKSPACE_HOME[activeWorkspace('/', storage, available)];

export const rememberWorkspace = (storage: StorageLike | undefined, id: WorkspaceId): void => {
  try {
    storage?.setItem(WORKSPACE_STORAGE_KEY, id);
  } catch {
    // Private mode / blocked storage: the switch still works, only the landing page is not remembered.
  }
};
