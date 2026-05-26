import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Button, Divider, List, Stack, Typography } from '@mui/material';

import navigationMobile from '@/config/navigationMobile.config';
import colors from '@/styles/themes/colors';
import useLogout from '@/utils/hooks/useLogout';
import { useAuthStore } from '@/valtio/auth/auth.store';

import styles from './NavigationMobile.module.scss';
import NavigationMobileItem from './NavigationMobileItem';
import LanguageModal from './partials/LanguageModal';

const NavigationMobile = () => {
  const { user } = useAuthStore();
  const { t } = useTranslation('navigation');
  const [languageModalOpen, setLanguageModalOpen] = useState<boolean>(false);
  const handleLogout = useLogout();

  const handleLanguageClick = () => {
    setLanguageModalOpen(true);
  };

  const getClickHandler = (id: string) => {
    switch (id) {
      case 'preferences.language':
        return handleLanguageClick;
      default:
        return undefined;
    }
  };

  return (
    <>
      <LanguageModal isOpen={languageModalOpen} onClose={() => setLanguageModalOpen(false)} />
      <Box component="nav" className={styles.container}>
        <List className={styles.list}>
          {navigationMobile.map((item, index) => (
            <Stack key={item.title}>
              <Typography variant="h4" component="h2" fontWeight={700} mb={2} px={2} color={colors.white}>
                {t(item.title)}
              </Typography>
              {item.links.map(link => (
                <NavigationMobileItem key={link.id} {...link} onClick={getClickHandler(link.id)} />
              ))}
              {index < navigationMobile.length - 1 && (
                <Divider
                  sx={{
                    '&.MuiDivider-root': {
                      mx: 2,
                    },
                  }}
                />
              )}
            </Stack>
          ))}
          {user && <NavigationMobileItem id={`${user.name} ${user.surname}`} path="/my-profile" />}
        </List>
        <Box className={styles.buttonWrapper}>
          <Button color="error" size="large" onClick={handleLogout} fullWidth className={styles.button}>
            {t('logout')}
          </Button>
        </Box>
      </Box>
    </>
  );
};

export default NavigationMobile;
