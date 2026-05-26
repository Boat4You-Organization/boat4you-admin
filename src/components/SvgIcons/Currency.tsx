import { SVGProps } from 'react';

const Currency = ({
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
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.236 4.649a6.212 6.212 0 0 1 4.108-.5c1.385.308 2.636 1.081 3.609 2.193a1 1 0 1 1-1.505 1.316c-.716-.817-1.603-1.349-2.539-1.558a4.212 4.212 0 0 0-2.792.345c-.893.437-1.68 1.186-2.244 2.176-.07.123-.137.25-.2.379H6.511c.168-.475.376-.934.624-1.369.744-1.306 1.816-2.352 3.101-2.982ZM6.001 12h2c0 .337.024.672.07 1H6.056A9.151 9.151 0 0 1 6 12Zm.936 4c.063.125.129.248.198.37.744 1.305 1.816 2.351 3.101 2.981 1.29.632 2.72.81 4.108.5 1.385-.308 2.636-1.081 3.609-2.193a1 1 0 1 0-1.505-1.316c-.716.817-1.603 1.35-2.539 1.558a4.212 4.212 0 0 1-2.792-.345A5.134 5.134 0 0 1 9.278 16H6.937Z"
      fill={variant === 'secondary' ? '#DCDCDC' : fill}
    />
    <path
      d="M13 9H5a1 1 0 0 0 0 2h8a1 1 0 1 0 0-2ZM13 13H5a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2Z"
      fill={variant === 'secondary' ? '#2856FF' : fill}
    />
  </svg>
);

export default Currency;
