# boat4you-admin — deploy notes

## 2026-10-06 — Offers: the partner's own capacity (cabins, berths, WC, people, notes, sails, engine) in the card, client offer, WhatsApp and reservation picker (9d3edc1 + review fix 4c9f299) — ✅ DEPLOYANO 7.10.2026 (live bce0dfb; backend gate prošao)

Why: Mario (6.10.) — cabins / berths / layout exactly as MMK and NauSys send them on every surface, so a client never has to ask (capacity contract v1, 6.10.2026). The admin showed a different subset of the same figures on each surface: the Offers card cabins + "Pax", the client e-mail cabins + berths + WC and "rolling mainsail" for full-batten boats (Jangada 11399: "Pax 12" in admin, "10 berths" in the e-mail), CreateReservationModal no berths.

What:

- `9d3edc1`: the shared formatter `src/utils/yachtCapacity.ts` (byte-identical to the contract copy and b4y; prettier-ignored and 5 eslint style rules off so it stays identical), the EN `capacity` messages, `yachtCapacityEn.ts`.
  - Offers card: pills in the compact form (cabins, NauSys crew cabins, berths with the short note / split, WC, crew WC, max. people, crew only for crewed charters) + L + Year. The admin-only `brokerNotes` (raw partner notes + the partner's internal remark) sit behind an info icon only — never in the cart, the client e-mail or WhatsApp.
  - Cart: capacity, rig, maxPersons, crewNumber, charterType and the custom-yacht engine fields from the public detail (notes already sanitized by the backend); carts saved before are topped up when the offer modal opens (the paymentType pattern).
  - Client e-mail: specs line vessel · year · length, then the full capacity line and the mainsail / headsail / engine / draught line. `humanizeMainsail` is gone (the flat enum is a filter value). Hero `?width=800` untouched. WhatsApp: the compact chips. CreateReservationModal: the compact chips.
  - Until the backend sends `capacity` / `rig`: the flat cabins / berths / wc / maxPersons / crewNumber, numbers only, no sail, no partner engine.
- `4c9f299` (review): an entry stored with `capacity: null` (added or topped up while the backend did not send the block) is now topped up too (`== null`, was `=== undefined`), so such a cart gets the notes and the sail / engine line once the backend is live. The public detail always carries the block from then on, so it is fetched at most once more per entry.
- Untouched: price and extras logic (no admin price code reads `maxPersons`; prices / extras stay snapshotted at add time), the hero width, the inquiry templates.

Verified:

- Formatter byte-identical in contract / b4y / admin (sha256 `502365cc08c9…`); contract `node --test` 22/22; the 7 reference boats' rows and chips equal `reference_boats.json`; live detail payloads 8351 / 11399 / 1161 and a live search page through the formatter: no `null` / `NaN` / `undefined`.
- Independent review (6.10.): `brokerNotes` only in the search-row tooltip; the cart is built from explicit fields (no `...row` spread); `offerHtml` never reads it; old-cart top-up keeps the broker's extras; `maxPersons` in no price code; no `cabins*2+2`, "certified", "with shower" or "bathrooms" in live code.
- `tsc` 0; eslint 0 errors (Offers.tsx keeps its 3 pre-existing warnings); vite build OK at `9d3edc1`; `4c9f299` = one comparison, tsc + eslint re-run.
- Not yet seen in a real browser: the card pills and the info-icon tooltip — check on the first admin session after the deploy.

**REQUIRED DEPLOY ORDER (the whole capacity release):**

1. **Backend cusma2** (`c374579`…`a96efe8` + its review fixes): hand-apply the idempotent `V9_72__yacht_partner_capacity.sql` as `boat4you_owner` first (a second run returns at the column guard without a lock), then the jar + restart — outside ALL sync slots (server time, UTC): MMK availability 08:40 / 12:40 / 16:40 / 20:40 (~17 min each), MMK near-term 10:50 / 16:50, MMK full 06:00–07:30, NauSys availability 10:20 / 16:20 / 22:20, NauSys near-term 10:40 / 16:40, NauSys nightly 23:20 → ~06:00, NauSys search-retry drain every 15 min, matview refresh every 10 min (an ALTER competes with it).
2. **Backend cusma3** (scheduler), hard gate in the same script: `n=$(journalctl --since '10 minutes ago' | grep -ci 'nausys\|mmk'); [ "$n" -gt 0 ] && { echo ABORT; exit 1; }`.
3. **Wait one full sync cycle on the new jar:** NauSys (23:20) and MMK (06:10). Until the first NauSys sync the API serves crew WC from the old, buggy `crew_wc` — no frontend before step 4.
4. **Gate SQL** (read-only, contract §4) must pass:

   ```sql
   WITH s AS (SELECT y.*, em.external_system_id AS sys
                FROM yacht y JOIN external_mapping em ON em.system_id = y.id AND em.type = 'Yacht'
               WHERE y.sys_active)
   SELECT sys,                                                         -- 1 = MMK, 2 = NauSys
          count(*)                                                       AS active,
          count(*) FILTER (WHERE sys = 2 AND salon_berths IS NULL)       AS ns_salon_null,     -- expect ~0
          count(*) FILTER (WHERE sys = 2 AND wc > 0 AND crew_wc = wc)    AS ns_crew_wc_eq_wc,  -- was ~7.6k, expect small
          count(*) FILTER (WHERE sys = 1 AND mainsail_label IS NULL)     AS mmk_mainsail_null, -- expect ~0
          count(*) FILTER (WHERE sys = 1 AND berths_note IS NOT NULL)    AS mmk_berths_note,   -- expect 40-50 %
          count(*) FILTER (WHERE mainsail_type = 'ROLLING_SAIL')         AS rolling,           -- furling only now
          count(*) FILTER (WHERE mainsail_type = 'CLASSIC_SAIL')         AS classic
     FROM s GROUP BY sys;
   ```

   plus the contract's two follow-ups (NauSys agencies with `salon_berths IS NULL`; `mainsail_label` values = EN / no-language labels only).

5. **Admin** (this entry) → 6. **b4y** (`2183ac26f`, `6cc0d6e4e`, `c0071d987`) → 7. **the 6 sisters** → 8. **later, only once b4y and the 6 sisters render the new blocks:** migration B8 (`B8_trigger_later.sql`, today only in the session scratchpad `capacity/contract/` — it must become a backend `V9_<next>` migration first). It stamps `yacht_content_modified` for ~13.6k active boats → sitemap `<lastmod>` recrawl wave; tell Mario / GSC monitoring.

Deploy (admin, as before): `.env.production.local` → `npx vite build` → tar → cusma1 `html.staging` → checks (index.html, 0× `localhost:8443`, entry hash, Offers chunk contains `Crew WC` from the capacity messages) → backup → `mv html html.prev` → `mv html.staging html` → chown www-data. After the deploy: log in again once (a stale token = anonymous = no `brokerNotes`).

Rollback: `git revert 4c9f299 9d3edc1` + redeploy, or the `html.prev` swap. Carts saved by the new build carry extra fields the old build ignores.

## 2026-09-29 — Offers: a renamed partner charge is listed once in the client offer (4d3fa3f, DEPLOYED 10:21 UTC, `index-DpT16WrA.js`)

Why: Mario — the client offer for Fico - Premium line (13311, 11–18.9.2027) listed "Premium Line Pack" twice (old and new partner name, same MMK id; the catalogue has the new name, an older offer the old one).
What: cart key stays `e.key` → labelCode → name-price (NOT `externalId`: NauSys obligatory offer rows carry synthetic per-offer ids and keying on it splits catalogue/offer twins). New: an offer row whose partner id equals a catalogue row's partner id under a different key drops that catalogue row (unless another offer row owns that key), keeping its description when the offer row has none — the same identity `PriceCalculationService.mergeYachtAndOfferExtras` uses for the price. `externalId` reaches the admin only (backend 1d0ac4a serves it to SYSTEM_ADMIN, as a string); this build had to go live BEFORE that backend.
Notes: re-login once after the deploy (a stale token = anonymous = no id = old behaviour); re-add yachts already in a saved cart (localStorage carts are not re-merged).

## 2026-09-26 — Offers: client e-mail + WhatsApp split obligatory services by how they are paid (81865f7, DEPLOYED 18:38 UTC, `index-Be7e2_Ua.js`)

Why: since 26.9. the backend charges obligatory extras the partner bills with the booking (MMK payableInBase=false, NauSys ADVANCE_PAYMENT → `paymentType` WITH_BOOKING) online with the charter, on the same payment schedule; the e-mail still called every obligatory service "payable separately" with a "total on arrival" (Mario: "popravi").
What: `CartExtra.paymentType` from the backend DTO (checkout fallback for unclassified rows); card groups "Paid with your booking" (price box: + services · paid with booking, = total payable with booking) and "Other services" (payable separately, = total charter cost) — or exactly the old wording when a yacht has no such rows; deposit-only → "At the marina". WhatsApp mirrors it, list-price strike moved into the charter part. Offer rows kept one per partner charge (`key#offerExtraId`; supersede removes only catalogue twins) so Skipper + "Skipper's liability insurance" both show, as the checkout charges both (backend f467270). Per-week services paid with booking count whole weeks (checkout rule). Skipper toggle ignores insurance/surcharge rows. Carts saved before today get paymentType topped up when the offer modal opens.
Verified: local render of 5 carts (Elda fixed part + port tax; marina-only unchanged; Skipper + insurance; 10-night per-week; pre-change cart unchanged) and WhatsApp text; lint 0 errors, tsc 0; live chunk carries the new wording.

## 2026-09-24 — Offers: fluid two-column client offer card + closing block (ae51e8c, DEPLOYED)

Why: the offer HTML is copy-pasted into Apple Mail, which strips `<style>`, so the media-query
layout never reached clients — on a phone the price card sat off-screen right. Gmail clips mails
over 102 KB; a 12-yacht offer was 155 KB as sent (36 % of all offers in 90 days were clipped).

`offerHtml.ts` only. Fluid-hybrid columns (`display:inline-block; width:100%; max-width`) sit side
by side at 640 px (photo | text, services | price) and stack on phones, no `<style>` at all.
Compact card (numbered title, one specs line, one amenities line, one-line descriptions, total on
arrival + deposit line, full-width "View & book online" button), ~5.9 KB per yacht (12 yachts =
70 KB raw). Mainsail enum humanised (was `ROLLING_SAIL` / `UNKNOWN` in client mails). One "Route
ideas" line per offer. Closing block appended to the copied HTML: HOLD next-step box
(`HOLD_OPTION_HOURS = 72`) + trust line; no greeting/signature (Apple Mail adds them). Hero photo
stays `?width=800` (cached by the customer web; a new width = fresh resize per photo = 503 risk).
Money logic, WhatsApp variant and exports unchanged. Renders + harness in
`boat4you-delivery/_offer-email-audit-2026-09-23/render/`.

Deploy: `.env.production.local` → `npx vite build` → tar → cusma1 `html.staging` → checks
(index.html, 0× localhost:8443, entry hash) → backup → `mv html html.prev` → `mv html.staging html`
→ chown www-data. Live entry `index-D_gV8az9.js`, Offers chunk `index-CV80kwCq.js` (contains
"non-binding option", no `b4y-price-col`), root + `/offers` 200. Rollback: `html.prev` (= `cd1c807`
build, entry `index-B6VneYFF.js`) or `/home/cusma1/admin-dist.bak-offercard-20260924-062734.tar.gz`.

Gotchas this time: (1) `grep -o … | wc -l` still aborts under `pipefail` when grep finds nothing —
wrap as `(… | grep … || true) | wc -l`; (2) `sudo -S` over ssh needs the password WITH a trailing
newline (`printf '%s\n'`), a bare file redirect hung silently; (3) never pass a remote script as
`ssh host "sudo bash -c \"…$(…)…\""` — the login shell expands `$()` locally in $HOME; upload the
script with scp and run `sudo -S bash /tmp/script.sh` instead.

### 2026-09-24 addendum — fixed px columns (91bbe33, DEPLOYED 07:2x UTC)

Mario's first real send (08:52 local, 1 yacht, 41 KB total of which 24 KB is his signature; the
card itself 6.4 KB = almost no Apple Mail bloat) proved the layout survives the paste, but Apple
Mail **bakes computed widths**: `width:100%; max-width:360px` was sent as `width:360px`, so on a
375 px phone the services column overflowed and clipped the right edge. Percentages die on paste,
`max-width:100%` survives. Columns are now `width:Npx; max-width:100%`, all N ≤ 300 (photo 266 |
text 300, services 300 | price 290). Live entry `index-DSc-DOwS.js`, Offers chunk
`index-CmDSS8rI.js`. Rollback `html.prev` = `ae51e8c` build (`index-D_gV8az9.js`).
Sent-mail evidence: `boat4you-delivery/_offer-email-audit-2026-09-23/mail_new/1002138.html`.

### 2026-09-24 addendum 2 — route-ideas line names every marina (2a25441, DEPLOYED ~07:50 UTC)

Mario: a 4-yacht Ionian offer showed "Route ideas for your week: Preveza Marina | Preveza" only.
All four (Preveza ×2, Lefkas ×2) resolve to `/itineraries/ionian`, and the single link carried the
first yacht's marina as label. Now grouped by area: area label ("Ionian Islands", "Šibenik", else
title-cased slug) + every distinct marina in the offer, max 5 areas × 4 marinas. Live entry
`index-Der3kZrn.js`, Offers chunk `index-DoGIfGnw.js`. Rollback `html.prev` = `91bbe33` build
(`index-DSc-DOwS.js`).

## 2026-09-22 — Offers: Prev/Next scrolls the middle panel back to the top (5b67fb9, DEPLOYED)

`handlePageChange` called `window.scrollTo({ top: 0 })`, but `<main>` in `Layout` is the only
scroll container (`height: 100vh; overflow-y: scroll` in `Layout.module.scss`) and the document
body never scrolls, so the call was a silent no-op — after "Next" the broker stayed at the old
offset and saw row ~45 of the new page instead of row 1. Now
`document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })`; one line in
`Offers.tsx`, no other files, thumbnail component untouched.

Build `.env.production.local` (api.boat4you.com + www.boat4you.com) → `yarn build` → tar →
cusma1 staged swap (`html.staging` → verify entry + Offers chunk + 0× localhost:8443 → `mv`) →
chown www-data. Live entry `index-Dnbuel49.js`, Offers chunk `index-ZzXkXxDu.js` (served copy
contains `querySelector("main")`), root + `/offers` 200. Rollback: `html.prev` (= this morning's
thumbnail build `9009e17`, entry `index-Cy24pJtS.js`), backup
`/home/cusma1/admin-dist.bak-scrollfix-20260922-0843.tar.gz`.

Deploy-script gotcha: under `set -e`, `grep -c` exits 1 when it finds 0 matches — the
"0× localhost" check itself aborted the first run right before the swap (staging was left in
place, live untouched, second run finished it). Count via `grep -o … | wc -l` or add `|| true`.
`html.prev` must be removed before `mv html html.prev`, otherwise `mv` nests it inside.

## 2026-09-13 — Users: resend the sign-up invite (9959473, DEPLOYED)

Mario: a client paid through the booking flow but never registered, and there was no way
to get them back in — the invite is sent once, automatically, and its link dies after 7 days.

Users list, action column: a **Send invite** / **Resend invite** link on every row whose
`inviteStatus` is not `ACCEPTED` (accepted users already have a password and the backend
rejects them). Confirm dialog with the recipient's address first — it puts an e-mail in a
customer's inbox. While one send is in flight the row shows "Sending…" and the other rows dim;
on success the list reloads so the status pill flips to Invited. Toast reuses the existing
`toast-messages.invite-user-*` keys. New `actions.*` labels in en + hr, `resources.d.ts`
regenerated (`yarn i18next-resources-for-ts`).

`UsersService.inviteUser(ids, forceEnglish?)` now appends the query param; the list passes
`false` so a paying guest gets the mail in the language they booked in. Backend side is
`9401056` + `75e1e81` (see backend notes) — the endpoint already regenerated code +
timestamp on every call, which is what revives an expired link.

Build `.env.production.local` (api.boat4you.com + www.boat4you.com) → `yarn build` → tar →
cusma1 staged swap (`html.staging` → verify `index.html` + asset hash → `mv`) → chown www-data.
Live entry `index-BCnXL1SW.js`, 0× localhost:8443, root + `/users` 200. Rollback: `html.prev`,
backup `/home/cusma1/admin-dist.bak-resend-invite-20260913-192124.tar.gz`.

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
