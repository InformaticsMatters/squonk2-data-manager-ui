import type { ReactNode } from "react";

import Link from "next/link";
import { useRouter } from "next/router";

export interface NavLinkChildProps {
  /**
   * Whether the link is to the currently active page
   */
  active: boolean;
}

export interface NavLinkProps {
  /**
   * Text used for the url pathname
   */
  title: string;
  /**
   * Query parameters that should be removed from those currently in the url when the link is
   * clicked.
   */
  stripQueryParameters?: string[];
  /**
   * function that returns JSX to render inside the Link tag
   */
  children: (props: NavLinkChildProps) => ReactNode;
}

/**
 * Wraps the child component in a 'next/link' tag with the href passed to the child element.
 * The path name is determined from the title text.
 * Query parameters can be optionally removed when the link is clicked.
 */
export const NavLink = ({ children, title, stripQueryParameters }: NavLinkProps) => {
  // Generate path from title text "Two Word" => "/twoword"
  // Regex removes white space
  const pathname = "/" + title.toLowerCase().replace(/ /g, "");

  const router = useRouter();
  const active = router.pathname.startsWith(pathname);

  const query = { ...router.query };
  stripQueryParameters?.forEach((param) => delete query[param]);

  return (
    <Link passHref shallow href={{ pathname, query }}>
      {children({ active })}
    </Link>
  );
};
