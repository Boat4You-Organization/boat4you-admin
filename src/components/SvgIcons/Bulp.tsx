import { SVGProps } from 'react';

const Bulp = ({
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
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <path
      fill={variant === 'secondary' ? '#BDBDBD' : fill}
      fillRule="evenodd"
      d="M12 8a4 4 0 0 0-2.4 7.2.883.883 0 0 1 .104.09c.219.216.414.455.584.71h3.424a4.5 4.5 0 0 1 .585-.71 1 1 0 0 1 .103-.09A4 4 0 0 0 12 8Zm3.163 9.506a.999.999 0 0 0 .077-.165 2.5 2.5 0 0 1 .422-.588 6 6 0 1 0-7.324 0 2.5 2.5 0 0 1 .423.591c.02.056.045.109.075.16a2.487 2.487 0 0 1 .175 1.35A1 1 0 0 0 9 19a3 3 0 1 0 6 0 .998.998 0 0 0-.01-.146 2.5 2.5 0 0 1 .173-1.348ZM12.99 18h-1.98c.038.35.035.705-.01 1.057a1 1 0 0 0 1.997 0 4.506 4.506 0 0 1-.01-1.057Z"
      clipRule="evenodd"
    />
    <path
      fill={variant === 'secondary' ? '#2856FF' : fill}
      fillRule="evenodd"
      d="M12 2a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1ZM4.893 4.893a1 1 0 0 1 1.414 0l.7.7a1 1 0 0 1-1.414 1.414l-.7-.7a1 1 0 0 1 0-1.414Zm14.214 0a1 1 0 0 1 0 1.414l-.7.7a1 1 0 1 1-1.414-1.414l.7-.7a1 1 0 0 1 1.414 0ZM2 12a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1Zm17 0a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2h-1a1 1 0 0 1-1-1Z"
      clipRule="evenodd"
    />
  </svg>
);

export default Bulp;
