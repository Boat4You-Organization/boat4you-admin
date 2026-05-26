import { SVGProps } from 'react';

const Mainsail = ({
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
      d="M11.324 18.148A1.4 1.4 0 0 1 12.02 18a1.4 1.4 0 0 1 1.167.584A3.399 3.399 0 0 0 16 20a3.4 3.4 0 0 0 2.813-1.417 1 1 0 0 0-1.625-1.167 1.4 1.4 0 0 1-1.209.584 1.4 1.4 0 0 1-1.166-.584A3.401 3.401 0 0 0 12 16a3.4 3.4 0 0 0-2.812 1.417 1.401 1.401 0 0 1-1.209.584 1.4 1.4 0 0 1-1.167-.584 1 1 0 0 0-1.624 1.167A3.4 3.4 0 0 0 8 20a3.4 3.4 0 0 0 2.813-1.417 1.4 1.4 0 0 1 .51-.436ZM7.642 3.066a1 1 0 0 1 1.101.265l9 10A1 1 0 0 1 17 15H8a1 1 0 0 1-1-1V4a1 1 0 0 1 .642-.934ZM9 6.606V13h5.755L9 6.606Z"
      clipRule="evenodd"
    />
  </svg>
);

export default Mainsail;
