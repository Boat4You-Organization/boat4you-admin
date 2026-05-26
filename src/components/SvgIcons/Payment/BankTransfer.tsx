import { SVGProps } from 'react';

const BankTransfer = ({
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
      d="M11.606 2.08a1 1 0 0 1 .788 0l7 3a1 1 0 0 1-.788 1.84L12 4.087 5.394 6.919a1 1 0 0 1-.788-1.838l7-3ZM2 10a1 1 0 0 1 1-1h18a1 1 0 1 1 0 2v9a1 1 0 1 1 0 2H3a1 1 0 1 1 0-2v-9a1 1 0 0 1-1-1Zm3 1v9h14v-9H5Zm3 2a1 1 0 0 1 1 1v3a1 1 0 1 1-2 0v-3a1 1 0 0 1 1-1Zm4 0a1 1 0 0 1 1 1v3a1 1 0 1 1-2 0v-3a1 1 0 0 1 1-1Zm4 0a1 1 0 0 1 1 1v3a1 1 0 1 1-2 0v-3a1 1 0 0 1 1-1Z"
      fill={variant === 'secondary' ? '#2856FF' : fill}
    />
  </svg>
);

export default BankTransfer;
