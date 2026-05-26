import { SVGProps } from 'react';

const Medal = ({
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
      d="m15 2 .148.01a1 1 0 0 1 .771.596l3 7a1 1 0 0 1-.602 1.342l-6 2a1 1 0 0 1-.633 0l-6-2a1 1 0 0 1-.603-1.342l3-7 .069-.131A1 1 0 0 1 9 2h6Zm-2.368 8.735 1.066-.355L11.307 4h-.92l2.245 6.735Zm-5.285-1.34 3.072 1.024-1.536-4.61-1.536 3.586Zm8.25.351 1.056-.351L14.34 4h-.897l2.154 5.746Z"
    />
    <path
      fill={variant === 'secondary' ? '#2856FF' : fill}
      d="M12 11a1 1 0 0 1 .894.553l1.272 2.544 2.498.417a1 1 0 0 1 .543 1.693l-1.647 1.645.43 3.006a1 1 0 0 1-1.437 1.037L12 20.617l-2.553 1.277a1 1 0 0 1-1.437-1.037l.428-3.006-1.645-1.645a1 1 0 0 1 .543-1.693l2.497-.417 1.272-2.544.072-.121A1 1 0 0 1 12 11Zm-.606 4.447a1 1 0 0 1-.73.54l-1.084.179.627.627a1 1 0 0 1 .283.849l-.23 1.609 1.293-.646a1 1 0 0 1 .894 0l1.292.646-.23-1.61a1 1 0 0 1 .284-.848l.626-.627-1.083-.18a1 1 0 0 1-.73-.539L12 14.237l-.606 1.21Z"
    />
  </svg>
);

export default Medal;
