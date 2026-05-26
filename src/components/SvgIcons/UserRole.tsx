import { SVGProps } from 'react';

const UserRole = ({
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
      d="M5 21v-2a5 5 0 0 1 5-5h2.5a1 1 0 1 1 0 2H10a3 3 0 0 0-3 3v2a1 1 0 1 1-2 0Zm9.985-14.297A3 3 0 0 0 9 7l.015.297A3 3 0 0 0 12 10l.297-.015A3 3 0 0 0 15 7l-.015-.297Zm2.01.545a5 5 0 0 1-4.747 4.746L12 12a5 5 0 0 1-4.994-4.752L7 7a5 5 0 0 1 10 0l-.006.248Z"
    />
    <path
      fill={variant === 'secondary' ? '#2856FF' : fill}
      d="M20.001 19a1 1 0 1 0-2 0 1 1 0 0 0 2 0Zm2 0c0 .185-.02.368-.053.547l.584.337.086.055a1 1 0 0 1-.994 1.724l-.09-.047-.586-.338c-.28.24-.602.424-.947.546v.676a1 1 0 0 1-2 0v-.676a2.993 2.993 0 0 1-.947-.546l-.584.338a1 1 0 0 1-1-1.732l.582-.337a2.992 2.992 0 0 1 0-1.095l-.582-.336-.086-.055a1 1 0 0 1 .994-1.724l.092.047.584.337c.281-.24.602-.424.947-.546V15.5a1 1 0 1 1 2 0v.675c.345.122.665.306.947.546l.584-.337a1 1 0 0 1 1 1.732l-.584.336c.034.18.053.363.053.548Z"
    />
  </svg>
);

export default UserRole;
