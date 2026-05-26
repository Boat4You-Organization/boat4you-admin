import { SVGProps } from 'react';

const FavoriteBadge = ({
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
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.413 5.01a4 4 0 0 0-3.214 6.845l.006.006 6.796 6.731 6.797-6.73a1 1 0 1 1 1.407 1.42l-7.5 7.428a1 1 0 0 1-1.407 0L3.8 13.285a6 6 0 1 1 9.003-7.876 1 1 0 0 1-1.605 1.193 4 4 0 0 0-2.786-1.591Z"
      fill={variant === 'secondary' ? '#DCDCDC' : fill}
    />
    <circle cx="19" cy="5" r="5" fill={variant === 'secondary' ? '#2856FF' : fill} />
    <path
      d="M20.685 7.208V8h-3.016v-.792h1.096V3.16a1.016 1.016 0 0 1-.216.216 3.49 3.49 0 0 1-.328.224c-.123.07-.251.128-.384.176a1.01 1.01 0 0 1-.352.072v-.816a.931.931 0 0 0 .432-.112c.149-.075.288-.16.416-.256a2.79 2.79 0 0 0 .304-.272l.128-.128h.904v4.944h1.016Z"
      fill="#fff"
    />
  </svg>
);

export default FavoriteBadge;
