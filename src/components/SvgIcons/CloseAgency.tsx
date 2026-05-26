import { SVGProps } from 'react';

const CloseAgency = ({
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
      fill={variant === 'secondary' ? '#FF2828' : fill}
      fillRule="evenodd"
      d="M4.41 4.41a.833.833 0 0 1 1.18 0L10 8.822l4.41-4.41a.833.833 0 1 1 1.18 1.178L11.177 10l4.411 4.41a.833.833 0 1 1-1.178 1.18L10 11.177 5.59 15.59a.833.833 0 0 1-1.18-1.178L8.822 10l-4.41-4.41a.833.833 0 0 1 0-1.18Z"
      clipRule="evenodd"
    />
  </svg>
);

export default CloseAgency;
