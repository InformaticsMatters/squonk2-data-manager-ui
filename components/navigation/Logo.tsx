import { css } from '@emotion/react';
import { useTheme } from '@material-ui/core';
import Link from 'next/link';

export const Logo = () => {
  const theme = useTheme();
  return (
    <Link passHref href="/">
      <a
        css={css`
          display: inline-block;
          max-height: 68px;
          padding-top: ${theme.spacing(1) / 2}px;
          padding-bottom: ${theme.spacing(1) / 2}px;
        `}
      >
        <img
          alt="Squonk (animal) logo with title text 'Squonk' and subtitle 'Data Manager'"
          css={css`
            max-height: 60px;
            width: auto;
          `}
          height="99"
          src={process.env.NEXT_PUBLIC_BASE_PATH + '/DataManager_WhiteOpt2.svg'}
          width="341"
        />
      </a>
    </Link>
  );
};
