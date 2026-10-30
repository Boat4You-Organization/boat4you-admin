import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink } from 'react-router-dom';

import CloseIcon from '@mui/icons-material/CloseRounded';
import LogoutIcon from '@mui/icons-material/LogoutOutlined';
import MenuIcon from '@mui/icons-material/MenuRounded';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';
import { AppBar, Box, Button, Divider, Drawer, IconButton, Menu, MenuItem, Stack, Typography } from '@mui/material';

import navigation from '@/config/navigation.config';
import { UserRoleName } from '@/models/user.model';
import { bbColors, bbFont, bbTexture } from '@/styles/bb';
import { createPoller } from '@/utils/contactCenter/poller';
import useLogout from '@/utils/hooks/useLogout';
import { useAuthStore } from '@/valtio/auth/auth.store';
import { refreshUnviewedBookingsCount } from '@/valtio/bookings/bookings.actions';
import { useBookingsStore } from '@/valtio/bookings/bookings.store';
import { refreshContactCenterUnread } from '@/valtio/contactCenter/contactCenter.actions';
import { useContactCenterStore } from '@/valtio/contactCenter/contactCenter.store';

import LanguagePicker from './LanguagePicker';

/**
 * Boat4You Broker Desk top navigation (v2.2): navy bar on the nautical-chart
 * texture, yellow B4 tile, centred nav (yellow pill = active), language and
 * profile glass buttons, user pill. Below md the nav and the right cluster
 * collapse into a 44px menu button that opens a textured drawer from the right.
 *
 *   height 54px, horizontal padding 20px
 *   below 1200px "· Broker Desk" and the user's name are hidden
 */

const glassSx = {
  width: 32,
  height: 32,
  p: 0,
  borderRadius: '9px',
  backgroundColor: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.14)',
  color: '#fff',
  '&:hover': { backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff' },
} as const;

// NavLink marks the current route with the `active` class.
const navLinksSx = {
  '& a': {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    height: 32,
    padding: '0 10px',
    borderRadius: '8px',
    fontFamily: bbFont.stack,
    fontSize: 12.5,
    fontWeight: 600,
    color: bbColors.navyMist,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    transition: 'background-color .15s, color .15s',
  },
  '& a:hover': { color: '#fff', backgroundColor: 'rgba(255,255,255,0.07)' },
  '& a.active': {
    backgroundColor: bbColors.yellow500,
    color: bbColors.navy900,
    fontWeight: 800,
    boxShadow: '0 6px 14px -8px rgba(255,210,74,.95)',
  },
} as const;

const Header = () => {
  const { user } = useAuthStore();
  const { t } = useTranslation('navigation');
  const handleLogout = useLogout();
  const [userMenu, setUserMenu] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { unviewedCount: unviewedBookings } = useBookingsStore();
  const isUserRole = user?.roles?.some(role => role.roleName === UserRoleName.USER);
  const isSystemAdmin = !!user?.roles?.some(role => role.roleName === UserRoleName.SYSTEM_ADMIN);
  const { unreadCount: contactCenterUnread } = useContactCenterStore();
  // Only the items this user's roles may open (a MANAGER does not see SYSTEM_ADMIN-only items).
  const visibleNavigation = navigation.filter(
    item => !item.accessLevel || !!user?.roles?.some(role => item.accessLevel?.includes(role.roleName))
  );
  const badgeFor = (id: string, news?: number) => {
    if (id === 'bookings') return unviewedBookings;

    if (id === 'contactCenter') return contactCenterUnread;

    return news ?? 0;
  };

  // Poll the unviewed-bookings count whenever the admin shell is mounted.
  // First fetch on mount, then every 60s so a parked tab still surfaces
  // newly-arrived bookings without a manual refresh.
  useEffect(() => {
    if (!user || isUserRole) return undefined;

    refreshUnviewedBookingsCount();

    const id = window.setInterval(refreshUnviewedBookingsCount, 60_000);

    return () => window.clearInterval(id);
  }, [user, isUserRole]);

  // Contact Center unread conversations, every 30 s while the tab is visible (SYSTEM_ADMIN only, like the API).
  useEffect(() => {
    if (!isSystemAdmin) return undefined;

    const poller = createPoller(refreshContactCenterUnread, 30_000);

    poller.start();

    return () => poller.stop();
  }, [isSystemAdmin]);

  if (!user || isUserRole) return null;

  const initials = `${user.name?.[0] ?? ''}${user.surname?.[0] ?? ''}`.toUpperCase() || 'B4';

  const Brand = (
    <Link to="/bookings" style={{ textDecoration: 'none' }} aria-label="boat4you — Bookings">
      <Stack direction="row" alignItems="center" gap={1}>
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: '8px',
            backgroundColor: bbColors.yellow500,
            color: bbColors.yellowText,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 12,
            boxShadow: 'inset 0 -2px 0 rgba(59,41,0,.16)',
          }}
        >
          B4
        </Box>
        <Typography
          component="span"
          sx={{
            fontWeight: 800,
            fontSize: 14,
            color: '#fff',
            fontFamily: bbFont.stack,
            whiteSpace: 'nowrap',
          }}
        >
          boat4you{' '}
          <Box
            component="span"
            sx={{
              color: bbColors.navyDim,
              fontSize: 11,
              fontWeight: 600,
              display: 'none',
              '@media (min-width: 1200px)': { display: 'inline' },
            }}
          >
            · Broker Desk
          </Box>
        </Typography>
      </Stack>
    </Link>
  );

  // eslint-disable-next-line react/no-unstable-nested-components
  const NavBadge = ({ count }: { count: number }) => (
    <Box
      component="span"
      sx={{
        minWidth: 17,
        height: 17,
        px: '5px',
        borderRadius: 999,
        backgroundColor: bbColors.red600,
        color: '#fff',
        fontSize: 10,
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 0 2px rgba(11,26,43,.35)',
      }}
    >
      {count}
    </Box>
  );

  const totalUnread = visibleNavigation.reduce((sum, item) => sum + badgeFor(item.id, item.news), 0);

  const roleLabel = user.roles?.[0]?.roleName;

  return (
    <>
      <AppBar
        elevation={0}
        position="fixed"
        sx={{
          background: bbTexture.chart,
          color: '#fff',
          height: 54,
          justifyContent: 'center',
          borderBottom: 'none',
          boxShadow: 'inset 0 -1px 0 rgba(255,255,255,.07)',
          fontFamily: bbFont.stack,
        }}
      >
        {/* Brand left, nav centred, tools right. Below md: [brand | menu button]. */}
        <Box
          sx={{
            pl: { xs: 1.5, md: 2.5 },
            pr: { xs: 1, md: 2.5 },
            height: 54,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr auto', md: 'auto minmax(0, 1fr) auto' },
            alignItems: 'center',
            gap: 2,
          }}
        >
          {/* --- Brand (left) --- */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>{Brand}</Box>

          {/* --- Nav (centered) --- Desktop only. */}
          <Stack
            component="nav"
            aria-label="Main navigation"
            direction="row"
            alignItems="center"
            gap="2px"
            sx={{
              display: { xs: 'none', md: 'flex' },
              justifyContent: 'center',
              minWidth: 0,
              overflowX: 'auto',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
              ...navLinksSx,
            }}
          >
            {visibleNavigation.map(item => {
              // Bookings and the Contact Center get live counts from their stores (polled); other
              // nav items fall back to the static `news` prop (kept for future module alerts).
              const count = badgeFor(item.id, item.news);

              return (
                <NavLink key={item.id} to={item.path || '/'}>
                  {t(item.id, item.id)}
                  {count > 0 ? <NavBadge count={count} /> : null}
                </NavLink>
              );
            })}
          </Stack>

          {/* --- Right cluster (desktop) --- */}
          <Stack
            direction="row"
            alignItems="center"
            gap={1}
            sx={{
              display: { xs: 'none', md: 'flex' },
              justifyContent: 'flex-end',
            }}
          >
            <LanguagePicker />
            <IconButton component={Link} to="/my-profile" aria-label={t('profileSettings')} sx={glassSx}>
              <SettingsIcon sx={{ fontSize: 17 }} />
            </IconButton>
            <Button
              onClick={e => setUserMenu(e.currentTarget)}
              aria-haspopup="menu"
              aria-expanded={Boolean(userMenu)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                height: 34,
                minHeight: 34,
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.14)',
                padding: '0 4px',
                borderRadius: '999px',
                boxShadow: 'none',
                textTransform: 'none',
                color: '#fff',
                minWidth: 0,
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.12)', boxShadow: 'none' },
                '@media (min-width: 1200px)': { padding: '0 12px 0 4px' },
              }}
            >
              <Box
                component="span"
                sx={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  backgroundColor: bbColors.yellow500,
                  color: bbColors.yellowText,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10.5,
                  fontWeight: 800,
                }}
              >
                {initials}
              </Box>
              <Typography
                component="span"
                sx={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#fff',
                  fontFamily: bbFont.stack,
                  whiteSpace: 'nowrap',
                  display: 'none',
                  '@media (min-width: 1200px)': { display: 'inline' },
                }}
              >
                {user.name} {user.surname} ▾
              </Typography>
            </Button>
          </Stack>

          {/* --- Menu button (mobile) --- */}
          <IconButton
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            sx={{
              display: { xs: 'inline-flex', md: 'none' },
              position: 'relative',
              width: 44,
              height: 44,
              borderRadius: '10px',
              backgroundColor: 'rgba(255,255,255,0.06)',
              color: '#fff',
              justifySelf: 'end',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff' },
            }}
          >
            <MenuIcon sx={{ fontSize: 22 }} />
            {totalUnread > 0 && (
              <Box sx={{ position: 'absolute', top: 4, right: 2, display: 'flex' }}>
                <NavBadge count={totalUnread} />
              </Box>
            )}
          </IconButton>
        </Box>
      </AppBar>

      {/* --- Desktop user menu popover --- */}
      <Menu
        anchorEl={userMenu}
        open={Boolean(userMenu)}
        onClose={() => setUserMenu(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { mt: 1, width: 240 } } }}
      >
        <Box sx={{ p: '10px 10px 8px', mb: '4px', borderBottom: `1px solid ${bbColors.gray100}` }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: bbColors.navy900 }}>
            {user.name} {user.surname}
          </Typography>
          {roleLabel && <Typography sx={{ fontSize: 12, color: bbColors.gray500 }}>{roleLabel}</Typography>}
        </Box>
        <MenuItem component={Link} to="/my-profile" onClick={() => setUserMenu(null)}>
          <SettingsIcon sx={{ fontSize: 16, color: bbColors.gray500 }} />
          {t('profileSettings')}
        </MenuItem>
        <Divider sx={{ '&.MuiDivider-root': { my: '4px' } }} />
        <MenuItem
          onClick={() => {
            setUserMenu(null);
            handleLogout();
          }}
          sx={{ color: bbColors.red700 }}
        >
          <LogoutIcon sx={{ fontSize: 16 }} />
          {t('logout')}
        </MenuItem>
      </Menu>

      {/* --- Mobile drawer --- */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 300,
            maxWidth: '86vw',
            background: bbTexture.chart,
            color: '#fff',
            boxShadow: '-8px 0 24px rgba(0,0,0,.3)',
          },
        }}
      >
        <Stack component="nav" aria-label="Main navigation" sx={{ p: '10px 10px 16px', minHeight: '100%' }}>
          {/* User strip: identity at the top, Profile / Logout at the bottom of the drawer. */}
          <Stack
            direction="row"
            alignItems="center"
            gap={1.25}
            sx={{ p: '6px 4px 14px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          >
            <Box
              sx={{
                flex: 'none',
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${bbColors.navy700}, ${bbColors.navy900})`,
                border: '1px solid rgba(255,255,255,.25)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {initials}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                {user.name} {user.surname}
              </Typography>
              <Typography sx={{ fontSize: 12, color: bbColors.navyDim }}>
                Broker Desk{roleLabel ? ` · ${roleLabel}` : ''}
              </Typography>
            </Box>
            <IconButton
              onClick={() => setDrawerOpen(false)}
              aria-label="Close navigation"
              sx={{
                width: 44,
                height: 44,
                color: '#fff',
                '&:hover': { color: '#fff', backgroundColor: 'rgba(255,255,255,.07)' },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>

          <Stack
            sx={{
              py: '10px',
              gap: '2px',
              flex: 1,
              ...navLinksSx,
              '& a': { ...navLinksSx['& a'], height: 44, px: '12px', fontSize: 14, justifyContent: 'space-between' },
            }}
          >
            {visibleNavigation.map(item => (
              <NavLink key={item.id} to={item.path || '/'} onClick={() => setDrawerOpen(false)}>
                <span>{t(item.id, item.id)}</span>
                {badgeFor(item.id, item.news) > 0 ? <NavBadge count={badgeFor(item.id, item.news)} /> : null}
              </NavLink>
            ))}
          </Stack>

          <Stack
            sx={{
              borderTop: '1px solid rgba(255,255,255,0.1)',
              pt: 1,
              gap: '2px',
              '& .MuiMenuItem-root': {
                minHeight: 44,
                gap: 1,
                fontSize: 14,
                fontWeight: 600,
                color: bbColors.navyMist,
                borderRadius: '8px',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.07)', color: '#fff' },
              },
            }}
          >
            <MenuItem component={Link} to="/my-profile" onClick={() => setDrawerOpen(false)}>
              <SettingsIcon sx={{ fontSize: 18 }} />
              {t('profileSettings')}
            </MenuItem>
            {/* Language switcher: same component as the desktop cluster, inline in the drawer. */}
            <Box sx={{ px: '12px', py: 0.5 }}>
              <LanguagePicker />
            </Box>
            <MenuItem
              onClick={() => {
                setDrawerOpen(false);
                handleLogout();
              }}
              sx={{ '&&': { color: '#ff9e8d' } }}
            >
              <LogoutIcon sx={{ fontSize: 18 }} />
              {t('logout')}
            </MenuItem>
          </Stack>
        </Stack>
      </Drawer>
    </>
  );
};

export default Header;
