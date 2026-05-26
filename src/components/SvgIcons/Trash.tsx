import { SVGProps } from 'react';

const Trash = ({
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
      d="M9.086 2.586A2 2 0 0 1 10.5 2h4a2 2 0 0 1 2 2v2h4a1 1 0 1 1 0 2h-.08l-.92 11.046a3 3 0 0 1-3 2.954h-8a3 3 0 0 1-3-2.954L4.58 8H4.5a1 1 0 0 1 0-2h4V4a2 2 0 0 1 .586-1.414ZM6.586 8l.91 10.917A1 1 0 0 1 7.5 19a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1 1 1 0 0 1 .003-.083L18.413 8H6.587ZM14.5 6h-4V4h4v2Zm-4 4a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1Zm4 0a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1Z"
      fill={variant === 'secondary' ? '#FF2828' : fill}
    />
  </svg>
);

export default Trash;
