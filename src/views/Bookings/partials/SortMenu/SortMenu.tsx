import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import SwapVertIcon from '@mui/icons-material/SwapVert';
import { Button, ListItemText, Menu, MenuItem, Stack, Typography } from '@mui/material';

import { SortDirection } from '@/config/constants.config';
import colors from '@/styles/themes/colors';

export interface SortOption {
  /** JPA property name passed to the backend as `sort=key,asc`. */
  key: string;
  /** i18n key for the menu label (e.g. `table.bookings.order-number`). */
  label: string;
}

interface SortMenuProps {
  options: SortOption[];
  activeSort: string;
  activeDirection: SortDirection;
  onSort: (key: string, direction: SortDirection) => void;
}

/**
 * Standalone "Sort" button that opens a dropdown of allowed sort keys. Each
 * option shows ASC/DESC sub-actions and clears when the same key + direction
 * is picked twice. Used as the right-side slot in Bookings header.
 */
const SortMenu = ({ options, activeSort, activeDirection, onSort }: SortMenuProps) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handlePick = (key: string, direction: SortDirection) => {
    onSort(key, direction);
    handleClose();
  };

  const handleClear = () => {
    onSort('', 'asc');
    handleClose();
  };

  const activeLabel = options.find(o => o.key === activeSort)?.label;

  return (
    <>
      <Button
        size="large"
        variant="outlined"
        startIcon={<SwapVertIcon />}
        onClick={handleOpen}
        sx={{ whiteSpace: 'nowrap' }}
      >
        {activeLabel ? `${t('actions.sort')}: ${t(activeLabel)} ${activeDirection === 'asc' ? '↑' : '↓'}` : t('actions.sort')}
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {options.map(opt => (
          <MenuItem key={opt.key} sx={{ py: 0 }} disableRipple>
            <Stack direction="row" alignItems="center" gap={1} width="100%">
              <ListItemText primary={t(opt.label)} />
              <Button
                size="small"
                variant={activeSort === opt.key && activeDirection === 'asc' ? 'contained' : 'text'}
                onClick={() => handlePick(opt.key, 'asc')}
              >
                <Typography variant="body2">A → Z</Typography>
              </Button>
              <Button
                size="small"
                variant={activeSort === opt.key && activeDirection === 'desc' ? 'contained' : 'text'}
                onClick={() => handlePick(opt.key, 'desc')}
              >
                <Typography variant="body2">Z → A</Typography>
              </Button>
            </Stack>
          </MenuItem>
        ))}
        {activeSort && (
          <MenuItem onClick={handleClear}>
            <Typography variant="body2" color={colors.red500}>
              {t('actions.clear')}
            </Typography>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default SortMenu;
