import { SVGProps } from 'react';

const Clock = ({
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
      d="M40 24a16.001 16.001 0 0 0-27.315-11.315A16.001 16.001 0 0 0 24 40l.787-.02A16 16 0 0 0 40 24Zm4 0a20.002 20.002 0 0 1-12.346 18.478 20.003 20.003 0 0 1-6.67 1.499L24 44A20.002 20.002 0 0 1 5.521 31.654 20.002 20.002 0 0 1 38.143 9.857 20 20 0 0 1 44 24Z"
      fill={variant === 'secondary' ? '#BDBDBD' : fill}
    />
    <path
      d="M22 14a2 2 0 1 1 4 0v9.172l5.414 5.414.137.152a2 2 0 0 1-2.813 2.813l-.152-.137-6-6A2 2 0 0 1 22 24V14Z"
      fill={variant === 'secondary' ? '#2856FF' : fill}
    />
  </svg>
);

export default Clock;
