const Check = ({
  props,
  size = '1rem',
  fill = 'currentColor',
}: {
  props?: React.SVGProps<SVGSVGElement>;
  fill?: string;
  size?: string | number;
}) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M17.256 5.244a.833.833 0 0 1 0 1.179l-8.333 8.333a.833.833 0 0 1-1.179 0l-4.167-4.167a.833.833 0 0 1 1.179-1.178l3.577 3.577 7.744-7.744a.833.833 0 0 1 1.179 0Z"
      fill={fill}
    />
  </svg>
);

export default Check;
