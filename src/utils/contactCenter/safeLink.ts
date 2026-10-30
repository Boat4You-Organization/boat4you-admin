/* Contact Center (P2): the seven public sites and the only way a visitor-, AI- or tracker-supplied page becomes a link
 * (ADMIN-11). A path or URL is a link only on that conversation's own site host; anything else is shown as text with
 * the red "sumnjivo" tag. No runtime imports: `yarn test` runs this file with Node's own type stripping. */

export type SiteId =
  | 'boat4you'
  | 'catamaran-croatia'
  | 'catamaran-greece'
  | 'catamaran-italy'
  | 'catamaran-caribbean'
  | 'europe-yachts'
  | 'croatia-yachting';

/** As BackendRegistry / SiteIds has them, on their www hosts. */
export const SITES: Record<SiteId, { label: string; base: string }> = {
  boat4you: { label: 'Boat4You', base: 'https://www.boat4you.com' },
  'catamaran-croatia': { label: 'Catamaran Croatia', base: 'https://www.catamaran-croatia-charter.com' },
  'catamaran-greece': { label: 'Catamaran Greece', base: 'https://www.catamaran-charter-greece.com' },
  'catamaran-italy': { label: 'Catamaran Italy', base: 'https://www.catamarancharteritaly.com' },
  'catamaran-caribbean': { label: 'Catamaran Caribbean', base: 'https://www.catamaran-charter-caribbean.com' },
  'europe-yachts': { label: 'Europe Yachts', base: 'https://www.europe-yachts.com' },
  'croatia-yachting': { label: 'Croatia Yachting', base: 'https://www.croatia-yachting.com' },
};

export const SITE_IDS = Object.keys(SITES) as SiteId[];

const isSiteId = (id: string): id is SiteId => Object.prototype.hasOwnProperty.call(SITES, id);

/** The site's label, or the raw id for a site this build does not know. */
export const siteLabel = (siteId: string): string => (isSiteId(siteId) ? SITES[siteId].label : siteId);

// A same-site path: one leading slash, no second slash or backslash after it, no whitespace or backslash anywhere.
const SAFE_PATH = /^\/(?![/\\])[^\s\\]*$/;

/** An absolute https URL on [siteId]'s own host for a path or URL that stays there; null for anything else. */
export function safeHref(siteId: string, pathOrUrl: string | null | undefined): string | null {
  if (!isSiteId(siteId) || !pathOrUrl) return null;

  const { base } = SITES[siteId];

  try {
    if (pathOrUrl.startsWith('/')) {
      if (!SAFE_PATH.test(pathOrUrl)) return null;

      const url = new URL(pathOrUrl, base);

      // `/..//evil.tld` resolves to `//evil.tld` on our host: no link, a site that normalises it could redirect away.
      return url.origin === base && !url.pathname.startsWith('//') ? url.href : null;
    }

    if (!pathOrUrl.startsWith('https://') || /[\s\\]/.test(pathOrUrl)) return null;

    const url = new URL(pathOrUrl);

    return url.origin === base && !url.username && !url.password && !url.pathname.startsWith('//') ? url.href : null;
  } catch {
    return null;
  }
}
