import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { List, ListItem, ListItemButton, ListItemText } from '@mui/material';

import SwipeableModal from '@/components/ModalRoot/SwipeableModal';
import Check from '@/components/SvgIcons/Check';
import { Locale } from '@/config/constants.config';
import locales from '@/config/locales.config';
import { Language } from '@/models/user.model';
import colors from '@/styles/themes/colors';
import { setLocale } from '@/valtio/locale/locale.actions';
import { useLocaleStore } from '@/valtio/locale/locale.store';

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LanguageModal = ({ isOpen, onClose }: LanguageModalProps) => {
  const { t } = useTranslation('navigation');
  const { currentLocale } = useLocaleStore();

  const defaultLang = (locales.find(l => l.id === currentLocale.toUpperCase())?.id ||
    Locale.EN.toUpperCase()) as Language;

  const [tempSelectedLanguage, setTempSelectedLanguage] = useState<Language>(defaultLang);

  const handleLanguageSelect = (localeId: string) => {
    setTempSelectedLanguage(localeId as Language);
  };

  const handleConfirm = () => {
    if (tempSelectedLanguage !== currentLocale.toUpperCase()) {
      setLocale(tempSelectedLanguage.toLowerCase());
    }

    onClose();
  };

  return (
    <SwipeableModal
      open={isOpen}
      onClose={onClose}
      title={t('languagePicker.title')}
      confirmBtnText={t('languagePicker.savePreferences')}
      onConfirm={handleConfirm}
      hideCancelButton
    >
      <List>
        {locales.map(option => {
          const isSelected = tempSelectedLanguage === option.id;

          return (
            <ListItem
              key={option.id}
              sx={{ backgroundColor: isSelected ? colors.blue50 : 'transparent', borderRadius: '12px' }}
            >
              <ListItemButton onClick={() => handleLanguageSelect(option.id)}>
                <ListItemText primary={option.label} />
                {isSelected && <Check size={24} fill={colors.blue500} />}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </SwipeableModal>
  );
};

export default LanguageModal;
