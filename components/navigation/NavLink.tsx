import React, { FC } from 'react';

import { css } from '@emotion/react';
import { Button } from '@material-ui/core';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface NavLinkProps {
  title: string;
  stripQueryParameters?: string[];
}

export const NavLink: FC<NavLinkProps> = ({ title, stripQueryParameters }) => {
  // Generate path from title text "Two Word" => "/twoword"
  const pathname = '/' + title.toLowerCase().replace(/ /g, '');

  const router = useRouter();
  const active = router.pathname === pathname;

  const query = { ...router.query };
  stripQueryParameters?.forEach((param) => delete query[param]);

  return (
    <Link passHref href={{ pathname, query }}>
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
