import React from 'react';

import { css } from '@emotion/react';
import { Button } from '@material-ui/core';
import Link from 'next/link';
import { useRouter } from 'next/router';

export const NavLink: React.FC<{ title: string }> = ({ title }) => {
  // Generate path from title text "Two Word" => "/twoword"
  const pathname = '/' + title.toLowerCase().replace(/ /g, '');

  const router = useRouter();
  const active = router.pathname === pathname;
  return (
    <Link passHref href={{ pathname, query: router.query }}>
      <Button
        css={css`
          font-weight: ${active ? 'bold' : 'normal'};
          color: white;
          text-decoration: none;
          text-transform: none;
        `}
      >
        {title}
      </Button>
    </Link>
  );
};
