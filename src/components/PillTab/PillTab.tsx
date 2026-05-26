import React from 'react';

import { Tab, TabProps } from '@mui/material';

import styles from './PillTab.module.scss';

const PillTab = ({ value, label, title, ...props }: TabProps) => (
  <Tab
    classes={{
      root: styles.root,
      selected: styles.selected,
    }}
    className={styles.container}
    value={value}
    label={label}
    title={title}
    {...props}
  />
);

export default PillTab;
