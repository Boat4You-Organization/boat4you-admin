import { SVGProps } from 'react';

const CheckAgency = ({
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
      fill={variant === 'secondary' ? '#2856FF' : fill}
      fillRule="evenodd"
      d="M20.707 6.293a1 1 0 0 1 0 1.414l-10 10a1 1 0 0 1-1.414 0l-5-5a1 1 0 1 1 1.414-1.414L10 15.586l9.293-9.293a1 1 0 0 1 1.414 0Z"
      clipRule="evenodd"
    />
  </svg>
);

export default CheckAgency;
