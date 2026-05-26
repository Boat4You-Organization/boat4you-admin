import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Link } from 'react-router-dom';

import LogoutIcon from '@mui/icons-material/LogoutOutlined';
import MenuIcon from '@mui/icons-material/MenuRounded';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';
import {
  AppBar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';

import navigation from '@/config/navigation.config';
import { UserRoleName } from '@/models/user.model';
import { bbColors, bbFont } from '@/styles/bb';
import useLogout from '@/utils/hooks/useLogout';
import { useAuthStore } from '@/valtio/auth/auth.store';
import { refreshUnviewedBookingsCount } from '@/valtio/bookings/bookings.actions';
import { useBookingsStore } from '@/valtio/bookings/bookings.store';
import LanguagePicker from './LanguagePicker';

/**
 * Boat4You Broker Desk top navigation — navy bar, yellow B4 logomark,
 * CENTERED inline nav items (yellow pill = active), settings gear,
 * user pill. Mobile collapses nav + right cluster into a hamburger
 * drawer that slides in from the right.
 *
 *   height 54px, bg #0b1a2b, horizontal padding 20px
 *   no global search, no bell (intentionally removed per handoff)
 *   md breakpoint (900px) = desktop ↔ mobile switch
 */

const NAV_BG = bbColors.navy900;
const NAV_ITEM_INACTIVE = bbColors.navyDim; // #a8bccf
const NAV_ITEM_ACTIVE_BG = bbColors.yellow500;
const NAV_ITEM_ACTIVE_FG = bbColors.navy900;

const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
  color: isActive ? NAV_ITEM_ACTIVE_FG : NAV_ITEM_INACTIVE,
  backgroundColor: isActive ? NAV_ITEM_ACTIVE_BG : 'transparent',
  fontSize: 12.5,
  fontWeight: isActive ? 800 : 600,
  padding: '8px 14px',
  borderRadius: 6,
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontFamily: bbFont.stack,
  whiteSpace: 'nowrap' as const,
});

const Header = () => {
  const { user } = useAuthStore();
  const { t } = useTranslation('navigation');
  const handleLogout = useLogout();
  const [userMenu, setUserMenu] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { unviewedCount: unviewedBookings } = useBookingsStore();
  const isUserRole = user?.roles?.some(role => role.roleName === UserRoleName.USER);

  // Poll the unviewed-bookings count whenever the admin shell is mounted.
  // First fetch on mount, then every 60s so a parked tab still surfaces
  // newly-arrived bookings without a manual refresh.
  useEffect(() => {
    if (!user || isUserRole) return undefined;
    refreshUnviewedBookingsCount();
    const id = window.setInterval(refreshUnviewedBookingsCount, 60_000);
    return () => window.clearInterval(id);
  }, [user, isUserRole]);

  if (!user || isUserRole) return null;

  const initials = `${user.name?.[0] ?? ''}${user.surname?.[0] ?? ''}`.toUpperCase() || 'B4';

  const Brand = (
    <Link to="/dashboard" style={{ textDecoration: 'none' }}>
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
        <Stack direction="row" alignItems="baseline" gap={0.75}>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: 14,
              letterSpacing: '-0.01em',
              color: '#fff',
              fontFamily: bbFont.stack,
            }}
          >
            boat4you
          </Typography>
          {/* "· Broker Desk" hidden below sm to keep the brand block compact on
              tight mobile widths; logomark + wordmark alone still read clean. */}
          <Box
            component="span"
            sx={{ color: bbColors.yellow500, display: { xs: 'none', sm: 'inline' } }}
          >
            ·
          </Box>
          <Typography
            sx={{
              fontSize: 11,
              color: NAV_ITEM_INACTIVE,
              fontWeight: 500,
              fontFamily: bbFont.stack,
              display: { xs: 'none', sm: 'inline' },
            }}
          >
            Broker Desk
          </Typography>
        </Stack>
      </Stack>
    </Link>
  );

  const NavBadge = ({ count }: { count: number }) => (
    <Box
      sx={{
        fontSize: 9.5,
        fontWeight: 800,
        padding: '1px 6px',
        borderRadius: 999,
        backgroundColor: bbColors.red600,
        color: '#fff',
        letterSpacing: '0.04em',
      }}
    >
      {count}
    </Box>
  );

  return (
    <>
      <AppBar
        elevation={0}
        position="fixed"
        sx={{
          backgroundColor: NAV_BG,
          color: '#fff',
          height: 54,
          justifyContent: 'center',
          borderBottom: 'none',
          fontFamily: bbFont.stack,
        }}
      >
        {/* CSS grid = 3 equal columns; Brand left, nav centered, right
            cluster right. On md-down, grid collapses to [brand | hamburger]
            so the bar stays tight on tablet / phone widths. */}
        <Box
          sx={{
            px: { xs: 1.5, sm: 2.5 },
            height: 54,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr auto', md: '1fr auto 1fr' },
            alignItems: 'center',
            gap: 2,
          }}
        >
          {/* --- Brand (left) --- */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>{Brand}</Box>

          {/* --- Nav (centered) --- Desktop only. */}
          <Stack
            direction="row"
            alignItems="center"
            gap={0.25}
            sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}
          >
            {navigation.map(item => {
              // Bookings gets a live count pulled from bookingsStore (polled
              // every 60s). Other nav items fall back to the static `news`
              // prop (currently unused but kept for future module alerts).
              const count = item.id === 'bookings' ? unviewedBookings : item.news ?? 0;
              return (
                <NavLink key={item.id} to={item.path || '/'} style={navLinkStyle}>
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
            gap={1.25}
            sx={{
              display: { xs: 'none', md: 'flex' },
              justifyContent: 'flex-end',
            }}
          >
            <LanguagePicker />
            <IconButton
              component={Link}
              to="/my-profile"
              size="small"
              sx={{
                width: 30,
                height: 30,
                borderRadius: '6px',
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.12)' },
              }}
            >
              <SettingsIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <Button
              onClick={e => setUserMenu(e.currentTarget)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                padding: '3px 12px 3px 3px',
                borderRadius: '999px',
                textTransform: 'none',
                color: '#fff',
                minWidth: 0,
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.12)' },
              }}
            >
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${bbColors.navy700}, ${bbColors.navy900})`,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 800,
                }}
              >
                {initials}
              </Box>
              <Typography
                sx={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: '#fff',
                  fontFamily: bbFont.stack,
                  display: { xs: 'none', lg: 'inline' },
                }}
              >
                {user.name} {user.surname}
              </Typography>
            </Button>
          </Stack>

          {/* --- Hamburger (mobile) --- */}
          <IconButton
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            sx={{
              display: { xs: 'inline-flex', md: 'none' },
              width: 34,
              height: 34,
              borderRadius: '6px',
              backgroundColor: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff',
              justifySelf: 'end',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.12)' },
            }}
          >
            <MenuIcon sx={{ fontSize: 20 }} />
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
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 200,
              border: `1px solid ${bbColors.gray200}`,
              borderRadius: '8px',
              boxShadow: '0 8px 24px -8px rgba(11,26,43,0.18)',
            },
          },
        }}
      >
        <MenuItem
          component={Link}
          to="/my-profile"
          onClick={() => setUserMenu(null)}
          sx={{ gap: 1, fontSize: 13, color: bbColors.navy900 }}
        >
          <SettingsIcon sx={{ fontSize: 16 }} />
          {t('profileSettings')}
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            setUserMenu(null);
            handleLogout();
          }}
          sx={{ gap: 1, fontSize: 13, color: bbColors.red600 }}
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
        PaperProps={{ sx: { width: 280, backgroundColor: NAV_BG, color: '#fff' } }}
      >
        <Stack sx={{ p: 2, gap: 1 }}>
          {/* User strip — mirrors the desktop pill but expanded so the
              broker sees their identity at the top of the drawer and can
              reach Profile / Logout without a nested menu. */}
          <Stack
            direction="row"
            alignItems="center"
            gap={1.25}
            sx={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '10px',
              p: 1.25,
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${bbColors.navy700}, ${bbColors.navy900})`,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              {initials}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                {user.name} {user.surname}
              </Typography>
              <Typography sx={{ fontSize: 11, color: NAV_ITEM_INACTIVE }}>Broker Desk</Typography>
            </Box>
          </Stack>

          <Stack sx={{ mt: 1, gap: 0.25 }}>
            {navigation.map(item => (
              <NavLink
                key={item.id}
                to={item.path || '/'}
                onClick={() => setDrawerOpen(false)}
                style={({ isActive }) => ({
                  ...navLinkStyle({ isActive }),
                  padding: '10px 14px',
                  fontSize: 13,
                  justifyContent: 'space-between',
                })}
              >
                <span>{t(item.id, item.id)}</span>
                {item.news ? <NavBadge count={item.news} /> : null}
              </NavLink>
            ))}
          </Stack>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)', my: 1 }} />

          <MenuItem
            component={Link}
            to="/my-profile"
            onClick={() => setDrawerOpen(false)}
            sx={{ gap: 1, fontSize: 13, color: '#fff', borderRadius: '6px' }}
          >
            <SettingsIcon sx={{ fontSize: 18 }} />
            {t('profileSettings')}
          </MenuItem>
          <MenuItem
            onClick={() => {
              setDrawerOpen(false);
              handleLogout();
            }}
            sx={{ gap: 1, fontSize: 13, color: '#ff9e8d', borderRadius: '6px' }}
          >
            <LogoutIcon sx={{ fontSize: 18 }} />
            {t('logout')}
          </MenuItem>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)', my: 1 }} />

          {/* Language switcher in the mobile drawer — same component as desktop
              right cluster but rendered inline so the broker can switch HR/EN
              without opening another drawer. */}
          <Box sx={{ px: 1, py: 0.5 }}>
            <LanguagePicker />
          </Box>
        </Stack>
      </Drawer>
    </>
  );
};

export default Header;
