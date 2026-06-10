# boat4you-admin — deploy notes

## Pending deploy (2026-06-10) — visual polish "Polirani Broker Desk"

Commits `3019f4e..646fe1f` on `main` (pushed). Styling only — no API/routing/logic
changes, no new dependencies, no env changes.

- `src/styles/bb.ts`: warmer page bg (#f4f6f8), card radius 14, soft card shadow,
  `bbCardSx`/`bbAuthTitleSx` helpers.
- Dashboard: KPI icon chips, soft cards, blue rounded chart bars, roomier table.
- New `AuthShell` (navy/yellow split) used by Login, ForgotPassword, ResetPassword,
  SignUp; old sketch + Raleway-italic hero removed; Chrome autofill yellow fix.

Deploy = standard SPA build per `README_PROD.md` (build with prod `.env`, upload
`dist/` to cusma1 `/var/www/admin.boat4you.com/html`).

⚠️ `yarn build` (tsc step) fails on **10 pre-existing TS errors** in
`src/views/Bookings/partials/CreateReservationModal/` (`CreateReservationModal.tsx`,
`DateRangeField.tsx`, `LocationPicker.tsx`) — MUI/x-date-pickers type bump, present
on `main` before this work. `npx vite build` alone succeeds and produces a correct
bundle. Fix the types or build with `npx vite build` until then.
