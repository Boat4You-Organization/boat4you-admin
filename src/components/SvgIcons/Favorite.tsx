import { SVGProps } from 'react';

const Favorite = ({
  props,
  variant = 'primary',
  fill = 'currentColor',
  size = '1rem',
}: {
  props?: SVGProps<SVGSVGElement>;
  variant?: 'primary' | 'secondary';
  fill?: string;
  size?: string | number;
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <path
      fill={variant === 'secondary' ? '#DCDCDC' : fill}
      fillRule="evenodd"
      d="M8.411 5.011a4 4 0 0 0-3.214 6.844l.007.006L12 18.593l6.796-6.732a1 1 0 0 1 .064-.058 4 4 0 1 0-6.06-5.196 1 1 0 0 1-1.603-.004A4 4 0 0 0 8.412 5.01Zm11.724 8.34-7.431 7.36a1 1 0 0 1-1.408 0L3.8 13.285a6 6 0 0 1 8.205-8.754 5.998 5.998 0 0 1 7.947-.034 6 6 0 0 1 .25 8.793.992.992 0 0 1-.066.06Z"
      clipRule="evenodd"
    />
  </svg>
);

export default Favorite;
