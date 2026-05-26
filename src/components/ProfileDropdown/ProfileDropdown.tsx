import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Button, Divider, IconButton, Menu, MenuItem, Typography } from '@mui/material';

import Avatar from '@/components/Avatar';
import Logout from '@/components/SvgIcons/ProfileDropdown/Logout';
import Settings from '@/components/SvgIcons/ProfileDropdown/Settings';
import { UserRoleName } from '@/models/user.model';
import colors from '@/styles/themes/colors';
import useLogout from '@/utils/hooks/useLogout';
import { useAuthStore } from '@/valtio/auth/auth.store';

import styles from './ProfileDropdown.module.scss';

const ProfileDropdown = () => {
  const { user } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { t } = useTranslation('navigation');
  const handleLogout = useLogout();
  const isUserRole = user?.roles?.some(role => role.roleName === UserRoleName.USER);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        variant="contained"
        onClick={handleClick}
        classes={{ root: styles.buttonDesktopRoot }}
        className={styles.desktopButton}
      >
        <Avatar name={`${user?.name} ${user?.surname}`} />
        <Typography variant="body1">
          {user?.name} {user?.surname}
        </Typography>
      </Button>
      <IconButton onClick={handleClick} classes={{ root: styles.buttonMobileRoot }} className={styles.mobileButton}>
        <Avatar name={`${user?.name} ${user?.surname}`} />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        classes={{ root: styles.menuRoot, paper: styles.paper, list: styles.list }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {!isUserRole && (
          <Link to="/my-profile">
            <MenuItem onClick={handleClose} className={styles.menuItem}>
              <Settings />
              <Typography variant="body2">{t('profileSettings')}</Typography>
            </MenuItem>
          </Link>
        )}
        {!isUserRole && <Divider />}
        <Button fullWidth color="error" onClick={handleLogout} className={styles.logoutButton}>
          <Logout fill={colors.red500} />
          {t('logout')}
        </Button>
      </Menu>
    </>
  );
};

export default ProfileDropdown;
