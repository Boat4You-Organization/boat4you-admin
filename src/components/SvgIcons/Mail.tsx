import { SVGProps } from 'react';

const Mail = ({
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
      d="M2 17V7a1 1 0 0 1 2 0v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7a1 1 0 1 1 2 0v10a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3Z"
    />
    <path
      fill={variant === 'secondary' ? '#2856FF' : fill}
      d="M19 4a3 3 0 0 1 3 3 1 1 0 0 1-.445.832l-9 6a1 1 0 0 1-.98.073l-.13-.073-9-6A1 1 0 0 1 2 7a3 3 0 0 1 3-3h14ZM4.901 6.005a1 1 0 0 0-.789.535L12 11.798l7.887-5.258a.998.998 0 0 0-.788-.535L19 6H5l-.099.005Z"
    />
  </svg>
);

export default Mail;
