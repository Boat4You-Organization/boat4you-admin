const Target = ({ props }: { props?: React.SVGProps<SVGSVGElement> }) => (
  <svg width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g clipPath="url(#a)">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10-1a1 1 0 0 1 1 1v1.056A9 9 0 0 1 18.944 9H20a1 1 0 1 1 0 2h-1.056A9 9 0 0 1 11 18.944V20a1 1 0 1 1-2 0v-1.056A9 9 0 0 1 1.056 11H0a1 1 0 1 1 0-2h1.056A9 9 0 0 1 9 1.056V0a1 1 0 0 1 1-1Zm0 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM7.172 7.172a4 4 0 1 1 5.656 5.656 4 4 0 0 1-5.656-5.656ZM10 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"
        fill="#8EB2FF"
      />
    </g>
    <defs>
      <clipPath id="a">
        <path fill="#fff" d="M0 0h20v20H0z" />
      </clipPath>
    </defs>
  </svg>
);

export default Target;
