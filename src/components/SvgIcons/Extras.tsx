import { SVGProps } from 'react';

const Extras = ({
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
      d="M18 3a1 1 0 0 1 1 1 1 1 0 0 0 1 1 1 1 0 1 1 0 2 1 1 0 0 0-1 1 1 1 0 1 1-2 0 1 1 0 0 0-1-1 1 1 0 1 1 0-2 1 1 0 0 0 1-1 1 1 0 0 1 1-1Zm0 12a1 1 0 0 1 1 1 1 1 0 0 0 1 1 1 1 0 1 1 0 2 1 1 0 0 0-1 1 1 1 0 1 1-2 0 1 1 0 0 0-1-1 1 1 0 1 1 0-2 1 1 0 0 0 1-1 1 1 0 0 1 1-1Z"
      clipRule="evenodd"
    />
    <path
      fill={variant === 'secondary' ? '#2856FF' : fill}
      fillRule="evenodd"
      d="M9 5a1 1 0 0 1 1 1 5 5 0 0 0 5 5 1 1 0 1 1 0 2 5 5 0 0 0-5 5 1 1 0 1 1-2 0 5 5 0 0 0-5-5 1 1 0 1 1 0-2 5 5 0 0 0 5-5 1 1 0 0 1 1-1Zm0 4.606A6.996 6.996 0 0 1 6.606 12 6.999 6.999 0 0 1 9 14.394 6.994 6.994 0 0 1 11.394 12 6.997 6.997 0 0 1 9 9.606Z"
      clipRule="evenodd"
    />
  </svg>
);

export default Extras;
