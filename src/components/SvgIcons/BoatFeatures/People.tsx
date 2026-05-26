import { SVGProps } from 'react';

const People = ({
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
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.464 3.464a5 5 0 1 1 7.072 7.071 5 5 0 0 1-7.072-7.07ZM9 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM7 16a3 3 0 0 0-3 3v2a1 1 0 1 1-2 0v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2a1 1 0 1 1-2 0v-2a3 3 0 0 0-3-3H7Z"
      fill={variant === 'secondary' ? '#BDBDBD' : fill}
    />
    <path
      d="M15.031 2.882a1 1 0 0 1 1.217-.72 5 5 0 0 1 0 9.687 1 1 0 0 1-.496-1.938 3 3 0 0 0 0-5.812 1 1 0 0 1-.72-1.217ZM17.032 14.9a1 1 0 0 1 1.218-.718A5 5 0 0 1 22 18.994V21a1 1 0 1 1-2 0v-1.997a3 3 0 0 0-2.25-2.885 1 1 0 0 1-.718-1.218Z"
      fill={variant === 'secondary' ? '#2856FF' : fill}
    />
  </svg>
);

export default People;
