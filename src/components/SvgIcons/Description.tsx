import { SVGProps } from 'react';

const Description = ({
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
      d="M14 7a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2h-6a1 1 0 0 1-1-1Zm0 4a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2h-6a1 1 0 0 1-1-1Zm-9 4a1 1 0 0 1 1-1h15a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1Zm0 4a1 1 0 0 1 1-1h15a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1Z"
      clipRule="evenodd"
    />
    <path
      fill={variant === 'secondary' ? '#2856FF' : fill}
      d="M5 6.5a1 1 0 0 0-1 1V8a2 2 0 1 1-2 2V7.5a3 3 0 0 1 3-3 1 1 0 0 1 0 2Zm6 0a1 1 0 0 0-1 1V8a2 2 0 1 1-2 2V7.5a3 3 0 0 1 3-3 1 1 0 1 1 0 2Z"
    />
  </svg>
);

export default Description;
