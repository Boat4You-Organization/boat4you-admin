const List = ({
  props,
  fill = 'currentColor',
  size = '1rem',
}: {
  props?: React.SVGProps<SVGSVGElement>;
  fill?: string;
  size?: string | number;
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5 5a1 1 0 0 1 1 1v.01a1 1 0 1 1-2 0V6a1 1 0 0 1 1-1Zm3 1a1 1 0 0 1 1-1h11a1 1 0 1 1 0 2H9a1 1 0 0 1-1-1Zm-3 5a1 1 0 0 1 1 1v.01a1 1 0 1 1-2 0V12a1 1 0 0 1 1-1Zm3 1a1 1 0 0 1 1-1h11a1 1 0 1 1 0 2H9a1 1 0 0 1-1-1Zm-3 5a1 1 0 0 1 1 1v.01a1 1 0 1 1-2 0V18a1 1 0 0 1 1-1Zm3 1a1 1 0 0 1 1-1h11a1 1 0 1 1 0 2H9a1 1 0 0 1-1-1Z"
      fill={fill}
    />
  </svg>
);

export default List;
