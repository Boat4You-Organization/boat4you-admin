import { SVGProps } from 'react';

const Email = ({
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
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M4 34V14a2 2 0 1 1 4 0v20a2 2 0 0 0 2 2h28a2 2 0 0 0 2-2V14a2 2 0 1 1 4 0v20a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6Z"
      fill={variant === 'secondary' ? '#BDBDBD' : fill}
    />
    <path
      d="M38 8a6 6 0 0 1 6 6 2 2 0 0 1-.89 1.664l-18 12a2 2 0 0 1-1.96.146l-.26-.146-18-12A2 2 0 0 1 4 14a6 6 0 0 1 6-6h28ZM9.803 12.01a2 2 0 0 0-1.578 1.07L24 23.596 39.773 13.08a1.995 1.995 0 0 0-1.576-1.07L38 12H10l-.197.01Z"
      fill={variant === 'secondary' ? '#2856FF' : fill}
    />
  </svg>
);

export default Email;
