/* The replay of one recorded page view (P6 R2) on clarity-visualize 0.8.73, the version the recorder is pinned to. setup()
 * draws the first DOM into the iframe, render() applies events; a seek back is a fresh setup plus every event up to the target
 * (P0 S11), a seek forward only renders the events in between. The iframe is sandboxed without scripts (allow-same-origin only), so nothing recorded can run. */
import { Data } from 'clarity-decode';
import { Visualizer } from 'clarity-visualize';

import { ActivityElement, ScrollMapStep, heatOverlayCss, heatPoints } from '@/utils/contactCenter/heatmap';
import { eventsBetween, makeUseproxy } from '@/utils/contactCenter/replay';

type Event = Data.DecodedEvent;

const RESIZE = 11; // clarity Data.Event.Resize: { width, height }
const HEAT_CANVAS_ATTR = 'b4y-heat'; // data-b4y-heat on the map canvas
const HEAT_CANVAS_KEY = 'b4yHeat';
const HEAT_RADIUS = 20;
const HEAT_ALPHA_BOOST = 0.15;
const HEAT_COLORS = ['blue', 'cyan', 'lime', 'yellow', 'red'];
// Chrome draws no canvas taller than this.
const HEAT_MAX_HEIGHT = 32767;

export interface ReplaySource {
  decoded: Data.DecodedPayload[];
  pageUrl: string;
  assets: Record<string, string>;
  mobile: boolean;
  onresize: (width: number, height: number) => void;
}

export class Replay {
  readonly duration: number;

  readonly times: number[];

  private readonly v = new Visualizer();

  private readonly events: Event[];

  private readonly dom: ReturnType<Visualizer['merge']>['dom'];

  private readonly version: string;

  private at = 0;

  private drawn = false;

  private constructor(
    private readonly win: Window,
    private readonly src: ReplaySource
  ) {
    const merged = this.v.merge(src.decoded);

    this.events = [...merged.events].sort((a, b) => a.time - b.time);
    this.times = this.events.map(e => e.time);
    this.dom = merged.dom;
    this.version = merged.envelope.version;

    const last = this.times.length ? this.times[this.times.length - 1] : 0;

    // Event times and each payload's start and duration count from the page's start.
    this.duration = Math.max(last, ...src.decoded.map(p => p.envelope.start + p.envelope.duration));
  }

  /** Draws the first DOM of the recording into [iframe] and sizes it from the first viewport the recording knows. */
  static async create(iframe: HTMLIFrameElement, src: ReplaySource): Promise<Replay> {
    const win = iframe.contentWindow;

    if (!win) throw new Error('replay iframe has no window');

    const replay = new Replay(win, src);

    await replay.seek(0);

    const first = replay.events.find(e => e.event === RESIZE) as
      | { data?: { width: number; height: number } }
      | undefined;

    if (first?.data) src.onresize(first.data.width, first.data.height);

    return replay;
  }

  get time(): number {
    return this.at;
  }

  /** The state at [t]: forward from what is drawn, otherwise a fresh setup and every event up to it. */
  async seek(t: number): Promise<void> {
    if (this.drawn && t >= this.at) {
      this.advance(t);

      return;
    }

    await this.v.setup(this.win, this.options());
    this.v.render(eventsBetween(this.events, -Infinity, t));
    this.at = t;
    this.drawn = true;
  }

  /** Plays on from the current time to [t] (forward only). */
  advance(t: number): void {
    if (t <= this.at) return;

    this.v.render(eventsBetween(this.events, this.at, t));
    this.at = t;
  }

  /**
   * The click heatmap (P6 R3) over the drawn page, drawn by us (3.11.2026): clarity-visualize's clickmap redrew itself on every
   * resize of the page and then kept only the elements it judged visible, so the map showed and vanished. One canvas over the
   * whole page, every laid-out element's points, no observers; an earlier map is replaced.
   */
  clickmap(activity: ActivityElement[]): void {
    const canvas = this.heatCanvas();
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx) return;

    const scrollX = this.win.pageXOffset;
    const scrollY = this.win.pageYOffset;
    const { points, max } = heatPoints(activity, hash => {
      const el = this.v.get(hash) as Element | null | undefined;

      if (!el || typeof el.getBoundingClientRect !== 'function') return null;

      const r = el.getBoundingClientRect();

      return { left: r.left + scrollX, top: r.top + scrollY, width: r.width, height: r.height };
    });

    if (!points.length || max <= 0) return;

    // Soft black discs whose alpha adds up, then the alpha picks the colour (blue → red), as clarity does.
    const top = Math.max(0, Math.min(...points.map(p => p.y)) - HEAT_RADIUS);
    const bottom = Math.min(canvas.height, Math.max(...points.map(p => p.y)) + HEAT_RADIUS);

    points.forEach(p => {
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, HEAT_RADIUS);

      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = Math.min(p.w / max + HEAT_ALPHA_BOOST, 1);
      ctx.fillStyle = g;
      ctx.fillRect(p.x - HEAT_RADIUS, p.y - HEAT_RADIUS, HEAT_RADIUS * 2, HEAT_RADIUS * 2);
    });
    ctx.globalAlpha = 1;

    if (bottom <= top) return;

    const band = ctx.getImageData(0, top, canvas.width, bottom - top);
    const palette = this.heatPalette();

    for (let i = 0; i < band.data.length; i += 4) {
      const alpha = band.data[i + 3];

      if (alpha > 0) {
        const o = (alpha - 1) * 4;

        band.data[i] = palette[o];
        band.data[i + 1] = palette[o + 1];
        band.data[i + 2] = palette[o + 2];
      }
    }

    ctx.putImageData(band, 0, top);
  }

  /** The scroll heatmap, drawn by us: the page from blue (everyone got here) to red (hardly anyone), the fold and 75/50/25 %. */
  scrollmap(steps: ScrollMapStep[], foldPx: number): void {
    const canvas = this.heatCanvas();
    const ctx = canvas?.getContext('2d');
    const all = steps[0]?.cumulativeSum ?? 0;

    if (!canvas || !ctx || all <= 0) return;

    const grd = ctx.createLinearGradient(0, 0, 0, canvas.height);
    const pageH = this.docHeight();

    steps.forEach(s => {
      const stop = (s.scrollReachY / 100) * (pageH / canvas.height);
      const hue = (1 - s.cumulativeSum / all) * 240;

      if (stop >= 0 && stop <= 1) grd.addColorStop(stop, `hsla(${Math.round(hue)}, 100%, 50%, 0.6)`);
    });
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.marker(ctx, canvas.width, 'Average fold', foldPx, 84);
    [75, 50, 25].forEach(m => {
      const closest = steps.reduce((prev, cur) =>
        Math.abs(cur.percUsers - m) < Math.abs(prev.percUsers - m) ? cur : prev
      );

      if (Math.abs(closest.percUsers - m) <= 2) {
        this.marker(ctx, canvas.width, `${m}%`, (closest.scrollReachY / 100) * canvas.height, 35);
      }
    });
  }

  /**
   * One canvas over the whole drawn page (created once, cleared every time), never catching clicks. It lives in the admin
   * document, over the replay iframe (4.11.2026): the frame is sandboxed without scripts, and a canvas in a script-less
   * document has no box and never paints its bitmap, so a map drawn inside the frame was invisible.
   */
  private heatCanvas(): HTMLCanvasElement | null {
    const frame = this.win.frameElement as HTMLIFrameElement | null;
    const host = frame?.parentElement;

    if (!frame || !host) return null;

    let c = Replay.heatCanvasOf(frame);

    if (!c) {
      c = host.ownerDocument.createElement('canvas');
      c.dataset[HEAT_CANVAS_KEY] = '1';
      c.setAttribute('aria-hidden', 'true');
      host.appendChild(c);
    }

    if (host.ownerDocument.defaultView?.getComputedStyle(host).position === 'static') host.style.position = 'relative';

    c.width = frame.clientWidth;
    c.height = Math.min(this.docHeight(), HEAT_MAX_HEIGHT);
    c.style.cssText = heatOverlayCss(c.width, c.height, frame.style.transform, frame.style.transformOrigin);
    c.getContext('2d')?.clearRect(0, 0, c.width, c.height);

    return c;
  }

  /** The map canvas laid over [frame], if one was drawn. */
  static heatCanvasOf(frame: HTMLIFrameElement): HTMLCanvasElement | null {
    return frame.parentElement?.querySelector<HTMLCanvasElement>(`:scope > canvas[data-${HEAT_CANVAS_ATTR}]`) ?? null;
  }

  /** 256 colours from blue to red, one per alpha value. */
  private heatPalette(): Uint8ClampedArray {
    const c = this.win.document.createElement('canvas');

    c.width = 1;
    c.height = 256;

    const ctx = c.getContext('2d');

    if (!ctx) return new Uint8ClampedArray(256 * 4);

    const g = ctx.createLinearGradient(0, 0, 0, 256);

    HEAT_COLORS.forEach((colour, i) => g.addColorStop((i + 1) / HEAT_COLORS.length, colour));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1, 256);

    return ctx.getImageData(0, 0, 1, 256).data;
  }

  private marker(ctx: CanvasRenderingContext2D, width: number, label: string, y: number, boxW: number): void {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.setLineDash([2, 2]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'white';
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#323130';
    ctx.fillRect(0, y - 16, boxW, 32);
    ctx.fillStyle = 'white';
    ctx.font = '500 12px system-ui, sans-serif';
    ctx.fillText(label, 5, y + 5);
  }

  /** Whether the drawn page has the element of [hash]. */
  has(hash: string): boolean {
    return !!this.v.get(hash);
  }

  /**
   * Lays the drawn page out at [width] and its full height in [frame] without stretching what is sized in screen heights (a hero
   * of 95svh would grow with the frame): every element whose height changes as the frame grows from the recorded [viewportH]
   * keeps the height, padding and margin it had there (P6 R3 review I7). Returns the full height; [frame] is left at it.
   */
  fullHeight(frame: HTMLIFrameElement, width: number, viewportH: number): number {
    const d = this.win.document;
    const els = d.body ? Array.from(d.body.querySelectorAll<HTMLElement>('*')) : [];

    frame.setAttribute('width', String(width));
    frame.setAttribute('height', String(viewportH));

    const before = els.map(e => e.getBoundingClientRect().height);
    const was = els.map(e => {
      const cs = this.win.getComputedStyle(e);

      return [cs.height, cs.paddingTop, cs.paddingBottom, cs.marginTop, cs.marginBottom];
    });

    frame.setAttribute('height', String(Math.max(viewportH, this.docHeight())));
    els
      .map((e, i) => (Math.abs(e.getBoundingClientRect().height - before[i]) >= 0.5 ? i : -1))
      .filter(i => i >= 0)
      .forEach(i => {
        const [h, pt, pb, mt, mb] = was[i];
        const s = els[i].style;

        s.setProperty('height', h, 'important');
        s.setProperty('min-height', h, 'important');
        s.setProperty('max-height', h, 'important');
        s.setProperty('padding-top', pt, 'important');
        s.setProperty('padding-bottom', pb, 'important');
        s.setProperty('margin-top', mt, 'important');
        s.setProperty('margin-bottom', mb, 'important');
      });
    // Back at the recorded viewport, the height measured is the page's own and not the frame's.
    frame.setAttribute('height', String(viewportH));

    const full = this.docHeight();

    frame.setAttribute('height', String(full));

    return full;
  }

  /** The full height of the drawn page. */
  docHeight(): number {
    const d = this.win.document;

    return Math.max(d.body?.scrollHeight ?? 0, d.documentElement?.scrollHeight ?? 0);
  }

  private options() {
    return {
      version: this.version,
      dom: this.dom,
      useproxy: makeUseproxy(this.src.pageUrl, this.src.assets, window.location.origin),
      onresize: this.src.onresize,
      pointer: true,
      mobile: this.src.mobile,
      logerror: () => undefined,
    };
  }
}
