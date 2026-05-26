const TimelineCircleActive = ({ props }: { props?: React.SVGProps<SVGSVGElement> }) => (
  <svg width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="10" cy="10" r="8.5" fill="#fff" stroke="#309A49" strokeWidth="3" />
    <circle cx="9.999" cy="10" r="3.333" fill="#309A49" />
  </svg>
);

export default TimelineCircleActive;
