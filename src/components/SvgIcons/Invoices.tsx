import * as React from 'react';

const Invoices = ({
  props,
  fill = 'currentColor',
  size = '1rem',
}: {
  props?: React.SVGProps<SVGSVGElement>;
  fill?: string;
  size?: string | number;
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <path
      fill={fill}
      d="M15 16a1 1 0 1 1 0 2h-2a1 1 0 1 1 0-2h2Zm0-4a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2h6Zm-5-6a1 1 0 1 1 0 2H9a1 1 0 0 1 0-2h1Zm10 13a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3h7l.099.005a1 1 0 0 1 .608.288l5 5A1 1 0 0 1 20 8v11ZM16.586 7 15 5.414V7h1.586ZM6 19l.005.099A1 1 0 0 0 7 20h10a1 1 0 0 0 1-1V9h-3a2 2 0 0 1-2-2V4H7a1 1 0 0 0-1 1v14Z"
    />
  </svg>
);

export default Invoices;
