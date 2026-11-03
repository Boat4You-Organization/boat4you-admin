/* The replay of one recorded page view (P6 R2) on clarity-visualize 0.8.73, the version the recorder is pinned to. setup()
 * draws the first DOM into the iframe, render() applies events; a seek back is a fresh setup plus every event up to the target
 * (P0 S11), a seek forward only renders the events in between. The iframe is sandboxed without scripts (allow-same-origin only), so nothing recorded can run. */
import { Data } from 'clarity-decode';
import { Visualizer } from 'clarity-visualize';

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
