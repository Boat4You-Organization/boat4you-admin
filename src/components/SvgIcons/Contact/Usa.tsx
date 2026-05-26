const Usa = ({ props }: { props?: React.SVGProps<SVGSVGElement> }) => (
  <svg width="48" height="48" viewBox="00 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g clipPath="url(#a)">
      <mask id="b" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="6" width="48" height="36">
        <path
          d="M43.429 6H4.57C2.047 6 0 8.149 0 10.8v26.4C0 39.851 2.047 42 4.571 42H43.43C45.953 42 48 39.851 48 37.2V10.8C48 8.149 45.953 6 43.429 6Z"
          fill="#fff"
        />
      </mask>
      <g mask="url(#b)">
        <path
          d="M43.429 6H4.57C2.047 6 0 8.149 0 10.8v26.4C0 39.851 2.047 42 4.571 42H43.43C45.953 42 48 39.851 48 37.2V10.8C48 8.149 45.953 6 43.429 6Z"
          fill="#fff"
        />
        <path fillRule="evenodd" clipRule="evenodd" d="M0 6h20.571v16.8H0V6Z" fill="#444379" />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M2.286 8.4v2.4H4.57V8.4H2.286Zm4.571 0v2.4h2.286V8.4H6.857Zm4.571 0v2.4h2.286V8.4h-2.286ZM16 8.4v2.4h2.286V8.4H16Zm-2.286 2.4v2.4H16v-2.4h-2.286Zm-4.571 0v2.4h2.285v-2.4H9.143Zm-4.572 0v2.4h2.286v-2.4H4.571Zm-2.285 2.4v2.4H4.57v-2.4H2.286Zm4.571 0v2.4h2.286v-2.4H6.857Zm4.571 0v2.4h2.286v-2.4h-2.286Zm4.572 0v2.4h2.286v-2.4H16ZM2.286 18v2.4H4.57V18H2.286Zm4.571 0v2.4h2.286V18H6.857Zm4.571 0v2.4h2.286V18h-2.286ZM16 18v2.4h2.286V18H16Zm-2.286-2.4V18H16v-2.4h-2.286Zm-4.571 0V18h2.285v-2.4H9.143Zm-4.572 0V18h2.286v-2.4H4.571Z"
          fill="#A7B6E7"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M20.571 6v2.4H48V6H20.571Zm0 4.8v2.4H48v-2.4H20.571Zm0 4.8V18H48v-2.4H20.571Zm0 4.8v2.4H48v-2.4H20.571ZM0 25.2v2.4h48v-2.4H0ZM0 30v2.4h48V30H0Zm0 4.8v2.4h48v-2.4H0Zm0 4.8V42h48v-2.4H0Z"
          fill="#ED4C49"
        />
        <path
          d="M43.429 7.2H4.572c-1.894 0-3.429 1.612-3.429 3.6v26.4c0 1.988 1.535 3.6 3.429 3.6h38.857c1.893 0 3.428-1.612 3.428-3.6V10.8c0-1.988-1.535-3.6-3.428-3.6Z"
          stroke="#000"
          strokeOpacity=".1"
          strokeWidth="2"
        />
      </g>
    </g>
    <defs>
      <clipPath id="a">
        <path fill="#fff" transform="translate(0 6)" d="M0 0h48v36H0z" />
      </clipPath>
    </defs>
  </svg>
);

export default Usa;
