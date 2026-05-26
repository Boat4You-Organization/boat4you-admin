import { SVGProps } from 'react';

const Fuel = ({
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
      d="M5.293 5.293A1 1 0 0 1 6 5h6a1 1 0 0 1 1 1v4H5V6a1 1 0 0 1 .293-.707ZM3 11V6a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v4a3 3 0 0 1 3 3v3a.5.5 0 0 0 1 0v-6a2 2 0 0 1-2-2v-.586l-.707-.707a1 1 0 0 1 1.414-1.414l1 1 2 2A.997.997 0 0 1 21 9v7a2.5 2.5 0 0 1-5 0v-3a1 1 0 0 0-1-1v7a1 1 0 1 1 0 2H3a1 1 0 1 1 0-2v-8Zm10 1v7H5v-7h8Z"
      clipRule="evenodd"
    />
  </svg>
);

export default Fuel;
