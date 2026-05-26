import { SVGProps } from 'react';

const Share = ({
  props,
  fill = 'currentColor',
  size = '1rem',
}: {
  props?: SVGProps<SVGSVGElement>;
  fill?: string;
  size?: string | number;
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <path
      fill={fill}
      fillRule="evenodd"
      d="M15.172 3.172A4 4 0 1 1 14.96 8.6l-5.04 2.597a4 4 0 0 1 0 1.606l5.04 2.597a4 4 0 1 1-.879 1.797L9.04 14.6a4 4 0 1 1 0-5.2l5.041-2.597a3.995 3.995 0 0 1 1.09-3.631Zm1.056 3.755a1.011 1.011 0 0 0-.058-.12 2 2 0 1 1 .058.12Zm-8.456 4.145A1.997 1.997 0 0 0 6 10a2 2 0 1 0 1.772 2.928 1.022 1.022 0 0 1 .058-.121 2 2 0 0 0 0-1.614 1.06 1.06 0 0 1-.058-.121Zm8.398 6.12a1.999 1.999 0 1 0 .058-.12 1.034 1.034 0 0 1-.058.12Z"
      clipRule="evenodd"
    />
  </svg>
);

export default Share;
