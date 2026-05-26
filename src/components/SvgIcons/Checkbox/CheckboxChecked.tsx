import { SVGProps } from 'react';

const CheckboxChecked = ({ ...props }: SVGProps<SVGSVGElement>) => (
  <svg width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M15.501 2a4.5 4.5 0 0 1 4.5 4.5v9a4.5 4.5 0 0 1-4.5 4.5h-9a4.5 4.5 0 0 1-4.5-4.5v-9a4.5 4.5 0 0 1 4.5-4.5h9Zm-.346 6.53a.793.793 0 0 0-1.116 0l-3.717 3.716-1.575-1.575a.794.794 0 0 0-1.116 0 .793.793 0 0 0 0 1.116l2.141 2.133a.772.772 0 0 0 .55.226.775.775 0 0 0 .558-.226l4.275-4.274a.794.794 0 0 0 0-1.117Z"
      fill="#2856FF"
    />
  </svg>
);

export default CheckboxChecked;
