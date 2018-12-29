import React from 'react';

export default function Logo(props: any) {
  return (
    // From https://www.iconfinder.com/icons/3669257/download/svg/512
    <svg
      // height="48"
      viewBox="0 0 48 48"
      // width="48"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      {...props}
    >
      <defs>
        <path d="M48 48H0V0h48v48z" id="a" />
      </defs>
      <clipPath id="b">
        <use overflow="visible" xlinkHref="#a" />
      </clipPath>
      <path
        clip-path="url(#b)"
        d="M17 29l-9 9 3 3 7-7h4l-5-5zM30 2c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm12 40.02L36 48l-5.98-6.02V39l-14.2-14.18c-.62.1-1.22.14-1.82.14v-4.32c3.32.06 7.22-1.74 9.34-4.08l2.8-3.1c.38-.42.86-.76 1.38-1 .58-.28 1.24-.46 1.92-.46h.06c2.48.02 4.5 2.04 4.5 4.52v11.5c0 1.68-.7 3.22-1.84 4.32L25 25.18v-4.54c-1.26 1.04-2.86 2.04-4.58 2.78L33 36h3l6 6.02z"
      />
    </svg>
  );
}
