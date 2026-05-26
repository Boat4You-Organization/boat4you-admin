import { SVGProps } from 'react';

const Facebook = ({
  props,
  fill = 'currentColor',
  size = '1rem',
}: {
  props?: SVGProps<SVGSVGElement>;
  fill?: string;
  size?: string | number;
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M22 12.061C22 6.504 17.523 2 12.001 2 6.477 2.001 2 6.504 2 12.063c0 5.02 3.657 9.182 8.436 9.937v-7.03H7.9v-2.908h2.54V9.845c0-2.52 1.493-3.913 3.777-3.913 1.095 0 2.238.196 2.238.196v2.475h-1.26c-1.242 0-1.63.776-1.63 1.572v1.887h2.773l-.442 2.907h-2.331v7.03C18.343 21.245 22 17.083 22 12.062Z"
      fill={fill}
    />
  </svg>
);

export default Facebook;
