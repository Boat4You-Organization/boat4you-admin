import { Box } from '@mui/material';

import { bbColors } from '@/styles/bb';

/** The Boat4You "B" (sail + hull counters) in a round badge — replaced the "B4" text tile (Mario 3.11.2026). */
const B_PATH =
  'M342 280 H700 C820 280 898 340 898 465 C898 530 870 575 835 595 C930 612 978 685 978 770 C978 905 860 1007 700 1007 H440 L342 910 Z M547 377 C650 405 735 470 743 540 C740 552 640 572 547 578 Z M502 710 H857 L775 820 C750 845 720 855 680 855 H502 Z';

interface BrandMarkProps {
  size?: number;
}

const BrandMark = ({ size = 30 }: BrandMarkProps) => (
  <Box
    component="svg"
    viewBox="67 92 1120 1120"
    role="img"
    aria-label="Boat4You"
    sx={{ width: size, height: size, flexShrink: 0, display: 'block' }}
  >
    <circle cx="627" cy="652" r="560" fill={bbColors.yellow500} />
    <path fill={bbColors.navy900} fillRule="evenodd" d={B_PATH} />
  </Box>
);

export default BrandMark;
