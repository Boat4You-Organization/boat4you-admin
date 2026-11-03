/* Objave: month grid and day grouping for the posts calendar (weeks start on Monday, local time).
 * No runtime imports on purpose: tests/social.test.ts runs this file with `node --test`. */
import type { SocialPost } from '@/types/social.type';

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar day, `YYYY-MM-DD`. */
export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export interface GridDay {
  date: Date;
  key: string;
  inMonth: boolean;
}

/** Six Monday-first weeks covering the month (month0 = 0 for January). */
export const monthGrid = (year: number, month0: number): GridDay[][] => {
  const first = new Date(year, month0, 1);
  // getDay(): 0 = Sunday; Monday-first offset 0..6.
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month0, 1 - offset);

  return Array.from({ length: 6 }, (_, w) =>
    Array.from({ length: 7 }, (__, d) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d);

      return { date, key: dayKey(date), inMonth: date.getMonth() === month0 };
    })
  );
};

/** [from, to) of the whole grid, as ISO, for GET /admin/social/posts. */
export const gridRange = (year: number, month0: number) => {
  const grid = monthGrid(year, month0);
  const from = grid[0][0].date;
  const last = grid[5][6].date;
  const to = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);

  return { from: from.toISOString(), to: to.toISOString() };
};

/** When the post belongs on the calendar: its schedule, else when it went out, else when it was made. */
export const postTime = (p: Pick<SocialPost, 'scheduledAt' | 'publishedAt' | 'createdAt'>) =>
  new Date(p.scheduledAt ?? p.publishedAt ?? p.createdAt);

/** Posts per local day, each day in time order. */
export const groupByDay = <P extends Pick<SocialPost, 'scheduledAt' | 'publishedAt' | 'createdAt'>>(posts: P[]) => {
  const map = new Map<string, P[]>();

  [...posts]
    .sort((a, b) => postTime(a).getTime() - postTime(b).getTime())
    .forEach(p => {
      const k = dayKey(postTime(p));

      map.set(k, [...(map.get(k) ?? []), p]);
    });

  return map;
};

export const addMonths = (year: number, month0: number, delta: number) => {
  const d = new Date(year, month0 + delta, 1);

  return { year: d.getFullYear(), month0: d.getMonth() };
};
