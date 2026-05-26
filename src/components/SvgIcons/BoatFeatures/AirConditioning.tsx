import { SVGProps } from 'react';

const AirConditioning = ({
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
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5 6a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h1v-2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2h1a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H5Zm14 8a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3v4a3 3 0 0 0 3 3h14Zm-3-2v-2H8v2h8Z"
      fill={variant === 'secondary' ? '#BDBDBD' : fill}
    />
    <path
      d="M8 15a1 1 0 0 1 1 1 4 4 0 0 1-4 4 1 1 0 1 1 0-2 2 2 0 0 0 2-2 1 1 0 0 1 1-1ZM12 15a1 1 0 0 1 1 1v4a1 1 0 1 1-2 0v-4a1 1 0 0 1 1-1ZM16 15a1 1 0 0 1 1 1 2 2 0 0 0 2 2 1 1 0 1 1 0 2 4 4 0 0 1-4-4 1 1 0 0 1 1-1Z"
      fill={variant === 'secondary' ? '#2856FF' : fill}
    />
  </svg>
);

export default AirConditioning;
