import { SVGProps } from 'react';

const Dimensions = ({
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
      d="M5 11a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1H5ZM2.879 9.879A3 3 0 0 1 5 9h7a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-7a3 3 0 0 1 .879-2.121Z"
      fill={variant === 'secondary' ? '#BDBDBD' : fill}
    />
    <path
      d="M5.707 2.293a1 1 0 0 1 0 1.414L5.414 4h6.172l-.293-.293a1 1 0 0 1 1.414-1.414l2 2a1 1 0 0 1 0 1.414l-2 2a1 1 0 1 1-1.414-1.414L11.586 6H5.414l.293.293a1 1 0 0 1-1.414 1.414l-2-2a1 1 0 0 1 0-1.414l2-2a1 1 0 0 1 1.414 0ZM18.293 9.293a1 1 0 0 1 1.414 0l2 2a1 1 0 0 1-1.414 1.414L20 12.414v6.172l.293-.293a1 1 0 0 1 1.414 1.414l-2 2a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414l.293.293v-6.172l-.293.293a1 1 0 0 1-1.414-1.414l2-2Z"
      fill={variant === 'secondary' ? '#2856FF' : fill}
    />
  </svg>
);

export default Dimensions;
