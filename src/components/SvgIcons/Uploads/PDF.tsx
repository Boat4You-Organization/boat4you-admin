import { SVGProps } from 'react';

const PDFIcon = ({
  props,
  variant = 'primary',
  fill = 'currentColor',
  size = '1rem',
}: {
  props?: SVGProps<SVGSVGElement>;
  variant?: 'primary' | 'secondary';
  fill?: string;
  size?: string | number;
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <path
      fill={variant === 'secondary' ? '#BDBDBD' : fill}
      d="M4 12V5a3 3 0 0 1 3-3h7l.099.005a1 1 0 0 1 .608.288l5 5A1 1 0 0 1 20 8v4a1 1 0 1 1-2 0V9h-3a2 2 0 0 1-2-2V4H7a1 1 0 0 0-1 1v7a1 1 0 1 1-2 0Zm12.586-5L15 5.414V7h1.586Z"
    />
    <path
      fill={variant === 'secondary' ? '#2856FF' : fill}
      d="M7 16.5a.5.5 0 0 0-.402-.49L6.5 16H6v1h.5a.5.5 0 0 0 .5-.5Zm6 .5a1 1 0 0 0-1-1v4a1 1 0 0 0 1-1v-2Zm3 4v-6a1 1 0 0 1 1-1h3a1 1 0 1 1 0 2h-2v1h1a1 1 0 1 1 0 2h-1v2a1 1 0 1 1-2 0Zm-1-2a3 3 0 0 1-3 3h-1a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h1a3 3 0 0 1 3 3v2Zm-6-2.5A2.5 2.5 0 0 1 6.5 19H6v2a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1h1.5A2.5 2.5 0 0 1 9 16.5Z"
    />
  </svg>
);

export default PDFIcon;
