import { SVGProps } from 'react';

const About = ({
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
  <svg width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M9 7H4v12h16V7h-5a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2Zm2-3v3h2V4h-2Zm4 1h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5V4a2 2 0 0 1 2-2h2l.197.01A2 2 0 0 1 15 4v1Z"
      fill={variant === 'secondary' ? '#DCDCDC' : fill}
    />
    <path
      d="m10 11 .102.005A1 1 0 0 1 11 12v4a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-4l.005-.102A1 1 0 0 1 7 11h3Zm6 4a1 1 0 1 1 0 2h-2a1 1 0 1 1 0-2h2Zm-8 0h1v-2H8v2Zm10-4a1 1 0 1 1 0 2h-4a1 1 0 1 1 0-2h4Z"
      fill={variant === 'secondary' ? '#2856FF' : fill}
    />
  </svg>
);

export default About;
