import { SVGProps } from 'react';

const ExternalLink = ({
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
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10 3.333A.667.667 0 1 1 10 2h3.333c.368 0 .667.298.667.667V6a.667.667 0 0 1-1.333 0V4.276L7.805 9.138a.667.667 0 1 1-.943-.943l4.862-4.862H10Zm-7.414.586A2 2 0 0 1 4 3.333h4a.667.667 0 0 1 0 1.334H4a.667.667 0 0 0-.667.666V12a.667.667 0 0 0 .667.667h6.667a.667.667 0 0 0 .666-.667V8a.667.667 0 0 1 1.334 0v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5.333a2 2 0 0 1 .586-1.414Z"
      fill={variant === 'secondary' ? '#2856FF' : fill}
    />
  </svg>
);

export default ExternalLink;
