import { SVGProps } from 'react';

const CheckboxUnchecked = ({ ...props }: SVGProps<SVGSVGElement>) => (
  <svg width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.501 2a4.5 4.5 0 0 0-4.5 4.5v9a4.5 4.5 0 0 0 4.5 4.5h9a4.5 4.5 0 0 0 4.5-4.5v-9a4.5 4.5 0 0 0-4.5-4.5h-9Zm.45 1.35a3.6 3.6 0 0 0-3.6 3.6v8.1a3.6 3.6 0 0 0 3.6 3.6h8.1a3.6 3.6 0 0 0 3.6-3.6v-8.1a3.6 3.6 0 0 0-3.6-3.6h-8.1Z"
      fill="#DCDCDC"
    />
  </svg>
);

export default CheckboxUnchecked;
