import React from 'react';

import Header from '@/components/Header';

import styles from './Layout.module.scss';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => (
  <>
    <Header />
    <main className={styles.main}>{children}</main>
  </>
);

export default Layout;
