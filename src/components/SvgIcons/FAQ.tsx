import { SVGProps } from 'react';

const FAQ = ({
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
      d="M6 5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2a1 1 0 0 1 1 1v1.234l3.486-2.092A1 1 0 0 1 13 17h1a1 1 0 1 1 0 2h-.723l-4.762 2.858A1 1 0 0 1 7 21v-2H6a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v4.5a1 1 0 1 1-2 0V7a2 2 0 0 0-2-2H6Z"
      clipRule="evenodd"
    />
    <path
      fill={variant === 'secondary' ? '#2856FF' : fill}
      d="M18.427 14.058a2.98 2.98 0 0 1 1.943.27l.003.002a3.003 3.003 0 0 1-1.37 5.67 1 1 0 1 1-.006-2 1.003 1.003 0 0 0 .46-1.893.98.98 0 0 0-1.194.24 1 1 0 0 1-1.526-1.292s1.03-.865 1.69-.997ZM19 21a1 1 0 0 1 1 1v.01a1 1 0 1 1-2 0V22a1 1 0 0 1 1-1ZM8 12a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2H8Zm0-4a1 1 0 0 0 0 2h8a1 1 0 1 0 0-2H8Z"
    />
  </svg>
);

export default FAQ;
