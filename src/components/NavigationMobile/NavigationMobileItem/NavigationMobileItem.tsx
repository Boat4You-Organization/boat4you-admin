import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

import { ListItem, ListItemButton, ListItemText, Stack } from '@mui/material';
import cx from 'clsx';

import Avatar from '@/components/Avatar/Avatar';
import ChevronRight from '@/components/SvgIcons/ChevronRight';
import { NavigationLink } from '@/config/navigation.config';
import colors from '@/styles/themes/colors';

import styles from './NavigationMobileItem.module.scss';

interface NavigationMobileItemProps extends NavigationLink {
  onClick?: () => void;
}

const NavigationMobileItem = ({ id, path, icon: Icon, onClick }: NavigationMobileItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === path;
  const isMyProfileLink = path === '/my-profile';
  const { t } = useTranslation();

  const renderIcon = () => {
    if (isMyProfileLink) return <Avatar name={id} />;

    if (!Icon) return null;

    return <Icon size={24} />;
  };

  const renderListItemContent = () => (
    <ListItem classes={{ root: styles.root }} className={cx(styles.container, { [styles.active]: isActive })}>
      <ListItemButton disableGutters className={styles.button} onClick={onClick}>
        <Stack direction="row" alignItems="center" gap={1.5}>
          {renderIcon()}
          <ListItemText
            primary={isMyProfileLink ? id : t(`navigation.${id}`)}
            sx={{ margin: 0, color: colors.white }}
          />
        </Stack>
        {path && <ChevronRight size={24} variant={isActive ? 'primary' : 'secondary'} />}
      </ListItemButton>
    </ListItem>
  );

  return path ? (
    <Link to={path} style={{ textDecoration: 'none' }}>
      {renderListItemContent()}
    </Link>
  ) : (
    renderListItemContent()
  );
};

export default NavigationMobileItem;
