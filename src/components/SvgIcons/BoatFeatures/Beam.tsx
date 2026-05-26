import { SVGProps } from 'react';

const Beam = ({
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
      fill={variant === 'secondary' ? '#BDBDBD' : fill}
      fillRule="evenodd"
      d="M4 7a1 1 0 0 1 1 1v6.872c.111.375.411.93.92 1.602.537.708 1.24 1.464 2.011 2.158.772.694 1.587 1.304 2.337 1.735.78.448 1.373.633 1.732.633.36 0 .952-.185 1.732-.633.75-.43 1.565-1.041 2.337-1.735.77-.694 1.474-1.45 2.01-2.158.51-.672.81-1.227.921-1.602V8a1 1 0 1 1 2 0v7a1 1 0 0 1-.025.223c-.181.793-.696 1.66-1.301 2.459a17.975 17.975 0 0 1-2.268 2.436c-.849.764-1.778 1.466-2.678 1.984-.872.5-1.837.898-2.728.898-.89 0-1.856-.398-2.728-.898-.9-.518-1.83-1.22-2.678-1.984a17.973 17.973 0 0 1-2.268-2.436c-.605-.8-1.12-1.666-1.3-2.46A1 1 0 0 1 3 15V8a1 1 0 0 1 1-1Z"
      clipRule="evenodd"
    />
    <path
      fill={variant === 'secondary' ? '#2856FF' : fill}
      fillRule="evenodd"
      d="M10.207 2.293a1 1 0 0 1 0 1.414L9.914 4h4.172l-.293-.293a1 1 0 0 1 1.414-1.414l2 2a1 1 0 0 1 0 1.414l-2 2a1 1 0 1 1-1.414-1.414L14.086 6H9.914l.293.293a1 1 0 0 1-1.414 1.414l-2-2a1 1 0 0 1 0-1.414l2-2a1 1 0 0 1 1.414 0Z"
      clipRule="evenodd"
    />
  </svg>
);

export default Beam;
