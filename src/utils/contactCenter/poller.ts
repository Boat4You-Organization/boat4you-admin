/* Contact Center (P2) short polling. cusma2 is the only API node, so a poll never overlaps itself and never runs in a
 * hidden tab. No runtime imports: `yarn test` runs this file with Node's own type stripping. */

export interface PollerDeps {
  isVisible(): boolean;
  setTimer(cb: () => void, ms: number): unknown;
  clearTimer(t: unknown): void;
}

const browserDeps: PollerDeps = {
  isVisible: () => typeof document === 'undefined' || document.visibilityState === 'visible',
  setTimer: (cb, ms) => window.setTimeout(cb, ms),
  clearTimer: t => window.clearTimeout(t as number),
};

export interface Poller {
  start(): void;
  stop(): void;
  /** A new round now (after the one in flight, if any). */
  poke(): void;
}

class LoopPoller implements Poller {
  private timer: unknown = null;

  private running = false;

  private again = false;

  private stopped = true;

  private readonly fn: () => Promise<unknown>;

  private readonly intervalMs: number;

  private readonly deps: PollerDeps;

  constructor(fn: () => Promise<unknown>, intervalMs: number, deps: PollerDeps) {
    this.fn = fn;
    this.intervalMs = intervalMs;
    this.deps = deps;
  }

  start(): void {
    if (!this.stopped) return;

    this.stopped = false;
    this.run();
  }

  stop(): void {
    this.stopped = true;
    this.again = false;
    this.cancel();
  }

  poke(): void {
    if (this.stopped) return;

    this.cancel();
    this.run();
  }

  private run(): void {
    this.tick().catch(() => undefined);
  }

  private cancel(): void {
    if (this.timer != null) this.deps.clearTimer(this.timer);

    this.timer = null;
  }

  private schedule(): void {
    this.cancel();

    if (!this.stopped) this.timer = this.deps.setTimer(() => this.run(), this.intervalMs);
  }

  private async tick(): Promise<void> {
    this.timer = null;

    if (this.stopped) return;

    if (this.running) {
      this.again = true;

      return;
    }

    if (!this.deps.isVisible()) {
      this.schedule();

      return;
    }

    this.running = true;
    try {
      await this.fn();
    } catch {
      // the caller shows its own error; the next round tries again
    } finally {
      this.running = false;
    }

    if (this.again && !this.stopped) {
      this.again = false;
      this.run();

      return;
    }

    this.schedule();
  }
}

/** Runs [fn] now and every [intervalMs] while the document is visible; a round never starts while the previous one runs. */
export function createPoller(fn: () => Promise<unknown>, intervalMs: number, deps: PollerDeps = browserDeps): Poller {
  return new LoopPoller(fn, intervalMs, deps);
}
