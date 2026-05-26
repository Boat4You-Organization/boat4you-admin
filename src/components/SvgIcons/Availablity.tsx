import { SVGProps } from 'react';

const Availablity = ({
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
      fillRule="evenodd"
      d="M8 2a1 1 0 0 1 1 1v1h6V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v6a1 1 0 1 1-2 0v-1H5v7a1 1 0 0 0 1 1h5.5a1 1 0 1 1 0 2H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1ZM7 6H6a1 1 0 0 0-1 1v3h14V7a1 1 0 0 0-1-1h-1v1a1 1 0 1 1-2 0V6H9v1a1 1 0 0 1-2 0V6Z"
      clipRule="evenodd"
    />
    <path
      fill={variant === 'secondary' ? '#2856FF' : fill}
      fillRule="evenodd"
      d="M21.707 16.293a1 1 0 0 1 0 1.414l-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L17 19.586l3.293-3.293a1 1 0 0 1 1.414 0Z"
      clipRule="evenodd"
    />
  </svg>
);

export default Availablity;
