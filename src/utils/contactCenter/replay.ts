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

type Proxy = (link: string) => string;

const STYLE_URL = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g;

/** A srcset with each candidate's URL through [proxy] (descriptors kept). */
export function rewriteSrcset(value: string, proxy: Proxy): string {
  return value
    .split(',')
    .map(part => {
      const m = /^\s*(\S+)(\s+.+)?\s*$/.exec(part);

      return m ? `${proxy(m[1])}${m[2] ?? ''}` : part;
    })
    .join(', ');
}

/** A style attribute with each url(…) through [proxy]. */
export function rewriteStyleUrls(style: string, proxy: Proxy): string {
  return style.replace(STYLE_URL, (_m, q: string, u: string) => `url(${q}${proxy(u)}${q})`);
}

type DomNode = { attributes?: Record<string, string> };
type DecodedLike = { dom?: Array<{ data?: DomNode[] }> };

/**
 * The visualizer passes only `src` and `href` to the link handler: `srcset` (Next.js images) and url() in style attributes would
 * resolve against the admin page. They are rewritten in the decoded DOM and mutations before the replay is set up.
 */
export function rewriteDomUrls(decoded: DecodedLike[], proxy: Proxy): void {
  decoded
    .flatMap(p => p.dom ?? [])
    .flatMap(e => e.data ?? [])
    .forEach(node => {
      const a = node.attributes;

      if (!a) return;

      if (a.srcset) a.srcset = rewriteSrcset(a.srcset, proxy);

      if (a.style && a.style.includes('url(')) a.style = rewriteStyleUrls(a.style, proxy);
    });
}

/** What a failed load means: the API body (an object, or text for the raw recording) says not_found or busy. */
export function loadErrorKind(e: unknown): 'gone' | 'busy' | 'failed' {
  let body: unknown = e;

  if (typeof e === 'string') {
    try {
      body = JSON.parse(e);
    } catch {
      return 'failed';
    }
  }

  const code = (body as { error?: unknown } | null | undefined)?.error;

  if (code === 'not_found') return 'gone';

  return code === 'busy' ? 'busy' : 'failed';
}

/**
 * Seeks one at a time: while one runs, only the latest target waits (a dragged slider does not queue every step), and a seek
 * that fails never stops the next one.
 */
export function createSeekQueue(run: (t: number) => Promise<void>): { seek(t: number): void; idle(): Promise<void> } {
  let running: Promise<void> | null = null;
  let pending: number | null = null;

  const drain = async () => {
    while (pending !== null) {
      const t = pending;

      pending = null;
      try {
        // eslint-disable-next-line no-await-in-loop -- one seek after the other, by design
        await run(t);
      } catch {
        // a failed seek leaves the frame as it was; the next one starts afresh
      }
    }

    running = null;
  };

  return {
    seek(t: number) {
      pending = t;

      if (!running) running = drain();
    },
    idle: () => running ?? Promise.resolve(),
  };
}

/** A lazy-chunk loader that reloads the page when the chunk is gone (an admin deploy swapped the files), instead of failing. */
export function lazyWithReload<T>(importer: () => Promise<T>, reload: () => void): () => Promise<T> {
  return () =>
    importer().catch(() => {
      reload();

      // Never settles: the page is reloading.
      return new Promise<T>(() => {});
    });
}
