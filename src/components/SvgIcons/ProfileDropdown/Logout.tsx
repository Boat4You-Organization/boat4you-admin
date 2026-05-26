import { SVGProps } from 'react';

const Logout = ({ fill, ...props }: SVGProps<SVGSVGElement>) => (
  <svg width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2.399 3.232A2.5 2.5 0 0 1 4.167 2.5H10A2.5 2.5 0 0 1 12.5 5v1.667a.833.833 0 0 1-1.667 0V5A.833.833 0 0 0 10 4.167H4.167A.833.833 0 0 0 3.333 5v10a.833.833 0 0 0 .833.833H10a.834.834 0 0 0 .833-.833v-1.667a.833.833 0 0 1 1.667 0V15a2.5 2.5 0 0 1-2.5 2.5H4.167a2.5 2.5 0 0 1-2.5-2.5V5a2.5 2.5 0 0 1 .732-1.768ZM14.41 6.911a.833.833 0 0 1 1.178 0l2.5 2.5a.833.833 0 0 1 0 1.178l-2.5 2.5a.833.833 0 0 1-1.178-1.178l1.077-1.078H7.5a.833.833 0 1 1 0-1.666h7.988l-1.077-1.078a.833.833 0 0 1 0-1.178Z"
      fill={fill || '#FF2828'}
    />
  </svg>
);

export default Logout;
