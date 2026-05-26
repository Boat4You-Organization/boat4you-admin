const Uk = ({ props }: { props?: React.SVGProps<SVGSVGElement> }) => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
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
          fill="#22438B"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="m6.857 8.4-4.63.062.059 4.738 38.816 26.467 4.656-.089-.087-4.708L6.857 8.4Z"
          fill="#fff"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="m4.571 8.4-2.285 2.4 41.142 28.8 2.286-2.4L4.571 8.4Z"
          fill="#C7152A"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M41.143 8.4h4.571v4.8S18.857 30.95 6.898 39.667c-.144.106-4.567.007-4.567.007l-.354-4.562L41.143 8.4Z"
          fill="#fff"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="m43.527 8.333 2.187 2.467L4.571 39.6l-2.285-2.4 41.24-28.867Z"
          fill="#C7152A"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M18.286 8.4h11.428V18h16v12h-16v9.6H18.286V30h-16V18h16V8.4Z"
          fill="#fff"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M20.571 8.4h6.857v12h18.286v7.2H27.43v12H20.57v-12H2.286v-7.2H20.57v-12Z"
          fill="#C7152A"
        />
        <path
          d="M43.428 7.2H4.572c-1.893 0-3.428 1.612-3.428 3.6v26.4c0 1.988 1.535 3.6 3.428 3.6H43.43c1.893 0 3.428-1.612 3.428-3.6V10.8c0-1.988-1.535-3.6-3.428-3.6Z"
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

export default Uk;
