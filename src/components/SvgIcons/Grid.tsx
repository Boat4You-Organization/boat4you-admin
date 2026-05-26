const Grid = ({
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
      d="M3.586 3.586A2 2 0 0 1 5 3h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 .586-1.414ZM9 5H5v4h4V5Zm4.586-1.414A2 2 0 0 1 15 3h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V5a2 2 0 0 1 .586-1.414ZM19 5h-4v4h4V5ZM3.586 13.586A2 2 0 0 1 5 13h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 .586-1.414ZM9 15H5v4h4v-4Zm4.586-1.414A2 2 0 0 1 15 13h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-4a2 2 0 0 1 .586-1.414ZM19 15h-4v4h4v-4Z"
      fill={fill}
    />
  </svg>
);

export default Grid;
