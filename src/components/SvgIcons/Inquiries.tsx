import { SVGProps } from 'react';

const Inquiries = ({
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
      d="M18 22.01V22a1 1 0 1 1 2 0v.01a1 1 0 0 1-2 0Zm.328-14.51a1.829 1.829 0 0 0-3.121-1.293l-.293.293L17.5 9.085l.293-.293a1.83 1.83 0 0 0 .535-1.292Zm.099 6.558a2.98 2.98 0 0 1 1.715.165l.228.105.003.002.219.125A3.004 3.004 0 0 1 19.002 20a1 1 0 1 1-.005-2 1.003 1.003 0 0 0 .458-1.893.98.98 0 0 0-1.191.24 1.001 1.001 0 0 1-1.528-1.293 2.981 2.981 0 0 1 1.69-.996ZM5 16.414v2.585h2.586l8.499-8.5-2.586-2.585L5 16.414ZM20.328 7.5a3.832 3.832 0 0 1-1.121 2.707l-.992.99c-.003.004-.005.008-.008.01l-.01.008-9.49 9.491A1 1 0 0 1 8 21H4a1 1 0 0 1-1-1v-4l.005-.1a1 1 0 0 1 .288-.607l10.5-10.5A3.83 3.83 0 0 1 20.328 7.5Z"
    />
  </svg>
);

export default Inquiries;
