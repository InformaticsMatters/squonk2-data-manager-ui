import Link from 'next/link';
import { useRouter } from 'next/router';

import { css } from '@emotion/react';

export const NavLink: React.FC<{ title: string }> = ({ title }) => {
  // Generate path from title text "Two Word" => "/twoword"
  const path = '/' + title.toLowerCase().replace(/ /g, '');

  const router = useRouter();
  const active = router.pathname === path;
  return (
    <Link href={path} passHref>
      <a
        css={css`
          font-weight: ${active ? 'bold' : 'normal'};
          color: white;
          text-decoration: none;
        `}
      >
        {title}
      </a>
    </Link>
  );
};
