/* Heatmap helpers (P6 R3), pure so node --test covers them: the clickmap and scrollmap inputs of clarity-visualize 0.8.73,
 * reach at a depth and element labels. The view is views/ContactCenter/Recordings/HeatmapView.tsx. */
import type { HeatPoint, HeatmapElement, ScrollReach } from '@/types/contactCenter.type';

/** clarity-visualize's ElementData: eX/eY are 0..32767 within the element, found in the background by its hash. */
export interface ActivityElement {
  hash: string;
  selector: string;
  totalclicks: number;
  x: number[];
  y: number[];
  clicks: number[];
  points: number;
}

export interface ScrollMapStep {
  scrollReachY: number;
  cumulativeSum: number;
  percUsers: number;
}

const CENTRE = 16383;
const PRECISION = 32767;

export interface HeatRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface HeatPointPx {
  x: number;
  y: number;
  w: number;
}

/**
 * Where the clickmap's points land on the drawn page (P6 R3 fix 3.11.2026): each element's points at their place within its
 * rect (page pixels, rounded), the same spot merged, an element the page has not got or has not laid out skipped. Replaces
 * clarity-visualize's clickmap, whose redraw after a resize kept only "visible" elements and so wiped the map.
 */
export function heatPoints(
  activity: ActivityElement[],
  rectOf: (hash: string) => HeatRect | null
): { points: HeatPointPx[]; max: number } {
  const byKey = new Map<string, HeatPointPx>();

  activity.forEach(e => {
    const r = rectOf(e.hash);

    if (!r || r.width <= 0 || r.height <= 0) return;

    e.x.forEach((ex, i) => {
      const x = Math.round(r.left + (ex / PRECISION) * r.width);
      const y = Math.round(r.top + (e.y[i] / PRECISION) * r.height);
      const key = `${x}:${y}`;
      const p = byKey.get(key);

      if (p) p.w += e.clicks[i];
      else byKey.set(key, { x, y, w: e.clicks[i] });
    });
  });

  const points = Array.from(byKey.values());

  return { points, max: points.reduce((m, p) => Math.max(m, p.w), 0) };
}

/** The clickmap input: one entry per element, its points as clarity-visualize reads them (an element without points: its centre). */
export function toActivity(elements: HeatmapElement[], points: Record<string, HeatPoint[]>): ActivityElement[] {
  return elements.map(e => {
    const p = points[e.hash]?.length ? points[e.hash] : [{ eX: CENTRE, eY: CENTRE, clicks: e.clicks }];

    return {
      hash: e.hash,
      selector: '',
      totalclicks: e.clicks,
      x: p.map(q => q.eX),
      y: p.map(q => q.eY),
      clicks: p.map(q => q.clicks),
      points: p.length,
    };
  });
}

/** The scrollmap input: each step with the page views that reached it and their share of all page views (the 0 % step). */
export function toScrollMap(scroll: ScrollReach[]): ScrollMapStep[] {
  const total = scroll[0]?.pageViews ?? 0;

  return scroll.map(s => ({
    scrollReachY: s.pct,
    cumulativeSum: s.pageViews,
    percUsers: total > 0 ? Math.round((s.pageViews * 100) / total) : 0,
  }));
}

/** % of page views that got at least as far down as [depth] % of the page (the nearest step at or below it). */
export function reachAt(scroll: ScrollReach[], depth: number): number {
  const total = scroll[0]?.pageViews ?? 0;
  const step = scroll.filter(s => s.pct <= depth).pop();

  return total > 0 && step ? Math.round((step.pageViews * 100) / total) : 0;
}

/** % of the clicks on elements the background page has; the others are on elements that appear later (menus, dialogs). */
export function shownShare(
  elements: Pick<HeatmapElement, 'hash' | 'clicks'>[],
  has: (hash: string) => boolean
): number {
  const total = elements.reduce((n, e) => n + e.clicks, 0);
  const shown = elements.reduce((n, e) => n + (has(e.hash) ? e.clicks : 0), 0);

  return total > 0 ? Math.round((shown * 100) / total) : 0;
}

/** An element as the admin shows it: its text, else its tag, else a dash. */
export function elementLabel(e: Pick<HeatmapElement, 'text' | 'tag'>): string {
  if (e.text && e.text.trim()) return e.text.trim();

  return e.tag ? `<${e.tag.toLowerCase()}>` : '—';
}
