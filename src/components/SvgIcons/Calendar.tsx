import { SVGProps } from 'react';

const Calendar = ({
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
      d="M8 2a1 1 0 0 1 1 1v1h6V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1ZM7 6H6a1 1 0 0 0-1 1v3h14V7a1 1 0 0 0-1-1h-1v1a1 1 0 1 1-2 0V6H9v1a1 1 0 0 1-2 0V6Zm12 6H5v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7Z"
      fill={variant === 'secondary' ? '#BDBDBD' : fill}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7 15a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-2Z"
      fill={variant === 'secondary' ? '#2856FF' : fill}
    />
  </svg>
);

export default Calendar;
