// In-memory auth-token holder. Replaces localStorage so the admin JWT
// (access + refresh) never lives in web storage that an XSS could read and
// exfiltrate (S-002). The token sits only in the JS heap of the running tab.
//
// Trade-off: a hard reload / new tab / browser restart clears it, forcing a
// re-login. That's acceptable for an internal admin — in-app (client-side
// router) navigation keeps the heap alive, and the axios refresh-token flow
// renews the access token across expiry while the tab stays open.
//
// Kept dependency-free so every reader (axios.config, constants.authHeaders,
// auth.store, auth.actions) can import it without an import cycle.

let token: string | null = null;

export const getStoredToken = (): string | null => token;

export const setStoredToken = (value: string | null): void => {
  token = value;
};
