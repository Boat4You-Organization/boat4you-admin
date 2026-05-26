import { SVGProps } from 'react';

const Blog = ({
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
  <svg width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M20 6a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6Zm2 12a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v12Z"
      fill={variant === 'secondary' ? '#DCDCDC' : fill}
    />
    <path
      d="M17 15a1 1 0 1 1 0 2H7a1 1 0 1 1 0-2h10Zm0-4a1 1 0 1 1 0 2H7a1 1 0 1 1 0-2h10Zm0-4a1 1 0 1 1 0 2H7a1 1 0 0 1 0-2h10Z"
      fill={variant === 'secondary' ? '#2856FF' : fill}
    />
  </svg>
);

export default Blog;
