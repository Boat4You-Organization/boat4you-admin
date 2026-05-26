import { SVGProps } from 'react';

const CreditCard = ({
  props,
  variant = 'primary',
  fill = 'currentColor',
  size = '1.5rem',
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
      d="M6 6a2 2 0 0 0-2 2v1h16V8a2 2 0 0 0-2-2H6Zm16 2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4V8Zm-2 3H4v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5ZM6 15a1 1 0 0 1 1-1h.01a1 1 0 1 1 0 2H7a1 1 0 0 1-1-1Zm4 0a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2h-2a1 1 0 0 1-1-1Z"
      fill={variant === 'secondary' ? '#2856FF' : fill}
    />
  </svg>
);

export default CreditCard;
