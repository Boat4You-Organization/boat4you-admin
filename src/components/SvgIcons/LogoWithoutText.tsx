import { SVGProps } from 'react';

const LogoWithoutText = ({ props, size = '1rem' }: { props?: SVGProps<SVGSVGElement>; size?: string | number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 16 16" fill="none" {...props}>
    <path
      fill="#BCD0FF"
      fillRule="evenodd"
      d="M.149 9.217a7.53 7.53 0 0 1 .88-5.278c.7-1.202 1.72-2.2 2.953-2.893A8.214 8.214 0 0 1 8.044 0a8.21 8.21 0 0 1 4.05 1.09 7.858 7.858 0 0 1 2.92 2.924 7.525 7.525 0 0 1 .82 5.287 7.586 7.586 0 0 1-1.064 2.55l-2.336-1.42.001-.002a4.944 4.944 0 0 0 .802-2.544 4.928 4.928 0 0 0-.643-2.588 5.146 5.146 0 0 0-1.912-1.915 5.377 5.377 0 0 0-2.653-.714 5.38 5.38 0 0 0-2.66.685 5.152 5.152 0 0 0-1.935 1.895 4.931 4.931 0 0 0-.673 2.58c.018.903.285 1.785.774 2.555l-2.352 1.396A7.581 7.581 0 0 1 .149 9.217Z"
      clipRule="evenodd"
    />
    <path
      fill="#2856FF"
      fillRule="evenodd"
      d="m8 8.889 7.015 4.433a1.45 1.45 0 0 1 .451 2.003 1.459 1.459 0 0 1-2.008.45L8 12.325l-5.458 3.45a1.457 1.457 0 0 1-2.008-.45 1.45 1.45 0 0 1 .45-2.003L8 8.889Z"
      clipRule="evenodd"
    />
  </svg>
);

export default LogoWithoutText;
