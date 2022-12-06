import type { FC, ReactNode } from "react";

import { MDXProvider } from "@mdx-js/react";
import { Link, Typography } from "@mui/material";
import Image from "next/image";
import type { LinkProps } from "next/link";
import NextLink from "next/link";
import type { Route } from "nextjs-routes";

export interface MDXComponentProviderProps {
  children: ReactNode;
}

export const MDXComponentProvider: FC<MDXComponentProviderProps> = ({ children }) => {
  return (
    <MDXProvider
      components={{
        p: (props: any) => <Typography component="p" {...props} gutterBottom />,
        a: (props: any) => (
          <Link rel="noopener noreferrer" target="_blank" variant="body1" {...props} />
        ),
        li: (props: any) => <Typography {...props} component="li" />,
        h2: (props: any) => <Typography component="h2" {...props} gutterBottom variant="h2" />,
        InternalLink: ({ href, children, ...props }: LinkProps<Route>) => (
          <NextLink legacyBehavior passHref href={href} {...props}>
            <Link {...props}>{children}</Link>
          </NextLink>
        ),
        Image: Image as any, // Figure out why this errors after NextJS 13
      }}
    >
      {children}
    </MDXProvider>
  );
};
