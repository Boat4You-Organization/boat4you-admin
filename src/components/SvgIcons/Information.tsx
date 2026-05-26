const Information = ({
  props,
  fill = 'currentColor',
  size = '1rem',
}: {
  props?: React.SVGProps<SVGSVGElement>;
  fill?: string;
  size?: string | number;
}) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4.108 4.107a8.333 8.333 0 1 1 11.785 11.785A8.333 8.333 0 0 1 4.108 4.107ZM10 3.333a6.667 6.667 0 1 0 0 13.334 6.667 6.667 0 0 0 0-13.334Z"
      fill={fill}
    />
    <path
      d="M9.166 7.5c0-.46.373-.833.834-.833h.008a.833.833 0 0 1 0 1.666H10a.833.833 0 0 1-.834-.833ZM8.333 10c0-.46.373-.834.833-.834H10c.46 0 .833.374.833.834v2.5a.833.833 0 0 1 0 1.666H10a.833.833 0 0 1-.834-.833v-2.5A.833.833 0 0 1 8.333 10Z"
      fill={fill}
    />
  </svg>
);

export default Information;
