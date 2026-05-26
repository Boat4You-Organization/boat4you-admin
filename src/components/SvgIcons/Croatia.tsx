import { SVGProps } from 'react';

const Croatia = ({ ...props }: SVGProps<SVGSVGElement>) => (
  <svg width="21" height="15" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g clipPath="url(#a)">
      <mask id="b" maskUnits="userSpaceOnUse" x="0" y="0" width="21" height="15">
        <path d="M19 0H2a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h17a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Z" fill="#fff" />
      </mask>
      <g mask="url(#b)">
        <path d="M19 0H2a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h17a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Z" fill="#fff" />
        <path fillRule="evenodd" clipRule="evenodd" d="M0 10h21v5H0v-5Z" fill="#150A99" />
        <path fillRule="evenodd" clipRule="evenodd" d="M0 0h21v5H0V0Z" fill="red" />
        <path fillRule="evenodd" clipRule="evenodd" d="M8 4h1v1H8V4Zm2-1h1v2h-1V3Zm2 1h1v1h-1V4Z" fill="#0091E0" />
        <path fillRule="evenodd" clipRule="evenodd" d="M11 3h1v2h-1V3ZM9 3h1v2H9V3Z" fill="#150A99" />
      </g>
      <mask id="c" maskUnits="userSpaceOnUse" x="8" y="5" width="5" height="6">
        <path d="M13 8.5a2.5 2.5 0 0 1-5 0V5h5v3.5Z" fill="#fff" />
      </mask>
      <g mask="url(#c)">
        <path d="M13 8.5a2.5 2.5 0 0 1-5 0V5h5v3.5Z" fill="red" />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M9 10h1v1H9v-1Zm2 0h1v1h-1v-1Zm-1-1h1v1h-1V9ZM9 8h1v1H9V8Zm2 0h1v1h-1V8Zm-1-1h1v1h-1V7ZM9 6h1v1H9V6Zm2 0h1v1h-1V6Zm-1-1h1v1h-1V5Zm2 0h1v1h-1V5Zm0 2h1v1h-1V7Zm0 2h1v1h-1V9ZM8 9h1v1H8V9Zm0-2h1v1H8V7Zm0-2h1v1H8V5Z"
          fill="#fff"
        />
        <path
          d="M19 .5H2A1.5 1.5 0 0 0 .5 2v11A1.5 1.5 0 0 0 2 14.5h17a1.5 1.5 0 0 0 1.5-1.5V2A1.5 1.5 0 0 0 19 .5Z"
          stroke="#000"
          strokeOpacity=".1"
        />
      </g>
    </g>
    <defs>
      <clipPath id="a">
        <path fill="#fff" d="M0 0h21v15H0z" />
      </clipPath>
    </defs>
  </svg>
);

export default Croatia;
