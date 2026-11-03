/* The replay of one recorded page view (P6 R2) on clarity-visualize 0.8.73, the version the recorder is pinned to. setup()
 * draws the first DOM into the iframe, render() applies events; a seek back is a fresh setup plus every event up to the target
 * (P0 S11), a seek forward only renders the events in between. The iframe is sandboxed without scripts (allow-same-origin only), so nothing recorded can run. */
import { Data } from 'clarity-decode';
import { Visualizer } from 'clarity-visualize';

import { ActivityElement, ScrollMapStep } from '@/utils/contactCenter/heatmap';
import { eventsBetween, makeUseproxy } from '@/utils/contactCenter/replay';

type Event = Data.DecodedEvent;

const RESIZE = 11; // clarity Data.Event.Resize: { width, height }

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

  /** The click heatmap (P6 R3) over the drawn page; an earlier map is cleared first. */
  clickmap(activity: ActivityElement[]): void {
    this.v.clearmap();
    this.v.clickmap(activity as unknown as Parameters<Visualizer['clickmap']>[0]);
  }

  /** The scroll heatmap with the average fold at [foldPx] and the 75/50/25 % markers. */
  scrollmap(steps: ScrollMapStep[], foldPx: number): void {
    this.v.clearmap();
    this.v.scrollmap(steps as unknown as Parameters<Visualizer['scrollmap']>[0], foldPx, true);
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
