import { SVGProps } from 'react';

const Whatsapp = ({
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
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M23.686 4.036a20.002 20.002 0 0 1 5.613 39.287 19.995 19.995 0 0 1-13.467-1.045l-9.48 1.692a2.001 2.001 0 0 1-2.186-2.766l2.867-6.61A20 20 0 0 1 23.686 4.037Zm.066 4A16.002 16.002 0 0 0 8.11 22.294a16.002 16.002 0 0 0 2.826 10.955 2 2 0 0 1 .199 1.947l-1.817 4.18 6.432-1.145.315-.03a2 2 0 0 1 .914.202 16.003 16.003 0 0 0 20.414-5.59 16.003 16.003 0 0 0-13.64-24.777Z"
      fill={variant === 'secondary' ? '#BDBDBD' : fill}
    />
    <path
      d="M22 20a3 3 0 0 1-.879 2.121c-.201.202-.43.369-.676.504a7.995 7.995 0 0 0 1.899 3.031 7.993 7.993 0 0 0 3.029 1.897 3 3 0 0 1 .506-.674l.22-.2A3 3 0 0 1 28 26h2a3 3 0 0 1 1.9.68l.221.199.2.22A3 3 0 0 1 30 32h-2l-.596-.016A11.998 11.998 0 0 1 16 20v-2a3 3 0 0 1 6 0v2Z"
      fill={variant === 'secondary' ? '#2856FF' : fill}
    />
  </svg>
);

export default Whatsapp;
