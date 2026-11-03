// Auth-token holder (access + refresh JSON), kept in localStorage so a reload,
// a new tab or a browser restart keeps the admin signed in (Mario 3.11.2026:
// refresh logged him out every time). This reverses the in-memory-only choice
// of S-002: an XSS on the admin origin could now read the tokens. The session
// still ends when the backend refresh token expires (security.jwt.refresh-token
// .expiration, 3 days from login) — the axios interceptor then sends the user
// to /login — or on Log out, which clears the key.
//
// Kept dependency-free so every reader (axios.config, constants.authHeaders,
// auth.store, auth.actions) can import it without an import cycle.

const KEY = 'b4y-admin-auth';

let token: string | null = null;

try {
  token = window.localStorage.getItem(KEY);
} catch {
  token = null;
}

export const getStoredToken = (): string | null => token;

export const setStoredToken = (value: string | null): void => {
  token = value;

  try {
    if (value) window.localStorage.setItem(KEY, value);
    else window.localStorage.removeItem(KEY);
  } catch {
    // Storage blocked (private mode): the session lives in memory only, as before.
  }
};
