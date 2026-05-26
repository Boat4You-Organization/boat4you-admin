const Search = ({
  props,
  size = '1rem',
  fill = 'currentColor',
}: {
  props?: React.SVGProps<SVGSVGElement>;
  fill?: string;
  size?: string | number;
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.939 2.609a8 8 0 0 1 9.38 12.296l5.388 5.388a1 1 0 0 1-1.414 1.414l-5.388-5.387A8 8 0 1 1 6.94 2.609ZM10 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z"
      fill={fill}
    />
  </svg>
);

export default Search;
