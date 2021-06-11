import React from 'react';

import Link from 'next/link';
import { useRouter } from 'next/router';

import { css } from '@emotion/react';
import { Button } from '@material-ui/core';

export const NavLink: React.FC<{ title: string }> = ({ title }) => {
  // Generate path from title text "Two Word" => "/twoword"
  const path = '/' + title.toLowerCase().replace(/ /g, '');

  const router = useRouter();
  const active = router.pathname === path;
  return (
    <Link passHref href={path}>
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
