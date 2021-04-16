import Link from 'next/link';

import { css } from '@emotion/react';
import { useTheme } from '@material-ui/core';

export const Logo = () => {
  const theme = useTheme();
  return (
    <Link href="/" passHref>
      <a
        css={css`
          display: inline-block;
          max-height: 68px;
          padding-top: ${theme.spacing(1) / 2}px;
          padding-bottom: ${theme.spacing(1) / 2}px;
        `}
      >
        <img
          src="/DataManager_WhiteOpt2.svg"
          alt="Squonk (animal) logo with title text 'Squonk' and subtitle 'Data Manager'"
          width="341"
          height="99"
          css={css`
            max-height: 60px;
            width: auto;
          `}
        />
      </a>
    </Link>
  );
};
