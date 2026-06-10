# Admin visual polish — "Polirani Broker Desk"

Date: 2026-06-10 · Approved by Mario (direction A of three mocked options)

## Goal

Make the Broker Desk admin more pleasant to look at without changing its
identity (navy `#0b1a2b` + yellow `#ffd24a`), information architecture, or
navigation. Two pain points: the main pages feel hard/concrete (hard 1px
card borders, cold gray background, small flat numbers), and the auth pages
still use the old Workspace boilerplate look (Raleway italic blue headline,
sketch illustration, indigo button) that clashes with the rest.

## Scope

### 1. Tokens — `src/styles/bb.ts` (propagates to all bb pages)

- Page background `gray50`: `#eef1f4` → `#f4f6f8` (warmer, less concrete).
- Card radius `bbRadii.card`: `10` → `14`.
- New `bbShadow.card`: soft two-layer shadow
  (`0 1px 2px rgba(11,26,43,0.04), 0 4px 12px rgba(11,26,43,0.05)`)
  + new `bbColors.cardBorder` `#e9eef4` (lighter than gray200) so cards read
  as soft surfaces instead of outlined boxes.
- New `bbCardSx` helper (bg/border/radius/shadow in one object) so views
  apply the card look consistently; existing views that compose
  `border: 1px solid gray200 / borderRadius 10px` get switched to it where
  touched (Dashboard now, other views may adopt incrementally).

### 2. Dashboard — `src/views/Dashboard/Dashboard.tsx`

- KPI cards: small tinted icon chip per card (calendar/chart/anchor/euro in
  blue/teal/amber/green 50-tints), value size 24 → 28.
- Chart: bars fully rounded (radius 6), bar color near-black navy →
  `#1a4fa8` (navy700), today stays yellow; slightly taller bars area.
- Recent bookings table: roomier rows (12px → 14px vertical padding).
- All cards use the new soft-card style.

### 3. Auth pages — shared `AuthShell`

New `src/components/AuthShell` used by Login, ForgotPassword, ResetPassword,
SignUp:

- Split layout: left = white panel with B4 logomark, page title in bb font
  (navy, weight 800, no italic/Raleway), subtitle, then the existing form
  rendered via `children` (react-hook-form `Form` components unchanged).
- Right = navy `#0b1a2b` panel with large yellow B4 mark, short tagline and
  subtle horizontal wave lines (pure CSS divs); hidden under `md`.
- Yellow CTA button (navy text, `bbShadow.yellowCta`) replaces indigo.
- Kill the `AdminLoginVector` sketch usage on these pages.
- Fix Chrome autofill yellow fields: `:-webkit-autofill` inset box-shadow
  override in global SCSS.

### 4. Out of scope (second round)

- Header/navigation: unchanged.
- MyProfile and Offers views (still on old blue MUI theme).
- No new dependencies, no font loading — keep `bbFont.stack` system stack.

## Verification

- `yarn build` (tsc + vite) passes.
- Vite dev server: visual check of Login (no auth needed) and auth pages.
- Dashboard verified by code review + build (needs live API/login to render).

## Deploy

Local + git only. Deploy to cusma1 (admin.boat4you.com) is a separate manual
step on Mario's go, per standing workflow.
