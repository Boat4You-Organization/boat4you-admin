import { SVGProps } from 'react';

const Engine = ({
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
      d="M12.363 2.068A1 1 0 0 0 11 3v6.09L8.628 6.045a2.7 2.7 0 0 0-4.646.68l-1.914 4.912A1 1 0 0 0 3 13h6.09l-3.045 2.372a2.7 2.7 0 0 0 .68 4.646l4.912 1.914A1 1 0 0 0 13 21v-6.09l2.372 3.045a2.701 2.701 0 0 0 4.646-.68l1.914-4.912A1 1 0 0 0 21 11h-6.09l3.045-2.372a2.7 2.7 0 0 0-.68-4.646l-4.912-1.914ZM13 9.953v-5.49l3.55 1.383a.7.7 0 0 1 .175 1.204L13 9.953Zm3.95 6.772L14.047 13h5.49l-1.383 3.55a.7.7 0 0 1-1.204.175ZM6.759 7.055a.7.7 0 0 0-.913.396L4.463 11h5.49L7.05 7.275a.7.7 0 0 0-.291-.22Zm.516 9.895L11 14.047v5.49l-3.55-1.383a.7.7 0 0 1-.175-1.204Z"
      clipRule="evenodd"
    />
  </svg>
);

export default Engine;
