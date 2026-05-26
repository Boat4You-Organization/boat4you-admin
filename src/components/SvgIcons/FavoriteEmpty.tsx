import { SVGProps } from 'react';

const FavoriteEmpty = ({
  props,
  fill = 'currentColor',
  size = '1rem',
}: {
  props?: SVGProps<SVGSVGElement>;
  fill?: string;
  size?: string | number;
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.412 5.01a4 4 0 0 0-3.214 6.845l.006.006L12 18.592l6.797-6.73a1 1 0 0 1 .064-.06A4 4 0 1 0 12.8 6.608a1 1 0 0 1-1.602-.005 4 4 0 0 0-2.786-1.591Zm11.723 8.34-7.431 7.36a1 1 0 0 1-1.407 0L3.8 13.285a5.999 5.999 0 0 1 8.204-8.753 5.998 5.998 0 0 1 9.99 4.308 6 6 0 0 1-1.793 4.451.99.99 0 0 1-.066.06Z"
      fill={fill}
    />
  </svg>
);

export default FavoriteEmpty;
