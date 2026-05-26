import { Theme } from '@mui/material/styles';
import { CSSProperties } from '@mui/material/styles/createTypography';
import { SxProps } from '@mui/system';
import * as valtio from 'valtio';

declare module 'valtio' {
  function useSnapshot<T extends object>(p: T): T;
}

declare module '@mui/material/styles' {
  interface TypographyVariants {
    hero: CSSProperties;
    body3: CSSProperties;
  }

  interface TypographyVariantsOptions {
    hero?: CSSProperties;
    body3?: CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    inherit: false;
    h5: false;
    h6: false;
    caption: false;
    overline: false;
    subtitle1: false;
    subtitle2: false;
    body3: true;
    hero: true;
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    containedInfo: true;
    containedError: true;
    outlinedSecondary: true;
  }
}

declare module '@mui/material/styles' {
  interface Components {
    MuiPickersTextField?: {
      styleOverrides?: {
        root?: CSSProperties | ((props: { theme: Theme; ownerState: any }) => CSSProperties) | SxProps<Theme>;
      };
    };
  }
}
