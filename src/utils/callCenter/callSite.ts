/**
 * Call center: the backend names an inquiry's site by its CallSite key (boat4you, cc, greece, …), the rest of the admin
 * by the site id (boat4you, catamaran-croatia, …) that carries the label, the colour and the links. The lists showed the
 * raw key ("cc") without a colour, and the site filter sent site ids the backend never stores, so it matched nothing.
 */
import type { SiteId } from '../contactCenter/safeLink';

/** Backend CallSite keys in the order the filters list them, each with its site id. */
const CALL_SITES: [key: string, siteId: SiteId][] = [
  ['boat4you', 'boat4you'],
  ['cc', 'catamaran-croatia'],
  ['greece', 'catamaran-greece'],
  ['italy', 'catamaran-italy'],
  ['caribbean', 'catamaran-caribbean'],
  ['ey', 'europe-yachts'],
  ['cy', 'croatia-yachting'],
];

/** What the site filter sends: the keys the backend stores. */
export const CALL_SITE_KEYS = CALL_SITES.map(([key]) => key);

/** The admin site id of a CallSite key; an unknown key is passed through (shown as it is, without a colour). */
export const callSiteId = (key: string): string => CALL_SITES.find(([k]) => k === key)?.[1] ?? key;
