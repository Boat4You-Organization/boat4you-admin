import { ThemeOptions } from '@mui/material';

import { bbColors } from '@/styles/bb';

// `primary` is navy: it drives checkboxes, switches, focus and text/outlined buttons. The yellow
// call-to-action is the contained primary button, styled in components.ts.
const palette: ThemeOptions['palette'] = {
  primary: {
    main: bbColors.navy900,
    contrastText: bbColors.white,
  },
  secondary: {
    main: bbColors.navy900,
    contrastText: bbColors.white,
  },
  error: {
    main: bbColors.red600,
    dark: bbColors.red700,
    contrastText: bbColors.white,
  },
  warning: {
    main: bbColors.amber700,
    contrastText: bbColors.white,
  },
  success: {
    main: bbColors.green600,
    contrastText: bbColors.white,
  },
  info: {
    main: bbColors.navy700,
    contrastText: bbColors.white,
  },
  text: {
    primary: bbColors.navy900,
    secondary: bbColors.gray500,
    disabled: bbColors.gray450,
  },
  divider: bbColors.gray200,
  background: {
    default: bbColors.gray50,
    paper: bbColors.white,
  },
};

export default palette;
