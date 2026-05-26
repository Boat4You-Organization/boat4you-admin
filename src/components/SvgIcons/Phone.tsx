import { SVGProps } from 'react';

const Phone = ({
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
      d="m21 2 .102.005A1 1 0 0 1 22 3v8a1 1 0 0 1-1 1h-2.764l-3.789 1.895A1 1 0 0 1 13 13v-1h-2a1 1 0 0 1-1-1V3l.005-.103A1 1 0 0 1 11 2h10Zm-9 8h2a1 1 0 0 1 1 1v.382l2.553-1.277.106-.045A1 1 0 0 1 18 10h2V4h-8v6Z"
    />
    <path
      fill={variant === 'secondary' ? '#2856FF' : fill}
      d="M4 20V6a2 2 0 0 1 2-2h2a1 1 0 0 1 0 2H6v14h8v-4a1 1 0 1 1 2 0v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Zm5-1.99V18a1 1 0 1 1 2 0v.01a1 1 0 1 1-2 0Z"
    />
  </svg>
);

export default Phone;
