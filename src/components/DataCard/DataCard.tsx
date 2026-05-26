import { ElementType } from 'react';

import { Box, ChipProps, Stack, Typography } from '@mui/material';

import EditMenu from '@/components/EditMenu';
import StatusChip from '@/components/StatusChip';
import colors from '@/styles/themes/colors';

import styles from './DataCard.module.scss';

export interface DataCardItem {
  text: string;
  icon?: ElementType;
  label?: string;
  avatar?: React.ReactNode;
}

export interface DataCardProps {
  title: string;
  description?: string;
  avatar?: React.ReactNode;
  chipLabel?: ChipProps['label'];
  chipColor?: ChipProps['color'];
  date?: string;
  items?: DataCardItem[];
  rowActions?: (itemIndex: number) => React.ReactNode;
  rowIndex: number;
  dataId?: string;
  onCardClick?: (event: React.MouseEvent<HTMLElement>) => void;
  showSkeleton?: boolean;
}

const DataCard = ({
  title,
  description,
  avatar,
  chipLabel,
  chipColor,
  date,
  items,
  rowActions,
  rowIndex,
  dataId,
  onCardClick,
}: DataCardProps) => {
  const titleWithoutChip = !chipLabel && title;

  const renderSingleColumnItems = () =>
    items && (
      <Stack spacing={2} mt={0.5}>
        {items.map(({ text, icon: Icon, avatar: avatarIcon }) => (
          <Stack key={text} direction="row" alignItems="center" gap={1}>
            {Icon && <Icon width={24} height={24} size={24} variant="secondary" />}
            {avatarIcon && <Box>{avatarIcon}</Box>}
            <Typography variant="body1" color={colors.black950}>
              {text}
            </Typography>
          </Stack>
        ))}
      </Stack>
    );

  const renderTitleContent = () => {
    if (titleWithoutChip) {
      return (
        <Typography variant="h3" fontWeight={700} color={colors.black950} sx={{ wordBreak: 'break-word' }}>
          {title}
        </Typography>
      );
    }

    if (avatar) {
      return (
        <Stack direction="row" gap={1.5}>
          <Stack direction="row" alignItems="center" spacing={1}>
            {avatar}
            <Typography variant="h3" fontWeight={700} color={colors.black950}>
              {title}
            </Typography>
          </Stack>
          <StatusChip label={chipLabel} color={chipColor} />
        </Stack>
      );
    }

    return (
      <Stack direction="column" alignItems="start" gap={1}>
        <StatusChip label={chipLabel} color={chipColor} />
        <Typography variant="h3" fontWeight={700} color={colors.black950} sx={{ wordBreak: 'break-word' }}>
          {title}
        </Typography>
      </Stack>
    );
  };

  return (
    <Box className={styles.container} onClick={onCardClick} data-id={dataId}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        {renderTitleContent()}
        {rowActions && (
          <EditMenu
            anchorOriginVertical="top"
            transformOriginVertical="top"
            sx={{
              '& .MuiPaper-root': {
                width: 184,
                boxShadow: '0px 4px 35px 0px rgba(0, 0, 0, 0.15)',
              },
            }}
          >
            {typeof rowActions === 'function' ? rowActions(rowIndex) : rowActions}
          </EditMenu>
        )}
      </Stack>
      {description && (
        <Typography variant="body1" color={colors.black500}>
          {description}
        </Typography>
      )}
      {renderSingleColumnItems()}
      {date && (
        <Typography variant="body2" color={colors.black500} textAlign="end" mt={2}>
          {date}
        </Typography>
      )}
    </Box>
  );
};

export default DataCard;
