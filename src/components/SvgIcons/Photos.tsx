import { SVGProps } from 'react';

const Photos = ({
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
      d="M3.586 3.586a2 2 0 1 1 2.828 2.828 2 2 0 0 1-2.828-2.828Zm7 0a2 2 0 1 1 2.828 2.828 2 2 0 0 1-2.828-2.828Zm7 0a2 2 0 1 1 2.828 2.828 2 2 0 0 1-2.828-2.828Zm-14 7a2 2 0 1 1 2.828 2.828 2 2 0 0 1-2.828-2.828Zm7 0a2 2 0 1 1 2.828 2.828 2 2 0 0 1-2.828-2.828Zm7 0a2 2 0 1 1 2.828 2.828 2 2 0 0 1-2.828-2.828Zm-14 7a2 2 0 1 1 2.828 2.828 2 2 0 0 1-2.828-2.828Zm7 0a2 2 0 1 1 2.828 2.828 2 2 0 0 1-2.828-2.828Zm7 0a2 2 0 1 1 2.828 2.828 2 2 0 0 1-2.828-2.828Z"
      clipRule="evenodd"
    />
  </svg>
);

export default Photos;
