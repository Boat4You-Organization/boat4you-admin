import { SVGProps } from 'react';

const Filters = ({
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
  <svg width={size} height={size} viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6 3.5a1 1 0 0 1 1 1v3.172a3 3 0 0 1 0 5.656V20.5a1 1 0 1 1-2 0v-7.172a2.999 2.999 0 0 1 0-5.656V4.5a1 1 0 0 1 1-1Zm6 0a1 1 0 0 1 1 1v9.172a2.999 2.999 0 0 1 0 5.656V20.5a1 1 0 1 1-2 0v-1.172a2.999 2.999 0 0 1 0-5.656V4.5a1 1 0 0 1 1-1Zm6 0a1 1 0 0 1 1 1v.172a3 3 0 0 1 0 5.656V20.5a1 1 0 1 1-2 0V10.328a2.999 2.999 0 0 1 0-5.656V4.5a1 1 0 0 1 1-1Zm0 3a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm-12 3a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm6 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"
      fill={variant === 'secondary' ? '#989898' : fill}
    />
  </svg>
);

export default Filters;
