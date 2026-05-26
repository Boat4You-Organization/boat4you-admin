const Menu = ({ props, fill = 'currentColor' }: { props?: React.SVGProps<SVGSVGElement>; fill?: string }) => (
  <svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M20 17a1 1 0 1 1 0 2H10a1 1 0 1 1 0-2h10Zm0-6a1 1 0 1 1 0 2H7a1 1 0 1 1 0-2h13Zm0-6a1 1 0 1 1 0 2H4a1 1 0 0 1 0-2h16Z"
      fill={fill}
    />
  </svg>
);

export default Menu;
