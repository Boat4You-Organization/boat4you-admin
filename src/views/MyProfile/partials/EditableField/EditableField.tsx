'use client';

import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Button, Collapse, type SxProps, type Theme, Typography } from '@mui/material';

import { bbColors } from '@/styles/bb';
import colors from '@/styles/themes/colors';

import styles from './EditableField.module.scss';

type EditableFieldProps = {
  label: string;
  value: ReactNode;
  description: string;
  children: ReactNode;
  onToggleEdit: () => void;
  isAnotherEditing?: boolean;
  isEditing: boolean;
  isSubmitting?: boolean;
  sx?: SxProps<Theme>;
  /** Small line icon shown in the tinted chip at the start of the row. */
  icon?: ReactNode;
};

const EditableField = ({
  label,
  value,
  description,
  children,
  sx,
  isEditing,
  onToggleEdit,
  isAnotherEditing,
  isSubmitting,
  icon,
}: EditableFieldProps) => {
  const { t } = useTranslation('common');

  return (
    <Box
      className={`${styles.container} ${isEditing ? styles.editing : ''}`}
      sx={{
        ...(isAnotherEditing && {
          opacity: 0.5,
          pointerEvents: 'none',
        }),
        ...sx,
      }}
    >
      <Box className={styles.header}>
        <Box sx={{ display: 'flex', gap: 1.5, minWidth: 0 }}>
          {icon && (
            <Box
              aria-hidden
              sx={{
                flex: 'none',
                width: 32,
                height: 32,
                borderRadius: '10px',
                backgroundColor: isEditing ? bbColors.amber100 : bbColors.gray100,
                color: isEditing ? bbColors.amber800 : bbColors.gray600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {icon}
            </Box>
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography component="h2" sx={{ fontSize: 14, fontWeight: 700, color: colors.black }}>
              {label}
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: colors.black500, mt: '2px' }}>
              {isEditing ? description : value}
            </Typography>
          </Box>
        </Box>
        <Button variant="outlined" size="small" onClick={onToggleEdit} sx={{ flexShrink: 0 }}>
          {isEditing ? t('cancel') : t('edit')}
        </Button>
      </Box>

      <Collapse in={isEditing}>
        <Box className={styles.action}>
          {children}
          <Button type="submit" disabled={isSubmitting} sx={{ width: { xs: '100%', sm: 120 } }}>
            {isSubmitting ? t('saving') : t('save')}
          </Button>
        </Box>
      </Collapse>
    </Box>
  );
};

export default EditableField;
