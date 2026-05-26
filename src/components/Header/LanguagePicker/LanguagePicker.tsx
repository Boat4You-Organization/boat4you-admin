'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Icon, IconButton, SelectChangeEvent, Stack } from '@mui/material';

import ModalRoot from '@/components/ModalRoot';
import Select from '@/components/Select/Select';
import LanguageIcon from '@/components/SvgIcons/Language';
import { Locale } from '@/config/constants.config';
import locales from '@/config/locales.config';
import { Language } from '@/models/user.model';
import colors from '@/styles/themes/colors';
import useToggleState from '@/utils/hooks/useToggleState';
import { setLocale } from '@/valtio/locale/locale.actions';
import { useLocaleStore } from '@/valtio/locale/locale.store';

const LanguagePicker = () => {
  const { t } = useTranslation('navigation');
  const { currentLocale } = useLocaleStore();
  const [isOpen, toggleIsOpen] = useToggleState();

  const defaultLang = (locales.find(l => l.id === currentLocale.toUpperCase())?.id ||
    Locale.EN.toUpperCase()) as Language;

  const [tempSelectedLanguage, setTempSelectedLanguage] = useState<Language>(defaultLang);

  const handleLanguageChange = (event: SelectChangeEvent) => {
    setTempSelectedLanguage(event.target.value as Language);
  };

  const handleConfirm = () => {
    if (tempSelectedLanguage !== currentLocale.toUpperCase()) {
      setLocale(tempSelectedLanguage.toLowerCase());
    }

    toggleIsOpen();
  };

  const handleClose = () => {
    setTempSelectedLanguage(currentLocale.toUpperCase() as Language);
    toggleIsOpen();
  };

  return (
    <>
      <IconButton
        aria-label="language"
        onClick={toggleIsOpen}
        size="small"
        sx={{
          // Match the Settings/profile icon button stack in Header.tsx so the
          // top-right cluster reads as one cohesive group of dark glass pills.
          width: 30,
          height: 30,
          borderRadius: '6px',
          backgroundColor: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: '#fff',
          '&:hover': { backgroundColor: 'rgba(255,255,255,0.12)' },
        }}
      >
        <LanguageIcon size={16} fill={colors.white} />
      </IconButton>
      <ModalRoot
        open={isOpen}
        title={t('languagePicker.title')}
        onClose={handleClose}
        onConfirm={handleConfirm}
        confirmBtnText={t('languagePicker.savePreferences')}
        hideCancelButton
        width={453}
      >
        <Stack gap={3}>
          <Select
            value={tempSelectedLanguage}
            options={locales}
            onChange={handleLanguageChange}
            label={t('languagePicker.languageLabel')}
          />
        </Stack>
      </ModalRoot>
    </>
  );
};

export default LanguagePicker;
