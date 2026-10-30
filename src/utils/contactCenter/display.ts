/* Contact Center (P2) display helpers. No runtime imports: `yarn test` runs this file with Node's own type stripping. */

/** ADMIN-2: the visitor's name, else their email, else `#id`. */
export function displayName(row: { id: number; visitorName?: string | null; visitorEmail?: string | null }): string {
  const name = row.visitorName?.trim();

  if (name) return name;

  const email = row.visitorEmail?.trim();

  return email || `#${row.id}`;
}

/** Seconds as `45 s`, `12 min`, `3 h 5 min`; null as an em dash. */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return '—';

  if (seconds < 60) return `${Math.round(seconds)} s`;

  const minutes = Math.round(seconds / 60);

  if (minutes < 60) return `${minutes} min`;

  const rest = minutes % 60;

  return rest ? `${Math.floor(minutes / 60)} h ${rest} min` : `${Math.floor(minutes / 60)} h`;
}

/** Under 90 s since the last heartbeat = the visitor has the site open now (as on the old /chat). */
export const isLiveNow = (lastSeenAt: string | null | undefined, now: number = Date.now()): boolean =>
  !!lastSeenAt && now - new Date(lastSeenAt).getTime() < 90_000;
