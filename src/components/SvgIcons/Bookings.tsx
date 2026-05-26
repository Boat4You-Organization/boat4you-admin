import { SVGProps } from 'react';

const Bookings = ({
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
      d="M6.793 3.793a1 1 0 0 1 1.414 1.414l-2.5 2.5a1 1 0 0 1-1.414 0l-1.5-1.5a1 1 0 0 1 1.414-1.414L5 5.586l1.793-1.793ZM10 6a1 1 0 0 1 1-1h9a1 1 0 1 1 0 2h-9a1 1 0 0 1-1-1ZM8.207 9.793a1 1 0 0 1 0 1.414l-2.5 2.5a1 1 0 0 1-1.414 0l-1.5-1.5a1 1 0 1 1 1.414-1.414l.793.793 1.793-1.793a1 1 0 0 1 1.414 0ZM10 12a1 1 0 0 1 1-1h9a1 1 0 1 1 0 2h-9a1 1 0 0 1-1-1Zm-1.793 3.793a1 1 0 0 1 0 1.414l-2.5 2.5a1 1 0 0 1-1.414 0l-1.5-1.5a1 1 0 1 1 1.414-1.414l.793.793 1.793-1.793a1 1 0 0 1 1.414 0ZM10 18a1 1 0 0 1 1-1h9a1 1 0 1 1 0 2h-9a1 1 0 0 1-1-1Z"
      clipRule="evenodd"
    />
  </svg>
);

export default Bookings;
