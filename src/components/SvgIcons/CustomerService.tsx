import { SVGProps } from 'react';

const CustomerService = ({
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
      fill={variant === 'secondary' ? '#2856FF' : fill}
      fillRule="evenodd"
      d="M18 18a1 1 0 0 1 1 1c0 1.411-1.118 2.42-2.31 3.016-1.252.626-2.911.984-4.69.984a1 1 0 1 1 0-2c1.535 0 2.876-.313 3.796-.773C16.774 19.737 17 19.246 17 19a1 1 0 0 1 1-1Z"
      clipRule="evenodd"
    />
    <path
      fill={variant === 'secondary' ? '#BDBDBD' : fill}
      fillRule="evenodd"
      d="M12 4a7 7 0 0 0-7 7v.172A3 3 0 0 1 6 11h1a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-6a9 9 0 1 1 18 0v6a3 3 0 0 1-3 3h-1a3 3 0 0 1-3-3v-3a3 3 0 0 1 3-3h1a3 3 0 0 1 1 .172V11a7 7 0 0 0-7-7Zm7 10a1 1 0 0 0-1-1h-1a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-3ZM5 14v3a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1Z"
      clipRule="evenodd"
    />
  </svg>
);

export default CustomerService;
