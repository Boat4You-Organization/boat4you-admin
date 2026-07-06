# boat4you-admin — deploy notes

## 2026-07-06 — Agencies: "Inquiry mode" checkbox (cc9b0f7, DEPLOYED)

New Controller checkbox in the agency edit modal GeneralTab, right of "Recommended"
(`name="inquiryOnly"`, label `form.agency.inquiryOnly` = "Inquiry mode" / "Samo upit").
Threaded through `AgencyModel.inquiryOnly`, defaultValues + initialValues in
UpdateAgencyModal, and the existing `updateAgency` PUT (`{ id, ...formValues }` → backend
`AgencyDto.inquiryOnly`). ON = that agency's yachts become inquiry-only (no direct booking,
like custom boats); see backend DEPLOY_NOTES same date. Build: `.env.production.local`
(api.boat4you.com + www.boat4you.com) → `yarn build` → tar → cusma1
`/var/www/admin.boat4you.com/html` (entry `index-DZLf54rx.js`, 0× localhost). Rollback `html.old`.

## ✅ FIXED 2026-07-03 — builds MUST set VITE_CUSTOMER_WEB_URL (localhost links incident)

The 2026-07-02/03 deploys (travel documents, c427f6b) were built with only
`VITE_BOAT_API_URL` — so the `http://localhost:3000` fallback got baked into
every admin → customer-site link (Offers "More info", booking preview,
inquiries). Offers e-mailed to customers during ~01:00–16:30 on 3.7. carry
dead localhost links permanently; Mario re-sends those. Fixed by rebuilding
with BOTH vars (`VITE_CUSTOMER_WEB_URL=https://www.boat4you.com`) and
redeploying — live chunk verified 0×localhost. Rule going forward: after every
build run `grep -r "localhost:3000" dist/assets | wc -l` → must be 0 before
the dist leaves the machine. README_PROD env section updated accordingly.

## ✅ DEPLOYED 2026-06-22 — offer share-link carries charter dates + currency

Commit `dd2f6bd`, live entry `index-BE8VBeEP.js` (verified: entry-hash match +
served Offers chunk contains the `startDate=` link logic, `/offers` 200).
Bug: WhatsApp/email boat link was dateless → client saw the page's default
price (8000 €) not the offered week (4000 €). Fix: `withOfferDates()` in
`offerHtml.ts` appends `?startDate&endDate&currency` to the WhatsApp link +
HTML title/More-info button (idempotent → also repairs carts already saved in
localStorage); `Offers.tsx` stamps the stored `detailUrl` + admin preview.
Deployed with cusma1 pass `Nikairis2019cusma1` (the old `ccCCuuUU1!` is dead).
Rollback: `html.old` on cusma1.

## ✅ DEPLOYED (live, verified 2026-06-22) — security hardening (audit S-002: JWT in localStorage + no CSP/X-Frame)

Both parts confirmed LIVE on admin.boat4you.com: part A (in-memory token) has
been in every build since the 14.6 currency deploy (commit `1f8de9f` is an
ancestor of the deployed `bdae904`); part B nginx headers verified on the live
response (`content-security-policy`, `x-frame-options: DENY`, `x-content-type-
options`, `referrer-policy`, `strict-transport-security` all present). The
"PENDING" status below was stale — kept for the CSP rationale + nginx recipe.

### (reference) security-hardening detail — audit S-002

Two-part fix for the audit HIGH "admin holds JWT in localStorage + admin has no
CSP/X-Frame". No API/routing/logic change, no new deps, no env change.

**A. Frontend (this build) — JWT out of web storage → in-memory.**
New `src/config/tokenStore.ts` holds the token in a module variable; `setToken`
(auth.actions) is the single writer keeping the valtio store + holder in sync.
`axios.config` (getTokenData/save/clear), `constants.authHeaders`, `auth.store`
init, and `useAuth` now read/write the holder instead of `localStorage`. Dead
`AuthKeys` enum removed. Trade-off: a hard reload / new tab / browser restart
clears the token → re-login (acceptable for internal admin; in-app router nav +
refresh-token flow keep the session alive while the tab stays open).
Verified locally: built `dist/` served with the prod CSP below → SPA boots, login
renders, **0 CSP violations**, `api.boat4you.com` baked (18×, 0× localhost).

**B. nginx (cusma1, `admin.boat4you.com` server block) — security headers.**
Add at **server** level (and re-add in any `location` that has its own
`add_header`, since nginx does NOT inherit add_header into such blocks):

```nginx
server_tokens off;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https:; frame-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```
CSP rationale (verified against the build): only one external module script
(`script-src 'self'`, no inline/eval/wasm), MUI/emotion inline styles
(`style-src 'unsafe-inline'`), @react-pdf worker (`worker-src blob:`) + blob
image-preview (`img-src blob:`), partner yacht photos (`img-src https:`),
api+font/file fetches (`connect-src https:`). Deploy: `nginx -t` → `systemctl reload nginx`.

Deploy recipe (per below): local `yarn build` → tar `dist/` → scp cusma1 →
sudo swap into `/var/www/admin.boat4you.com/html` (strip `._*`). Rollback `html.old`.

## ✅ DEPLOYED 2026-06-10 ~18:30 — /offers Broker Desk re-skin

Commit `b472d41` + clunkiness fixups after Mario's live review (compact filter
pills, branded EmptyState instead of stock Alerts, cart CTA hugs content —
live entry `index-CpZhWYjN.js`). Design-only: bb tokens (navy/yellow CTAs,
soft state-tinted cards, amber commission pills, de-indigo'd chips).
Rollback: `html.old` on cusma1.

## ✅ DEPLOYED 2026-06-10 ~18:00 — visual polish "Polirani Broker Desk"

Live on admin.boat4you.com (entry `index-BMlyh7nZ.js`, verified: AuthShell chunk
200 + new tagline served, `api.boat4you.com` baked, 0× localhost). Rollback copy
on cusma1: `/var/www/admin.boat4you.com/html.old`. Recipe used: local
`yarn build` (picks `.env.production.local`), tar dist → scp cusma1 →
sudo swap into `/var/www/admin.boat4you.com/html` (strip macOS `._*` first).

## Original pending-deploy notes (2026-06-10) — visual polish "Polirani Broker Desk"

Commits `3019f4e..646fe1f` on `main` (pushed). Styling only — no API/routing/logic
changes, no new dependencies, no env changes.

- `src/styles/bb.ts`: warmer page bg (#f4f6f8), card radius 14, soft card shadow,
  `bbCardSx`/`bbAuthTitleSx` helpers.
- Dashboard: KPI icon chips, soft cards, blue rounded chart bars, roomier table.
- New `AuthShell` (navy/yellow split) used by Login, ForgotPassword, ResetPassword,
  SignUp; old sketch + Raleway-italic hero removed; Chrome autofill yellow fix.

Deploy = standard SPA build per `README_PROD.md` (build with prod `.env`, upload
`dist/` to cusma1 `/var/www/admin.boat4you.com/html`).

~~⚠️ `yarn build` (tsc step) fails on 10 pre-existing TS errors~~ — **FIXED same day**:
`PickersDayProps` is non-generic in x-date-pickers v8 (DateRangeField) and
`variant="caption"` is type-disabled repo-wide (typings.d.ts) — those usages now
carry equivalent `captionSx` (MUI default caption metrics, render unchanged).
`yarn build` passes clean again.
