import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

const useBreakpoint = () => {
  const { breakpoints } = useTheme();

  const isExtraSmall = useMediaQuery(() => breakpoints.down('xs'));
  const isMobile = useMediaQuery(() => breakpoints.down('sm'));
  const isTablet = useMediaQuery(() => breakpoints.between('sm', 'lg'));
  const isBelowLg = useMediaQuery(() => breakpoints.down('lg'));
  const isDesktop = useMediaQuery(() => breakpoints.up('lg'));

  return {
    isExtraSmall,
    isMobile,
    isTablet,
    isBelowLg,
    isDesktop,
  };
};

export default useBreakpoint;
