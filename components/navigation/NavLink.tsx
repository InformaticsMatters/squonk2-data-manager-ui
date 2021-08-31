import type { ReactNode } from 'react';
import React from 'react';

import Link from 'next/link';
import { useRouter } from 'next/router';

export interface NavLinkChildProps {
  active: boolean;
}

export interface NavLinkProps {
  title: string;
  stripQueryParameters?: string[];
  children: (props: NavLinkChildProps) => ReactNode;
}

export const NavLink = ({ children, title, stripQueryParameters }: NavLinkProps) => {
  // Generate path from title text "Two Word" => "/twoword"
  const pathname = '/' + title.toLowerCase().replace(/ /g, '');

  const router = useRouter();
  const active = router.pathname.startsWith(pathname);

  const query = { ...router.query };
  stripQueryParameters?.forEach((param) => delete query[param]);

  return (
    <Link passHref href={{ pathname, query }}>
      {children({ active })}
    </Link>
  );
};
