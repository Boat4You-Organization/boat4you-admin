import { ThemeOptions } from '@mui/material';

import colors from './colors';

const palette: ThemeOptions['palette'] = {
  primary: {
    main: colors.blue500,
    contrastText: colors.white,
  },
  secondary: {
    main: colors.black,
    contrastText: colors.white,
  },
  error: {
    main: colors.red500,
  },
  warning: {
    main: colors.yellow500,
  },
  success: {
    main: colors.green500,
  },
  info: {
    main: colors.blue500,
  },
};

export default palette;
