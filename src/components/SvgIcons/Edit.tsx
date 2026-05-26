import { SVGProps } from 'react';

const Edit = ({
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
      d="M16.709 2.907a3.1 3.1 0 0 1 4.384 4.385L19.829 8.56a1.006 1.006 0 0 1-.266.267l-6.855 6.879A1 1 0 0 1 12 16H9a1 1 0 0 1-1-1v-3a1 1 0 0 1 .294-.708l6.88-6.855a1.005 1.005 0 0 1 .266-.266l1.268-1.263Zm-.698 3.519L10 12.416V14h1.585l5.99-6.011-1.564-1.563Zm2.975.146-1.558-1.558.694-.692a1.1 1.1 0 1 1 1.556 1.556l-.692.694ZM3.88 6.88A3 3 0 0 1 6 6h1a1 1 0 1 1 0 2H6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-1a1 1 0 1 1 2 0v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V9a3 3 0 0 1 .879-2.121Z"
      clipRule="evenodd"
    />
  </svg>
);

export default Edit;
