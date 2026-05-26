'use client';

import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Button, Collapse, type SxProps, type Theme, Typography } from '@mui/material';

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
}: EditableFieldProps) => {
  const { t } = useTranslation('common');

  return (
    <Box
      className={styles.container}
      sx={{
        ...(isAnotherEditing && {
          opacity: 0.5,
          pointerEvents: 'none',
        }),
        ...sx,
      }}
    >
      <Box className={styles.header}>
        <Box>
          <Typography variant="h4" component="h2" fontWeight={700}>
            {label}
          </Typography>
          <Typography variant="body1" color={colors.black500} mt={1}>
            {isEditing ? description : value}
          </Typography>
        </Box>
        <Button variant="text" onClick={onToggleEdit} className={styles.editButton}>
          {isEditing ? t('cancel') : t('edit')}
        </Button>
      </Box>

      <Collapse in={isEditing}>
        <Box className={styles.action}>
          {children}
          <Button
            color="secondary"
            size="large"
            type="submit"
            disabled={isSubmitting}
            sx={{ width: { xs: '100%', sm: 120 } }}
          >
            {isSubmitting ? t('saving') : t('save')}
          </Button>
        </Box>
      </Collapse>
    </Box>
  );
};

export default EditableField;
