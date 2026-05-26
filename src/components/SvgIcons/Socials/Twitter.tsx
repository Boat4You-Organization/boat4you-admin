import { SVGProps } from 'react';

const Twitter = ({
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
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3.108 3.548A1 1 0 0 1 4 3h4.267a1 1 0 0 1 .806.409l4.275 5.829 5.945-5.945a1 1 0 1 1 1.414 1.414l-6.162 6.163 6.261 8.539A1 1 0 0 1 20 21h-4.267a1 1 0 0 1-.806-.409l-4.275-5.829-5.945 5.945a1 1 0 0 1-1.414-1.414l6.162-6.163-6.261-8.539a1 1 0 0 1-.086-1.043Zm9.262 7.739a1 1 0 0 0 .108.147L18.027 19H16.24L5.973 5H7.76l4.61 6.287Z"
      fill={fill}
    />
  </svg>
);

export default Twitter;
