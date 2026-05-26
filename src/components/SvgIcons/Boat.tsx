import { SVGProps } from 'react';

const Boat = ({
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
  <svg width={size} height={size} viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.675 2.554a1 1 0 0 1 1.114.332l7 9A1 1 0 0 1 18 13.5h-7a1 1 0 0 1-1-1v-9a1 1 0 0 1 .675-.946ZM12 6.414V11.5h3.955L12 6.415Zm-3.629.158a1 1 0 0 1 .557 1.3l-2 5a1 1 0 0 1-1.856-.743l2-5a1 1 0 0 1 1.3-.557ZM2.19 14.915A1 1 0 0 1 3 14.5h18a1 1 0 0 1 .949 1.316l-1 3a1 1 0 0 1-1.898-.632l.562-1.684H4.387l.562 1.684a1 1 0 1 1-1.898.632l-1-3a1 1 0 0 1 .138-.9Z"
      fill={variant === 'secondary' ? '#BDBDBD' : fill}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.98 20.5a1.401 1.401 0 0 0-1.168.583A3.4 3.4 0 0 1 4 22.5a3.4 3.4 0 0 1-2.812-1.417 1 1 0 0 1 1.624-1.166 1.401 1.401 0 0 0 1.209.583 1.401 1.401 0 0 0 1.167-.583A3.4 3.4 0 0 1 8 18.5a3.4 3.4 0 0 1 2.813 1.417 1.401 1.401 0 0 0 1.208.583 1.4 1.4 0 0 0 1.167-.583A3.4 3.4 0 0 1 16 18.5a3.4 3.4 0 0 1 2.813 1.417 1.401 1.401 0 0 0 1.208.583 1.4 1.4 0 0 0 1.167-.583 1 1 0 0 1 1.625 1.166A3.401 3.401 0 0 1 20 22.5a3.4 3.4 0 0 1-2.812-1.417 1.399 1.399 0 0 0-1.209-.583 1.401 1.401 0 0 0-1.166.583A3.401 3.401 0 0 1 12 22.5a3.4 3.4 0 0 1-2.812-1.417 1.4 1.4 0 0 0-1.209-.583Z"
      fill={variant === 'secondary' ? '#2856FF' : fill}
    />
  </svg>
);

export default Boat;
