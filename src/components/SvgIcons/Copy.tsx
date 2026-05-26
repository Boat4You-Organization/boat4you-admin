import { SVGProps } from 'react';

const Copy = ({
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
      d="M5 4c-.548 0-1 .452-1 1v9.999a1.005 1.005 0 0 0 .507.87 1 1 0 1 1-.99 1.737A3.005 3.005 0 0 1 2 15.002V5c0-1.652 1.348-3 3-3h10c.562 0 1.063.15 1.49.46.406.295.68.686.884 1.054a1 1 0 0 1-1.748.972c-.137-.247-.24-.356-.31-.407C15.266 4.043 15.188 4 15 4H5Zm4.667 4A1.667 1.667 0 0 0 8 9.667v8.666A1.667 1.667 0 0 0 9.667 20h8.666A1.666 1.666 0 0 0 20 18.333V9.667A1.666 1.666 0 0 0 18.333 8H9.667Zm-2.593-.926A3.667 3.667 0 0 1 9.667 6h8.666A3.667 3.667 0 0 1 22 9.667v8.666A3.667 3.667 0 0 1 18.333 22H9.667A3.667 3.667 0 0 1 6 18.333V9.667c0-.973.386-1.905 1.074-2.593Z"
      clipRule="evenodd"
    />
  </svg>
);

export default Copy;
