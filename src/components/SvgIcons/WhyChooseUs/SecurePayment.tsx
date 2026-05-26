import { SVGProps } from 'react';

const SecurePayement = ({ ...props }: SVGProps<SVGSVGElement>) => (
  <svg width="64" height="63" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M32 10.5a7.875 7.875 0 0 0-7.875 7.875v7.875h15.75v-7.875A7.875 7.875 0 0 0 32 10.5Zm-9.28-1.406a13.125 13.125 0 0 1 22.405 9.281v7.875A7.875 7.875 0 0 1 53 34.125v15.75a7.875 7.875 0 0 1-7.875 7.875h-26.25A7.875 7.875 0 0 1 11 49.875v-15.75a7.875 7.875 0 0 1 7.875-7.875v-7.875c0-3.481 1.383-6.82 3.844-9.28ZM18.874 31.5a2.625 2.625 0 0 0-2.625 2.625v15.75a2.625 2.625 0 0 0 2.625 2.625h26.25a2.625 2.625 0 0 0 2.625-2.625v-15.75a2.625 2.625 0 0 0-2.625-2.625h-26.25Z"
      fill="#BDBDBD"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M28.288 38.288a5.25 5.25 0 1 1 7.424 7.424 5.25 5.25 0 0 1-7.424-7.424Z"
      fill="#2856FF"
    />
  </svg>
);

export default SecurePayement;
