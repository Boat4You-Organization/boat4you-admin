import { SVGProps } from 'react';

const Contact = ({
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
      d="M19 6a1 1 0 0 0-.901-.995L18 5H8a1 1 0 0 0-1 1v1a1 1 0 0 1 0 2v2a1 1 0 1 1 0 2v2a1 1 0 1 1 0 2v1l.005.099A1 1 0 0 0 8 19h10a1 1 0 0 0 1-1V6Zm2 12a3 3 0 0 1-3 3H8a3 3 0 0 1-2.985-2.703L5 18v-1H4a1 1 0 1 1 0-2h1v-2H4a1 1 0 1 1 0-2h1V9H4a1 1 0 0 1 0-2h1V6a3 3 0 0 1 3-3h10l.297.015A3 3 0 0 1 21 6v12Z"
      fill={variant === 'secondary' ? '#DCDCDC' : fill}
    />
    <path
      d="M16 15a1 1 0 1 1 0 2h-6a1 1 0 1 1 0-2h6Zm-2-4a1 1 0 1 0-2 0 1 1 0 0 0 2 0Zm2 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      fill={variant === 'secondary' ? '#2856FF' : fill}
    />
  </svg>
);

export default Contact;
