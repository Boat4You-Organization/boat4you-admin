import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';

import { Box, Stack } from '@mui/material';
import cx from 'clsx';

import navigation from '@/config/navigation.config';

import styles from './Navigation.module.scss';

const Navigation = () => {
  const { t } = useTranslation();

  return (
    <Stack direction="row" spacing={2}>
      {navigation?.map(item => (
        <Box key={item.id} className={styles.navItem}>
          <NavLink to={item.path || '/'} className={({ isActive }) => cx(styles.navLink, isActive && styles.active)}>
            {t(`navigation.${item.id}`)}
            {item.news && <Box className={styles.badge}>{item.news}</Box>}
          </NavLink>
        </Box>
      ))}
    </Stack>
  );
};

export default Navigation;
