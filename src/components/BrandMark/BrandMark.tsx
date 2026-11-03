import { useId } from 'react';

import { Box } from '@mui/material';

/**
 * The Boat4You "B" (sail + hull counters) in a round badge — replaced the "B4" text tile (Mario 3.11.2026).
 * Badge in the boat4you.com hero blue (#1F35D0 → #1722B6 → #19238F), white letter (Mario 3.11.2026).
 */
const B_PATH =
  'M342 280 H700 C820 280 898 340 898 465 C898 530 870 575 835 595 C930 612 978 685 978 770 C978 905 860 1007 700 1007 H440 L342 910 Z M547 377 C650 405 735 470 743 540 C740 552 640 572 547 578 Z M502 710 H857 L775 820 C750 845 720 855 680 855 H502 Z';

interface BrandMarkProps {
  size?: number;
}

const BrandMark = ({ size = 30 }: BrandMarkProps) => {
  // A per-instance gradient id: the mark renders several times on one page (header, auth shell).
  const gradientId = `b4y-mark-${useId().replace(/:/g, '')}`;

  return (
    <Box
      component="svg"
      viewBox="67 92 1120 1120"
      role="img"
      aria-label="Boat4You"
      sx={{ width: size, height: size, flexShrink: 0, display: 'block' }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1F35D0" />
          <stop offset="0.55" stopColor="#1722B6" />
          <stop offset="1" stopColor="#19238F" />
        </linearGradient>
      </defs>
      <circle cx="627" cy="652" r="560" fill={`url(#${gradientId})`} />
      <path fill="#FFFFFF" fillRule="evenodd" d={B_PATH} />
    </Box>
  );
};

export default BrandMark;
