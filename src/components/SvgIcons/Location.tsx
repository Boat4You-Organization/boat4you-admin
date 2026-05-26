import { SVGProps } from 'react';

const Location = ({
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
      d="M21.526 3.65A1 1 0 0 1 22 4.5V12a1 1 0 1 1-2 0V6.118l-4 2V13a1 1 0 1 1-2 0V8.118l-4-2v10.764l2.447 1.224a1 1 0 1 1-.894 1.788L9 18.618l-5.553 2.776A1 1 0 0 1 2 20.5v-13a1 1 0 0 1 .553-.894l6-3a1 1 0 0 1 .894 0L15 6.382l5.553-2.776a1 1 0 0 1 .973.043ZM8 16.881V6.118l-4 2v10.764l4-2Z"
      fill={variant === 'secondary' ? '#BDBDBD' : fill}
    />
    <circle cx="19" cy="18.5" r="1" fill="#2856FF" />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M16.777 15.174a4 4 0 0 1 5.051 6.154c-.396.397-1.135 1.049-2.182 1.935a1 1 0 0 1-1.288.004c-.998-.836-1.735-1.486-2.187-1.94a4 4 0 0 1 .607-6.153ZM19 16.5a2 2 0 0 0-1.414 3.414v.001c.295.295.762.717 1.411 1.273.693-.596 1.16-1.017 1.416-1.273v-.001A2 2 0 0 0 19 16.5Z"
      fill={variant === 'secondary' ? '#2856FF' : fill}
    />
  </svg>
);

export default Location;
