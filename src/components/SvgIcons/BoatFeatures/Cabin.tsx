import { SVGProps } from 'react';

const Cabin = ({
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
      d="M12 21.2a9.2 9.2 0 1 0 0-18.4 9.2 9.2 0 0 0 0 18.4Zm0 1.8c6.075 0 11-4.925 11-11S18.075 1 12 1 1 5.925 1 12s4.925 11 11 11Zm0-17.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8.5 6.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM12 20.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm6.5-3.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-12 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm12-11.25a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-12 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM5.5 12a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"
      fill={variant === 'secondary' ? '#BDBDBD' : fill}
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm4.2-6c0 .38-.05.75-.145 1.1h-8.11A4.206 4.206 0 0 1 12 7.8a4.2 4.2 0 0 1 4.2 4.2ZM12 16.2a4.188 4.188 0 0 1-3.038-1.3h6.076A4.188 4.188 0 0 1 12 16.2Z"
      fill={variant === 'secondary' ? '#2856FF' : fill}
    />
  </svg>
);

export default Cabin;
