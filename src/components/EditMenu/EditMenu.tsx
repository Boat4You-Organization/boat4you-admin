import React, { PropsWithChildren, useState } from 'react';

import { IconButton, Menu, SxProps } from '@mui/material';

import Edit from '@/components/SvgIcons/Edit';
import colors from '@/styles/themes/colors';

export type originPosition = number | 'center' | 'top' | 'bottom';

interface EditMenuProps extends PropsWithChildren {
  anchorOriginVertical?: originPosition;
  transformOriginVertical?: originPosition;
  sx?: SxProps;
}

const EditMenu = ({ children, anchorOriginVertical, transformOriginVertical, sx }: EditMenuProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton onClick={handleClick}>
        <Edit size={24} fill={colors.black400} />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClick={handleClose}
        onClose={handleClose}
        anchorOrigin={{
          vertical: anchorOriginVertical || 'center',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: transformOriginVertical || 'center',
          horizontal: 'right',
        }}
        sx={sx}
      >
        {children}
      </Menu>
    </>
  );
};

export default EditMenu;
