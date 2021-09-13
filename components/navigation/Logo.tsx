import { css } from '@emotion/react';
import { useTheme } from '@material-ui/core';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

export const Logo = () => {
  const theme = useTheme();
  const { query } = useRouter();

  return (
    <Link passHref href={{ pathname: '/', query }}>
      <a
        css={css`
          display: inline-block;
          max-height: 68px;
          padding-top: ${theme.spacing(1) / 2}px;
          padding-bottom: ${theme.spacing(1) / 2}px;
        `}
      >
        <Image
          alt="Squonk (animal) logo with title text 'Squonk' and subtitle 'Data Manager'"
          height="60"
          layout="fixed"
          src={process.env.NEXT_PUBLIC_BASE_PATH + '/DataManager_WhiteOpt2.svg'}
          width="206"
        />
      </a>
    </Link>
  );
};
