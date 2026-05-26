import React from 'react';

import Box from '@mui/material/Box';
import cx from 'clsx';

import styles from './HamburgerMenu.module.scss';

interface HamburgerMenuProps {
  open: boolean;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ open }) => (
  <Box className={styles.hamburgerMenu}>
    <Box className={cx(styles.bar, { [styles.open]: open })} />
    <Box className={cx(styles.bar, { [styles.open]: open })} />
    <Box className={cx(styles.bar, { [styles.open]: open })} />
  </Box>
);

export default HamburgerMenu;
