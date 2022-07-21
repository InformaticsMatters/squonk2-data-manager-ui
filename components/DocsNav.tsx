import type { ComponentProps } from "react";

import { Button } from "@mui/material";
import type Link from "next/link";
import NextLink from "next/link";
import { useRouter } from "next/router";

type Links = Record<`/${string}`, ComponentProps<typeof Link>["href"]>;

const links: Links = {
  "/docs/guided-tour": "Guided Tour",
  "/docs/how-to": "How To",
  "/docs/concepts": "Concepts guide",
};

export const DocsNav = () => {
  const router = useRouter();

  return (
    <nav aria-label="Docs" role="navigation">
      {Object.entries(links).map(([href, title]) => (
        <NextLink passHref href={href} key={href}>
          <Button disabled={router.pathname === href}>{title}</Button>
        </NextLink>
      ))}
    </nav>
  );
};
