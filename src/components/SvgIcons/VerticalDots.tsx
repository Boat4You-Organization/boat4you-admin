import { SVGProps } from 'react';

const VerticalDots = ({
  props,

  fill = 'currentColor',
  size = '1rem',
}: {
  props?: SVGProps<SVGSVGElement>;
  fill?: string;
  size?: string | number;
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" {...props}>
    <path
      fill={fill || '#000000'}
      fillRule="evenodd"
      d="M10.586 3.586a2 2 0 1 1 2.828 2.828 2 2 0 0 1-2.828-2.828Zm0 7a2 2 0 1 1 2.828 2.828 2 2 0 0 1-2.828-2.828Zm0 7a2 2 0 1 1 2.828 2.828 2 2 0 0 1-2.828-2.828Z"
      clipRule="evenodd"
    />
  </svg>
);

export default VerticalDots;
