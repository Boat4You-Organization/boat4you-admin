/* Session replay helpers (P6 R2), pure so node --test covers them: the stylesheets a recording names, the link handler of
 * clarity-visualize, idle skipping and the timeline. The player is views/ContactCenter/Recordings/Player.tsx. */

// The same stylesheets the archive looks for (backend RecAssetArchiver.CSS_IN_TEXT): Next.js keeps them under chunks/ (16) or css/.
const CSS_IN_TEXT = /(?:https?:\/\/([A-Za-z0-9.-]+))?(\/_next\/static\/(?:css|chunks)\/[A-Za-z0-9._-]{1,120}\.css)/g;

/** A gap between two events longer than this is skipped when "skip inactivity" is on. */
export const INACTIVITY_MS = 5000;
/** How much of a skipped gap is still played before the next event. */
export const SKIP_LEAD_MS = 1000;

/** The Next.js stylesheets the recording's lines name, relative or on [host] itself, each once and in order. */
export function stylesheetPaths(lines: string[], host: string): string[] {
  const found = lines
    .flatMap(line => Array.from(line.matchAll(CSS_IN_TEXT)))
    .filter(m => !m[1] || m[1].toLowerCase() === host.toLowerCase())
    .map(m => m[2]);

  return Array.from(new Set(found));
}

/**
 * The link handler of the visualizer. The admin CSP blocks the <base href> the visualizer adds (base-uri 'self'), so it resolves
 * links against the admin page: those are re-based onto the recorded page first (P0 S8). An archived stylesheet of the recorded
 * site goes to its archived copy (`assets`, path → /replay-assets/…); any other link of that site to the live site (images load;
 * the admin CSP keeps out its styles and fonts); anything else is returned unchanged for the CSP to decide.
 */
export function makeUseproxy(
  pageUrl: string,
  assets: Record<string, string>,
  adminOrigin: string
): (link: string) => string {
  const page = new URL(pageUrl);

  return (link: string) => {
    if (typeof link !== 'string' || link.startsWith('/replay-assets/')) return link;

    let u: URL;

    try {
      u = new URL(link, page);
    } catch {
      return link;
    }

    if (u.origin === adminOrigin) u = new URL(u.pathname + u.search + u.hash, page);

    if (u.origin !== page.origin) return link;

    return assets[u.pathname] ?? u.href;
  };
}

/** Index of the first time in [times] (ascending) greater than [t]. */
function firstAfter(times: number[], t: number): number {
  let lo = 0;
  let hi = times.length;

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);

    if (times[mid] <= t) lo = mid + 1;
    else hi = mid;
  }

  return lo;
}

/** Where the clock goes when idle time is skipped: inside a gap of more than INACTIVITY_MS, to SKIP_LEAD_MS before the next event. */
export function skipIdle(t: number, times: number[]): number {
  const i = firstAfter(times, t);

  if (i === 0 || i >= times.length) return t;

  const next = times[i];

  return next - times[i - 1] > INACTIVITY_MS && next - t > SKIP_LEAD_MS ? next - SKIP_LEAD_MS : t;
}

/** The events (ascending by time) after [from] and up to [to]. */
export function eventsBetween<T extends { time: number }>(events: T[], from: number, to: number): T[] {
  const times = events.map(e => e.time);

  return events.slice(firstAfter(times, from), firstAfter(times, to));
}

/** m:ss of a recording time in ms. */
export function formatClock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));

  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** A timeline mark's position in % of the recording, 0 to 100. */
export function markerLeft(t: number, duration: number): number {
  if (duration <= 0) return 0;

  return Math.min(100, Math.max(0, Math.round((t / duration) * 1000) / 10));
}
