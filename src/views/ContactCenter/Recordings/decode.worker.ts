/* Decodes a recording off the main thread (P6 R2): its lines in, the decoded payloads out; a line that does not decode is left
 * out rather than failing the whole recording. */
import { decode } from 'clarity-decode';

// eslint-disable-next-line no-undef -- the worker's own global scope
const scope = globalThis as unknown as {
  onmessage: ((e: MessageEvent<string[]>) => void) | null;
  postMessage: (data: unknown) => void;
};

scope.onmessage = e => {
  const decoded = e.data.flatMap(line => {
    try {
      return [decode(line)];
    } catch {
      return [];
    }
  });

  scope.postMessage(decoded);
};
