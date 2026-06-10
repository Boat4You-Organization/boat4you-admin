# Admin Visual Polish ("Polirani Broker Desk") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Soften the Broker Desk admin (soft cards, warmer bg, KPI icon chips) and replace the old-boilerplate auth pages with a navy/yellow split-screen AuthShell.

**Architecture:** All surface styling flows through `src/styles/bb.ts` tokens (new `bbCardSx`, `bbAuthTitleSx`). A new `AuthShell` component provides the split layout for the four auth views; it restyles submit buttons via a scoped MUI class override so form components stay untouched. No new dependencies, no theme/Header changes.

**Tech Stack:** React 19 + MUI 7 (sx), Vite, SCSS modules (auth view module.scss files get deleted), valtio/react-hook-form untouched.

**Verification model:** This repo has no test framework and the change is styling-only — each task verifies with `yarn build` (tsc + vite) and the final task does a visual check of the auth pages via the Vite dev server. Lint must stay at 0 (husky pre-commit runs it; never `--no-verify`).

Repo root for all paths/commands: `/Users/mariokuzmanic/Downloads/boat4you-delivery/boat4you-admin/boat4you-admin-main`

---

### Task 1: Tokens in `src/styles/bb.ts`

**Files:**
- Modify: `src/styles/bb.ts`

- [ ] **Step 1: Edit tokens**

In `bbColors`: change `gray50: '#eef1f4',` → `gray50: '#f4f6f8',` and add `cardBorder: '#e9eef4',` after the `gray300` line.

In `bbRadii`: change `card: 10,` → `card: 14,`.

Replace the `bbShadow` block with:

```ts
export const bbShadow = {
  yellowCta: '0 4px 10px -4px rgba(255,210,74,0.5)',
  card: '0 1px 2px rgba(11,26,43,0.04), 0 4px 12px rgba(11,26,43,0.05)',
} as const;
```

Append directly after the `bbShadow` block:

```ts
/** Soft card surface — bg, hairline border, radius and shadow in one place. */
export const bbCardSx = {
  backgroundColor: bbColors.white,
  border: `1px solid ${bbColors.cardBorder}`,
  borderRadius: `${bbRadii.card}px`,
  boxShadow: bbShadow.card,
} as const;

/** Auth page H1 — replaces the old Raleway-italic blue hero. */
export const bbAuthTitleSx = {
  fontFamily: bbFont.stack,
  fontSize: { xs: 32, md: 40 },
  fontWeight: 800,
  letterSpacing: '-0.02em',
  lineHeight: 1.15,
  color: bbColors.navy900,
} as const;
```

- [ ] **Step 2: Verify**

Run: `grep -rn "bbRadii.card" src/ | grep -v styles/bb.ts` — note which views already consume the token (they pick up radius 14 automatically; that is desired). Then run `yarn build`. Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/styles/bb.ts
git commit -m "style(bb): warmer page bg, soft card shadow, radius 14, card/auth-title helpers"
```

### Task 2: Dashboard polish

**Files:**
- Modify: `src/views/Dashboard/Dashboard.tsx`

- [ ] **Step 1: Add icon imports + bbCardSx import**

```tsx
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import EuroOutlinedIcon from '@mui/icons-material/EuroOutlined';
import SailingOutlinedIcon from '@mui/icons-material/SailingOutlined';
```

and extend the bb import to `import { bbCardSx, bbColors, bbFont, bbStatusPill } from '@/styles/bb';`.

- [ ] **Step 2: Replace `KpiCard` with icon-chip version**

```tsx
const KpiCard = ({
  label,
  value,
  foot,
  valueColor,
  icon,
  chipBg,
  chipFg,
}: {
  label: string;
  value: string;
  foot?: React.ReactNode;
  valueColor?: string;
  icon: React.ReactNode;
  chipBg: string;
  chipFg: string;
}) => (
  <Box sx={{ ...bbCardSx, p: '16px 18px' }}>
    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
      <Typography sx={{ fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: bbColors.gray500, fontWeight: 700, pt: '6px' }}>
        {label}
      </Typography>
      <Box
        sx={{
          width: 30,
          height: 30,
          borderRadius: '9px',
          backgroundColor: chipBg,
          color: chipFg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
    </Stack>
    <Typography
      sx={{
        fontSize: 28,
        fontWeight: 800,
        letterSpacing: '-0.02em',
        mt: 0.25,
        color: valueColor || bbColors.navy900,
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1.2,
      }}
    >
      {value}
    </Typography>
    {foot && (
      <Typography sx={{ fontSize: 11, mt: 0.5, color: bbColors.gray500, lineHeight: 1.4 }}>{foot}</Typography>
    )}
  </Box>
);
```

- [ ] **Step 3: Pass icons/tints at the four call sites**

Add to the existing four `<KpiCard … />` calls (keep current label/value/foot props):

- Bookings this week: `icon={<EventAvailableOutlinedIcon sx={{ fontSize: 17 }} />} chipBg="#e8f0fb" chipFg="#1a4fa8"`
- Bookings this month: `icon={<CalendarMonthOutlinedIcon sx={{ fontSize: 17 }} />} chipBg="#e1f5ee" chipFg="#0f6e56"`
- Confirmed reservations: `icon={<SailingOutlinedIcon sx={{ fontSize: 17 }} />} chipBg="#fef7e0" chipFg="#8a6d00"`
- Revenue YTD: `icon={<EuroOutlinedIcon sx={{ fontSize: 17 }} />} chipBg="#d1fae5" chipFg="#047857"`

- [ ] **Step 4: Soft cards + chart + table tweaks**

- Chart card wrapper and recent-bookings card wrapper: replace their three style lines `backgroundColor: bbColors.white,` + `border: \`1px solid ${bbColors.gray200}\`,` + `borderRadius: '10px',` with `...bbCardSx,` (keep the table card's `overflow: 'hidden'`).
- Chart bars (both the empty-state placeholder row and the data row): `borderRadius: '4px 4px 0 0'` → `borderRadius: '6px'`; data bars `backgroundColor: isToday ? bbColors.yellow500 : bbColors.navy900` → `backgroundColor: isToday ? bbColors.yellow500 : bbColors.navy700`; drop the `opacity` line; bar row height `120` → `128`.
- `tdBase`: `padding: '12px 14px'` → `padding: '14px 16px'`, `fontSize: 12.5` → `fontSize: 13`.
- Table `th` sx: `padding: '10px 14px'` → `padding: '11px 16px'`.

- [ ] **Step 5: Verify + commit**

Run: `yarn build`. Expected: success.

```bash
git add src/views/Dashboard/Dashboard.tsx
git commit -m "style(dashboard): KPI icon chips, soft cards, blue rounded chart bars, roomier table"
```

### Task 3: AuthShell component + autofill fix

**Files:**
- Create: `src/components/AuthShell/AuthShell.tsx`
- Create: `src/components/AuthShell/index.ts`
- Modify: `src/styles/globals/_base.scss`

- [ ] **Step 1: Create `src/components/AuthShell/AuthShell.tsx`**

```tsx
import React from 'react';

import { Box, Stack, Typography } from '@mui/material';

import Layout from '@/components/Layout';
import { bbColors, bbFont, bbShadow } from '@/styles/bb';

interface AuthShellProps {
  children: React.ReactNode;
}

/**
 * Split-screen shell shared by the auth pages (login, signup, password
 * flows): left = white form column with the brand row, right = navy brand
 * panel (hidden below md). Submit buttons inside get the yellow Broker
 * Desk CTA via a scoped override so the form components stay untouched.
 */
const AuthShell: React.FC<AuthShellProps> = ({ children }) => (
  <Layout>
    <Box sx={{ display: 'flex', minHeight: '100vh', fontFamily: bbFont.stack, backgroundColor: bbColors.white }}>
      <Box
        sx={{
          flex: '1 1 50%',
          display: 'flex',
          flexDirection: 'column',
          px: { xs: 3, sm: 6 },
          py: { xs: 3, sm: 4 },
          '& .MuiButton-contained': {
            backgroundColor: bbColors.yellow500,
            color: bbColors.yellowText,
            boxShadow: bbShadow.yellowCta,
            fontWeight: 800,
            borderRadius: '8px',
            '&:hover': { backgroundColor: '#f7c83d', boxShadow: bbShadow.yellowCta },
            '&:active': { backgroundColor: '#efbe2f' },
            '&.Mui-disabled': { backgroundColor: '#f6e8bd', color: '#a08a45', boxShadow: 'none' },
          },
          '& a': { color: bbColors.navy700, fontWeight: 600 },
        }}
      >
        <Stack direction="row" alignItems="center" gap={1.25}>
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: '7px',
              backgroundColor: bbColors.yellow500,
              color: bbColors.yellowText,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: '-0.02em',
            }}
          >
            B4
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: 14, color: bbColors.navy900 }}>
            boat4you
            <Box component="span" sx={{ color: bbColors.gray500, fontWeight: 500 }}>
              {' · Broker Desk'}
            </Box>
          </Typography>
        </Stack>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: '100%', maxWidth: 420, mx: 'auto', py: 5 }}>{children}</Box>
        </Box>
      </Box>
      <Box
        sx={{
          flex: '1 1 50%',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: bbColors.navy900,
          position: 'relative',
          overflow: 'hidden',
          px: 8,
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '13px',
            backgroundColor: bbColors.yellow500,
            color: bbColors.yellowText,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 22,
            letterSpacing: '-0.02em',
          }}
        >
          B4
        </Box>
        <Typography sx={{ color: bbColors.white, fontSize: 30, fontWeight: 800, mt: 3, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
          Broker Desk
        </Typography>
        <Typography sx={{ color: bbColors.navyDim, fontSize: 15, mt: 1, maxWidth: 380, lineHeight: 1.6 }}>
          Bookings, offers, invoices and the fleet — one desk for the whole charter day.
        </Typography>
        <Box sx={{ position: 'absolute', left: 64, right: 64, bottom: 64 }}>
          <Box sx={{ height: 3, borderRadius: '2px', backgroundColor: '#1a4fa8', width: '72%' }} />
          <Box sx={{ height: 3, borderRadius: '2px', backgroundColor: '#16406e', width: '52%', mt: 1.5 }} />
          <Box sx={{ height: 3, borderRadius: '2px', backgroundColor: '#122f4e', width: '62%', mt: 1.5 }} />
        </Box>
      </Box>
    </Box>
  </Layout>
);

export default AuthShell;
```

- [ ] **Step 2: Create `src/components/AuthShell/index.ts`**

```ts
export { default } from './AuthShell';
```

- [ ] **Step 3: Append Chrome autofill fix to `src/styles/globals/_base.scss`**

```scss
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus {
  box-shadow: 0 0 0 1000px $white inset;
  -webkit-text-fill-color: $black;
}
```

(If stylelint's pre-commit pass objects to a rule here, follow its message — do not bypass the hook.)

- [ ] **Step 4: Verify + commit**

Run: `yarn build`. Expected: success (component not yet referenced — that's fine).

```bash
git add src/components/AuthShell src/styles/globals/_base.scss
git commit -m "feat(auth): AuthShell split layout + Chrome autofill field fix"
```

### Task 4: Login → AuthShell

**Files:**
- Modify: `src/views/Login/Login.tsx`
- Modify: `src/views/Login/LoginForm/LoginForm.tsx` (one spacing value)
- Delete: `src/views/Login/Login.module.scss`

- [ ] **Step 1: Rewrite `src/views/Login/Login.tsx`**

```tsx
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Typography } from '@mui/material';

import AuthShell from '@/components/AuthShell';
import Form from '@/components/Forms/Form';
import { LoginFormValues } from '@/config/forms/form-models.config';
import { LOGIN_FORM } from '@/config/forms/form-names.config';
import AuthService from '@/services/auth.service';
import { bbAuthTitleSx } from '@/styles/bb';
import { setToken } from '@/valtio/auth/auth.actions';
import { showToast } from '@/valtio/global/global.actions';

import LoginForm from './LoginForm';

const defaultValues: LoginFormValues = {
  email: '',
  password: '',
};

const Login = () => {
  const { t } = useTranslation();

  const handleSubmit = async (formValues: LoginFormValues, methods?: UseFormReturn<LoginFormValues>): Promise<void> => {
    const { payload, message } = await AuthService.login(formValues);

    if (!payload) {
      methods?.setError('email', {
        type: 'manual',
        message: ' ',
      });

      methods?.setError('password', {
        type: 'manual',
        message: t('common.invalid-credentials'),
      });
    }

    setToken(payload);
    showToast({
      status: payload ? 'success' : 'error',
      text: payload ? t('toast-messages.login-success') : message || t('toast-messages.login-failed'),
    });
  };

  return (
    <AuthShell>
      <Typography component="h1" sx={bbAuthTitleSx}>
        {t('login.title')}
      </Typography>
      <Form defaultValues={defaultValues} onSubmit={handleSubmit} id={LOGIN_FORM} mode="onBlur">
        <LoginForm />
      </Form>
    </AuthShell>
  );
};

export default Login;
```

- [ ] **Step 2: In `LoginForm.tsx` change `<Stack gap={3} pt={6}>` → `<Stack gap={3} pt={4}>`** (title is smaller now, 48px gap looks detached).

- [ ] **Step 3: Delete the stale module**

```bash
rm src/views/Login/Login.module.scss
```

- [ ] **Step 4: Verify + commit**

Run: `yarn build`. Expected: success, no unused-import lint errors.

```bash
git add -A src/views/Login
git commit -m "style(login): port to AuthShell, drop boilerplate hero/sketch"
```

### Task 5: ForgotPassword, ResetPassword, SignUp → AuthShell

**Files:**
- Modify: `src/views/ForgotPassword/ForgotPassword.tsx` · Delete: `src/views/ForgotPassword/ForgotPassword.module.scss`
- Modify: `src/views/ResetPassword/ResetPassword.tsx` · Delete: `src/views/ResetPassword/ResetPassword.module.scss`
- Modify: `src/views/SignUp/SignUp.tsx` · Delete: `src/views/SignUp/SignUp.module.scss`

Apply the same mechanical transformation to each view (logic, handlers, effects and inner `render*` content stay byte-identical except where listed):

- [ ] **Step 1: Imports**

  - Remove: `Container`, `Grid`, `Box` (vector wrapper only), `Layout`, `AdminLoginVector`, success vectors (`ReserSuccessfulVector` / `ResetPasswordCodeVector`), `styles` (module.scss), and `colors` where it was only used for title color (ForgotPassword, SignUp — ResetPassword keeps `colors` for the `ArrowLeft` fill).
  - Add: `import AuthShell from '@/components/AuthShell';` and `import { bbAuthTitleSx } from '@/styles/bb';`.

- [ ] **Step 2: Titles**

Every `<Typography variant="hero" fontWeight={800} fontStyle="italic" color={colors.blue500} …>` becomes `<Typography component="h1" sx={bbAuthTitleSx}>` (drop any `pt={{ xs: 0, md: 3 }}`). Occurrences: ForgotPassword ×3, ResetPassword ×2, SignUp ×2.

- [ ] **Step 3: Spacing under titles**

Description `<Typography pt={6} pb={3} …>` directly under a title becomes `pt={2} pb={3}`.

- [ ] **Step 4: Form props**

Drop `className={styles.form}` from `<Form …>` (no `.form` rule exists in any of these module.scss files — the class resolved to `undefined`).

- [ ] **Step 5: ResetPassword back arrow**

`<IconButton onClick={handleBackButtonClick} className={styles.navigationArrow}>` → `<IconButton onClick={handleBackButtonClick} sx={{ display: { xs: 'none', md: 'inline-flex' }, ml: -1, mb: 1 }}>` (preserves the old "hidden below md" behavior).

- [ ] **Step 6: Return wrapper**

The whole `<Layout><Container …>…</Container></Layout>` return block becomes:

```tsx
return <AuthShell>{renderContent()}</AuthShell>;
```

(ResetPassword has no `renderContent`; use `return <AuthShell>{!successState ? renderForm() : renderSuccessContent()}</AuthShell>;`)

- [ ] **Step 7: Delete the three module.scss files**

```bash
rm src/views/ForgotPassword/ForgotPassword.module.scss src/views/ResetPassword/ResetPassword.module.scss src/views/SignUp/SignUp.module.scss
```

- [ ] **Step 8: Verify + commit**

Run: `yarn build`. Expected: success. Also `npx tsc --noEmit` if quicker iteration needed.

```bash
git add -A src/views/ForgotPassword src/views/ResetPassword src/views/SignUp
git commit -m "style(auth): port password/signup flows to AuthShell"
```

### Task 6: Visual verification

**Files:** none (verification only; fixups commit here if needed)

- [ ] **Step 1: Start Vite dev server** (preview tooling or `yarn dev`; API at localhost:8443 may be down — login page renders without it).

- [ ] **Step 2: Check `/login`** — split layout, navy right panel with B4 + waves, yellow CTA, no Raleway italic, no sketch; type into email/password (autofill tint gone); narrow viewport (~390px): right panel hidden, form usable.

- [ ] **Step 3: Check `/reset-password`** — title style, back arrow visible ≥md only, yellow CTA.

- [ ] **Step 4: Check `/forgot-password` and `/signup` routes** (they render error states without valid codes — confirm titles/shell look right). Route paths per `src/routers` if these differ.

- [ ] **Step 5: Console clean** — no new errors besides expected failed API calls to localhost:8443.

- [ ] **Step 6: Commit any fixups**

```bash
git add -A && git commit -m "style(auth): visual-pass fixups"
```

---

## Out of scope (round 2 candidates)

- Header/navigation, MyProfile, Offers (old blue theme), other bb views adopting `bbCardSx`, i18n copy changes.
