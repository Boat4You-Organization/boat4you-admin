import { SVGProps } from 'react';

const Sync = ({
  props,
  fill = 'currentColor',
  size = '1rem',
}: {
  props?: SVGProps<SVGSVGElement>;
  fill?: string;
  size?: string | number;
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <path
      fill={fill}
      fillRule="evenodd"
      d="M7.425 4.236a9.1 9.1 0 0 1 13.566 6.627 1 1 0 1 1-1.981.275A7.1 7.1 0 0 0 6.19 8H8a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1V5a1 1 0 1 1 2 0v1.273a9.1 9.1 0 0 1 2.425-2.037ZM3.862 12.01a1 1 0 0 1 1.129.853A7.1 7.1 0 0 0 17.809 16H16a1 1 0 1 1 0-2h4a1 1 0 0 1 1 1v4a1 1 0 1 1-2 0v-1.273a9.098 9.098 0 0 1-13.38.624 9.1 9.1 0 0 1-2.61-5.213 1 1 0 0 1 .852-1.128Z"
      clipRule="evenodd"
    />
  </svg>
);

export default Sync;
