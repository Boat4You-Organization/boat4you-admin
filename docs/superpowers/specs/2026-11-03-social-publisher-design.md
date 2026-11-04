# Objave — our own social publisher (one post → many channels, scheduled, automatable)

Date: 2026-11-03 · Requested by Mario („alat s kojim ćemo moći objavljivati jednu objavu na više kanala, a s vremenom
da Claude dnevno objavljuje preko Scheduled … sve inhouse i da ne plaćamo nikome“).

Status: **S0 (admin UI + this contract) is in boat4you-admin. The backend part (S1–S2) is not built yet** — the admin
page answers with errors until `/admin/social/**` exists.

## Update 3.11.2026 (Mario): one channel set per site, AI daily posts, Higgsfield

> „Svaki web ima svoj Facebook, Instagram i TikTok; YouTube jedan za sve. Mora biti samostalno objavljivanje, AI mora
> raditi dnevne objave uz Higgsfield i slike koje već imamo, cijeli centar za sve društvene mreže.“

What changed against the sections below (all built in S1, backend branch `claude/blissful-wright-sn6a9f`):

- **Sites.** Every channel has a `site` (Contact Center site id; `null` = shared, our one YouTube). One Meta login brings
  every page we manage and each page's Instagram; a channel gets the site its name points to and can be moved on the
  Kanali tab (`PATCH /admin/social/accounts/{id} {site}`). Kanali shows a site × network overview; Nova objava groups
  channels by site with "Odaberi sve" per site; Objave filters by site (`GET /admin/social/posts?site=`).
- **AI dnevne objave** (new tab, `/admin/social/ai`): per site on/off, publish time (Europe/Zagreb), language, channels,
  "wait for my approval" (default) or schedule by itself, Higgsfield video on/off, notes for the AI; "Napravi sada";
  latest runs. Backend: 3 h before the time, pick a boat of the site's fleet (`/public/yachts`, country + boat types of
  the site from BrandRegistry, not featured for 60 days), our photos (`/public/image/{id}`), Claude writes a text per
  network (structured output; never prices or invented facts), post as DRAFT or SCHEDULED. With video: Higgsfield
  image → 9:16 video from the best photo, a second post for TikTok + YouTube when it is ready.
- **Higgsfield** over its HTTP API (`Authorization: Key id:secret`, model path and status path are configuration);
  docs.higgsfield.ai was not reachable from the build session, so the paths must be checked when the account is set up.
- **Media upload is the raw file as the body** (`POST /admin/social/media?fileName=`, Content-Type = the file's type), not
  multipart: the server's multipart limit is 10 MB and videos are up to 500 MB.
- **Lists are Spring `PagedModel`**: `{content, page: {size, number, totalElements, totalPages}}`.
- `GET /admin/social/platforms` says which networks this server can connect (missing app keys → the reason).
- Connectors in S1: Facebook, Instagram, TikTok, YouTube, Threads, LinkedIn, Bluesky. X, Pinterest, Google Business:
  later (the admin shows "not available yet").

## Goal

One place in the Broker Desk admin to:

1. write a post once (text, photos or a video, optional link),
2. pick the channels (our Facebook pages, Instagram, Threads, LinkedIn, X, TikTok, YouTube, Pinterest, Bluesky,
   Google Business Profile), optionally with a different text/title per channel,
3. publish now or schedule it, see it on a calendar, see per channel whether it went out (link) or failed (the
   network's error, retry),
4. let a scheduled Claude task prepare a post every day through an API key (drafts only until we trust it).

No paid middleman (Blotato, Buffer, Hootsuite, Ayrshare…): the backend talks to each network's **official API**
with our own developer apps. The only network that may cost money is X (its API write pricing).

## Non-goals (for now)

- Copying Blotato's site, code or design. We build the same _kind_ of tool (multi-channel scheduler + API) on public,
  documented APIs, in our own admin's look. The REA reverse-engineering tool is not needed for this and was not used.
- Built-in AI generation of images/videos, "viral post database", analytics dashboards: later phases (S4) if wanted.
  Writing the text is done by Claude in the scheduled task (S3), not by a model inside the backend.
- Comments/DM inbox for social networks (the Contact Center stays the place for conversations).

## Phases

| Phase         | What                                                                                                                                                                                       | Where                             |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| **S0**        | Admin: Objave page (posts calendar/list, composer with per-channel checks and preview, channels, automation keys), types, API client, rules + tests, this spec                             | boat4you-admin (this PR)          |
| **S1**        | Backend core: tables, media storage, posts CRUD, scheduler with node-safe locking, OAuth framework, token encryption; connectors **Facebook Pages, Instagram, Threads, LinkedIn, Bluesky** | boat4you-backend                  |
| **S2**        | Connectors **X, YouTube, TikTok, Pinterest, Google Business Profile**; token refresh job; nginx body limit for video                                                                       | boat4you-backend, infra           |
| **S3**        | Public automation API (`/api/social/v1`) + the daily Claude scheduled task (drafts only first)                                                                                             | backend + a Claude scheduled task |
| S4 (optional) | Repurpose a URL/YouTube video into posts, AI images (e.g. boat photo + text overlay), per-post insights                                                                                    | later                             |

## Platforms (checked 3.11.2026 against public docs; re-check when implementing — rules change)

| Network                      | API / auth                                                                        | What we must set up                                                                                                                                                         | Text                                                 | Media                                                                                                 | Gotchas                                                                                                                                                                                                                                                  |
| ---------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Facebook Page                | Graph API, Facebook Login (OAuth2) → Page access tokens                           | Meta app (Business type), `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`; app Live mode; Business verification may be asked                               | 63,206                                               | photos (multi-photo via `attached_media`) **or** 1 video                                              | Page tokens from a long-lived user token do not expire; one connect can return several pages → one `social_account` per page                                                                                                                             |
| Instagram (Business/Creator) | Graph API (Instagram API with Facebook Login or Instagram Login)                  | same Meta app, `instagram_basic` + `instagram_content_publish` (or `instagram_business_*`)                                                                                  | 2,200, ≤30 hashtags                                  | **required**; 1 photo/video/Reel or carousel 2–10 (mixed ok); photos **JPEG only**, aspect 4:5–1.91:1 | Two-step: create container (media must be on a **public https URL**) → poll status for video → `media_publish`; ~50–100 API posts / 24 h (`content_publishing_limit`); links in captions not clickable                                                   |
| Threads                      | Threads API (OAuth via Meta)                                                      | `threads_basic`, `threads_content_publish`                                                                                                                                  | 500                                                  | text-only ok; up to 20 in a carousel                                                                  | Same container → publish pattern, 250 posts / 24 h                                                                                                                                                                                                       |
| LinkedIn                     | Posts API (OAuth2)                                                                | LinkedIn app; personal: "Share on LinkedIn" (`w_member_social`, self-serve); **company page: Community Management API (`w_organization_social`) needs LinkedIn's approval** | 3,000                                                | up to 20 photos **or** 1 video                                                                        | Images/videos uploaded first (`initializeUpload`), then referenced by URN; access token 60 days (refresh tokens only for approved apps) → reconnect reminder                                                                                             |
| X                            | API v2 (OAuth 2.0 PKCE, `tweet.write users.read offline.access`, media upload v2) | X developer account + app                                                                                                                                                   | 280 weighted (link = 23)                             | ≤4 photos **or** 1 video                                                                              | **Writing through the API is metered/paid per X's current plan** — the only network where "free" may not hold; check developer.x.com before S2                                                                                                           |
| TikTok                       | Content Posting API (OAuth2 `video.publish`, `video.upload`)                      | TikTok developer app; **audit** for public posts                                                                                                                            | 2,200                                                | 1 video **or** photo post (≤35)                                                                       | Until the audit passes posts are `SELF_ONLY` (private) — the admin shows "privateOnly"; `PULL_FROM_URL` needs a verified domain → use `FILE_UPLOAD`                                                                                                      |
| YouTube                      | Data API v3 (OAuth2 `youtube.upload`)                                             | Google Cloud project; OAuth consent screen                                                                                                                                  | title ≤100 (required), description 5,000, no `<` `>` | exactly 1 video                                                                                       | Quota 10,000 units/day, an upload costs 1,600 (≈6/day); **unverified projects: uploads locked private until the API audit**; consent screen in _Testing_ gives refresh tokens that die after 7 days → publish the app or use an _Internal_ Workspace app |
| Pinterest                    | API v5 (OAuth2 `pins:write boards:read`)                                          | Pinterest app; trial → standard access review                                                                                                                               | description 500, title ≤100                          | 1 image (or video via media upload)                                                                   | Needs a board id: store a default board per account (picked on connect)                                                                                                                                                                                  |
| Bluesky                      | AT Protocol XRPC                                                                  | nothing to register: **handle + app password**                                                                                                                              | 300 graphemes                                        | ≤4 photos **or** 1 video                                                                              | Photos ≤ ~1 MB each → backend resizes; links/mentions need `facets` (byte offsets)                                                                                                                                                                       |
| Google Business Profile      | Business Profile API (`localPosts`), OAuth2 `business.manage`                     | Google Cloud project + **GBP API access request**                                                                                                                           | 1,500                                                | ≤1 photo, no video                                                                                    | Optional CTA button = the post's `link`                                                                                                                                                                                                                  |

The admin's checks live in `src/utils/social/rules.ts` (`PLATFORM_RULES`, `validateTarget`); the backend must validate
again with the same numbers and let the network's error through to `social_post_target.error` verbatim (trimmed).

## Backend design (S1–S2)

### Tables (Flyway, next free V-number)

```
social_account      id, platform, external_id, name, handle, avatar_url, status (CONNECTED|EXPIRED|ERROR),
                    access_token_enc, refresh_token_enc, token_expires_at, scopes, meta jsonb (page id, ig user id,
                    pinterest board id, linkedin urn …), private_only bool, last_error, connected_by, connected_at,
                    updated_at; unique (platform, external_id)
social_oauth_state  state (random 32 B, PK), platform, admin_user_id, code_verifier (PKCE), return_url,
                    created_at (expires after 10 min, single use)
social_media        id, kind (IMAGE|VIDEO), storage_key, public_url, thumbnail_url, file_name, mime_type, size_bytes,
                    width, height, duration_sec, sha256, uploaded_by, created_at
social_post         id, text, link, status, scheduled_at (timestamptz), published_at, source (ADMIN|API), note,
                    created_by, api_key_id, created_at, updated_at, version (optimistic lock)
social_post_media   post_id, media_id, position
social_post_target  id, post_id, account_id, text, title, status, external_id, external_url, error, attempts,
                    next_attempt_at, published_at
social_api_key      id, name, prefix, secret_sha256, drafts_only, created_by, created_at, last_used_at, revoked_at
```

- **Tokens encrypted at rest** (AES-256-GCM, key from env `SOCIAL_TOKEN_KEY`, never logged). The admin never receives a
  token: `SocialAccount` DTO has none.
- API key: `b4ys_` + 32 random bytes base62; only `sha256(secret)` and the first 9 characters are stored.

### Scheduler (both backend nodes run it — must not publish twice)

- Every 30–60 s: `SELECT … FROM social_post_target WHERE status IN ('SCHEDULED','PENDING_RETRY') AND
coalesce(next_attempt_at, post.scheduled_at) <= now() ORDER BY … LIMIT 20 FOR UPDATE SKIP LOCKED`, set
  `PUBLISHING` in the same transaction, then call the network outside the transaction.
- Publish-now = the same path with `scheduled_at = now()`.
- One connector call per target; success → `PUBLISHED`, `external_id`, `external_url`; a network error that can
  pass (5xx, 429, "media still processing") → retry with backoff 1, 5, 15 min (max 3 attempts); a final error →
  `FAILED` with the network's message. 401/invalid token → account `EXPIRED`, target `FAILED`.
- Post status is derived from its targets: all published → PUBLISHED; some → PARTIAL; none → FAILED; any still
  going → PUBLISHING.
- A target stuck in `PUBLISHING` > 15 min (node died) → back to retry, but only for networks where a duplicate is
  impossible to detect otherwise (log it); Instagram/Threads containers are idempotent until `media_publish`.
- Token refresh job (daily): refresh what can be refreshed (X, YouTube, TikTok, Pinterest, Google, LinkedIn if
  allowed); accounts expiring in < 7 days → status stays CONNECTED, the admin shows the date in amber.

### Media

- `POST /admin/social/media` (multipart `file`): JPEG/PNG/WebP ≤ 20 MB, MP4/MOV ≤ 500 MB (admin checks the same,
  `mediaFileProblem`). Store under the existing FileSystemService root (separate folder), serve at a **public, unguessable
  https URL** (Instagram/Threads/Pinterest fetch from it). Probe width/height/duration (ffprobe) and make a JPEG
  thumbnail for videos.
- Per-network transforms at publish time: Instagram → JPEG; Bluesky → ≤ 1 MB; X → chunked upload.
- **nginx**: `location /admin/social/media { client_max_body_size 512m; proxy_request_buffering off; }` on
  api.boat4you.com (today 25 m → 413).
- Automation `mediaUrls`: download server-side with SSRF guards (https only, public IPs only, ≤ 500 MB, content-type
  sniffing), or reference our own `/public/image/{id}` directly.

### OAuth flow

1. Admin: `POST /admin/social/accounts/connect/{platform}` body `{returnUrl}` → backend checks `returnUrl` against the
   admin origin allowlist, stores `social_oauth_state` (+ PKCE verifier), answers `{authorizeUrl}`.
2. Browser → network consent → `GET /public/social/oauth/{platform}/callback?code&state` (backend, permitAll).
3. Backend: state must exist, be < 10 min old, same platform; delete it; exchange code; list pages/accounts the user
   manages (FB pages + their linked IG business accounts, LinkedIn organizations, YouTube channel …); upsert one
   `social_account` each; redirect `302 {returnUrl}?connected={PLATFORM}&count={n}`; on error
   `?error={short text}&platform={PLATFORM}`.
4. Bluesky: `POST /admin/social/accounts/credentials {platform, identifier, secret}` → `createSession` to verify,
   store the app password encrypted.

## API contract — admin (`/admin/social/**`, `@PreAuthorize SYSTEM_ADMIN`)

Types: `src/types/social.type.ts` (the DTOs below are exactly those). Errors as the rest of the API: `{code, message}`.

| Method | Path                                        | Body / query                                                                                                    | Answer                                                                                                      |
| ------ | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| GET    | `/admin/social/accounts`                    |                                                                                                                 | `SocialAccount[]`                                                                                           |
| POST   | `/admin/social/accounts/connect/{platform}` | `{returnUrl}`                                                                                                   | `{authorizeUrl}`                                                                                            |
| POST   | `/admin/social/accounts/credentials`        | `{platform, identifier, secret}`                                                                                | `SocialAccount[]`                                                                                           |
| DELETE | `/admin/social/accounts/{id}`               |                                                                                                                 | 204 (revoke token at the network when it has an endpoint; scheduled targets of it fail with "disconnected") |
| POST   | `/admin/social/media`                       | multipart `file`                                                                                                | `SocialMedia`                                                                                               |
| GET    | `/admin/social/posts`                       | `from, to` (ISO, matches scheduledAt ?? publishedAt ?? createdAt), `status`, `platform`, `page`, `size` (≤ 500) | `SocialPage<SocialPost>`                                                                                    |
| GET    | `/admin/social/posts/{id}`                  |                                                                                                                 | `SocialPost`                                                                                                |
| POST   | `/admin/social/posts`                       | `SocialPostRequest`                                                                                             | `SocialPost`                                                                                                |
| PUT    | `/admin/social/posts/{id}`                  | `SocialPostRequest` (only DRAFT/SCHEDULED, else 409)                                                            | `SocialPost`                                                                                                |
| POST   | `/admin/social/posts/{id}/cancel`           | (only SCHEDULED)                                                                                                | `SocialPost`                                                                                                |
| POST   | `/admin/social/posts/{id}/retry`            | (FAILED targets → SCHEDULED now)                                                                                | `SocialPost`                                                                                                |
| DELETE | `/admin/social/posts/{id}`                  | (only DRAFT/CANCELLED/FAILED; never deletes on a network)                                                       | 204                                                                                                         |
| GET    | `/admin/social/api-keys`                    |                                                                                                                 | `SocialApiKey[]`                                                                                            |
| POST   | `/admin/social/api-keys`                    | `{name, draftsOnly}`                                                                                            | `SocialApiKeyCreated` (secret once)                                                                         |
| DELETE | `/admin/social/api-keys/{id}`               |                                                                                                                 | 204                                                                                                         |

`SocialPostRequest`: `{text, link, mediaIds, targets: [{accountId, text|null, title|null}], action: DRAFT|SCHEDULE|PUBLISH_NOW,
scheduledAt (ISO, required for SCHEDULE, ≥ now + 2 min), note}`. `targets[].text = null` means "use the post text".

## API contract — automation (`/api/social/v1/**`, header `X-Api-Key`)

- `GET /accounts` → `[{id, platform, name, handle, status}]`
- `POST /media` → multipart `file` **or** JSON `{url}` → `SocialMedia`
- `POST /posts` → `{text, link?, mediaIds? | mediaUrls?, accountIds? | platforms?, perPlatform?: {X: {text}, YOUTUBE:
{title}, …}, scheduledAt?, note?}`. With a drafts-only key the post is always saved as DRAFT (`source = API`)
  whatever `scheduledAt` says; with a full key `scheduledAt` → SCHEDULED, none → DRAFT (the API never publishes
  "now").
- `GET /posts?from&to` → the posts in that period (so the automation does not repeat topics).
- Rate limit: 60 requests / hour per key; every call updates `last_used_at`; a revoked key → 401.

## S3 — daily Claude scheduled task

A Claude scheduled task (claude.ai → scheduled tasks), every morning ~07:40 Europe/Zagreb, with the key in its
environment secret `B4Y_SOCIAL_KEY` (drafts-only key first). Prompt outline:

1. `GET /api/social/v1/posts?from=<-14 days>&to=<+7 days>` — what went out and what is planned; do not repeat a boat,
   destination or offer from the last 14 days.
2. Pick today's topic by rotation: a boat with our own photos (Boats · Media), a destination/route, an early-booking or
   last-minute offer, a sailing tip. Facts only from our sites/API (`/public/yachts/{slug}`), never invented prices.
3. Write the post in the Boat4You voice (EN; HR variant when we add HR channels): main text for Facebook/LinkedIn,
   ≤ 280 for X and ≤ 300 for Bluesky, hashtags (≤ 15) for Instagram/TikTok, a link to the boat page.
4. Media: 1–5 of our own photos via `mediaUrls` (`https://api.boat4you.com/public/image/{id}?width=1600`), JPEG,
   4:5–1.91:1 for Instagram.
5. `POST /api/social/v1/posts` with `scheduledAt` today 18:00 local and `note: "daily-claude <date>: <topic>"`.
6. Report in one line what it prepared. We approve the draft in Objave (edit → Zakaži) until we switch to a full key.

## What Mario has to do (accounts only the company can create)

1. **Meta**: developers.facebook.com → app (Business) → Facebook Login for Business, Instagram API, Threads API;
   add our pages/IG accounts; privacy-policy URL (boat4you.com/privacy); switch the app Live. Business verification
   if Meta asks.
2. **LinkedIn**: linkedin.com/developers → app tied to the Boat4You company page → request _Community Management API_.
3. **Google**: Google Cloud project → enable YouTube Data API v3 and Business Profile APIs; OAuth consent screen;
   GBP API access request form; YouTube API audit form (so uploads are public).
4. **TikTok**: developers.tiktok.com → app with Content Posting API → submit for audit.
5. **Pinterest**: developers.pinterest.com → app → standard access.
6. **X**: developer.x.com → project/app → decide whether the API price is worth it (can skip X).
7. **Bluesky**: Settings → App passwords → paste in Objave → Kanali.

Client ids/secrets go to the backend env (`SOCIAL_<NETWORK>_CLIENT_ID/SECRET`), never into the admin or a repo.
Redirect URI for all: `https://api.boat4you.com/public/social/oauth/{platform}/callback`.

## Security

- SYSTEM_ADMIN only (admin route, menu item and `/admin/social/**`).
- Network tokens and app passwords encrypted at rest, never returned, never logged; API keys hashed.
- OAuth `state` single-use, 10 min, bound to the admin user; PKCE where supported; `returnUrl` allowlisted.
- The admin renders every network/backend string as text (no HTML), opens published links only if `https://`, and
  sends the browser only to an `https://` authorize URL.
- Automation media URLs fetched with SSRF guards; size and type limits as for uploads.

## Admin (S0) — what is in this PR

- Route `/social` (+ `/social/new`, `/social/edit/:id`, `/social/channels`, `/social/automation`), menu item "Objave"
  after Contact Center, SYSTEM_ADMIN.
- **Objave**: month calendar (Monday first; click a free day → new post on that day 09:00) and list by day; filters
  status/channel; post detail with each channel's status, link, error, attempts; edit (DRAFT/SCHEDULED), duplicate,
  cancel schedule, retry failed, delete (DRAFT/CANCELLED/FAILED). Re-polls every 15 s while a post is PUBLISHING.
- **Nova objava**: text with live counters per network, link, internal note, photo/video upload (progress, reorder,
  remove), channel picker, per-channel own text/title with live checks, preview per channel, Save draft / Schedule
  (local time) / Publish now (confirm).
- **Kanali**: all 10 networks, connected accounts with status/expiry/private-only/last error, connect (OAuth redirect
  or Bluesky dialog), reconnect, disconnect; reads `?connected=` / `?error=` on return.
- **Automatizacija**: API keys (create — shown once, drafts-only default — and revoke), API reference with a ready
  curl example and channel ids, the daily-Claude outline.
- Tests: `tests/social.test.ts` (rules, counting incl. X weighting and Bluesky graphemes, validation, request
  building, schedule helpers, calendar grid, media file checks).
