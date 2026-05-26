import { SVGProps } from 'react';

const EmergencyNumber = ({
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
      d="M12 40V12a4 4 0 0 1 4-4h10a2 2 0 1 1 0 4H16v28h16v-8a2 2 0 1 1 4 0v8a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4Zm10-3.98V36a2 2 0 1 1 4 0v.02a2 2 0 1 1-4 0Z"
      fill={variant === 'secondary' ? '#BDBDBD' : fill}
    />
    <path d="M32 24v.02a2 2 0 1 0 4 0V24a2 2 0 1 0-4 0Z" fill={variant === 'secondary' ? '#FF2828' : fill} />
    <rect x="32" y="4" width="4" height="16" rx="2" fill={variant === 'secondary' ? '#FF2828' : fill} />
  </svg>
);

export default EmergencyNumber;
