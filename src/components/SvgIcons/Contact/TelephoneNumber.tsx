import { SVGProps } from 'react';

const TelephoneNumber = ({
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
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="m42 4 .205.01A2 2 0 0 1 44 6v16a2 2 0 0 1-2 2h-5.527l-7.578 3.79A2 2 0 0 1 26 26v-2h-4a2 2 0 0 1-2-2V6l.01-.205A2 2 0 0 1 22 4h20ZM24 20h4a2 2 0 0 1 2 2v.764l5.105-2.553.213-.092c.218-.079.449-.119.682-.119h4V8H24v12Z"
      fill={variant === 'secondary' ? '#BDBDBD' : fill}
    />
    <path
      d="M8 40V12a4 4 0 0 1 4-4h4a2 2 0 1 1 0 4h-4v28h16v-8a2 2 0 1 1 4 0v8a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4Zm10-3.98V36a2 2 0 1 1 4 0v.02a2 2 0 1 1-4 0Z"
      fill={variant === 'secondary' ? '#2856FF' : fill}
    />
  </svg>
);

export default TelephoneNumber;
