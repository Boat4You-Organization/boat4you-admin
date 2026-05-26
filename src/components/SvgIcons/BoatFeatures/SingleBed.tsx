import { SVGProps } from 'react';

const SingleBed = ({
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
      d="M6.5 6a1 1 0 0 0-1 1v4H9V9a2 2 0 0 1 2-2h2.5a2 2 0 0 1 2 2v2h3V7a1 1 0 0 0-1-1h-11Zm14 5.041V7a3 3 0 0 0-3-3h-11a3 3 0 0 0-3 3v4.041A3 3 0 0 0 1 14v2a3 3 0 0 0 3 3h1v1a1 1 0 1 0 2 0v-1h10v1a1 1 0 1 0 2 0v-1h1a3 3 0 0 0 3-3v-2a3 3 0 0 0-2.5-2.959Zm-7-.041V9H11v2h2.5ZM3.134 13.5h17.732A1 1 0 0 0 20 13H4a1 1 0 0 0-.866.5ZM21 15.5H3v.5a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-.5Z"
      clipRule="evenodd"
    />
  </svg>
);

export default SingleBed;
