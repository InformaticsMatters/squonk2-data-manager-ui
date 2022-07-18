import type { AnchorHTMLAttributes, DetailedHTMLProps, FC } from "react";

import { MDXProvider } from "@mdx-js/react";
import { Link, Typography } from "@mui/material";
import NextLink from "next/link";

type LinkProps = DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>;

export const MDXComponentProvider: FC = ({ children }) => {
  return (
    <MDXProvider
      components={{
        p: (props: any) => <Typography component="p" {...props} gutterBottom />,
        a: (props: any) => (
          <Link rel="noopener noreferrer" target="_blank" variant="body1" {...props} />
        ),
        li: (props: any) => <Typography {...props} component="li" />,
        h2: (props: any) => <Typography component="h2" {...props} gutterBottom variant="h2" />,
        InternalLink: ({ href, children, ref: _ref, ...props }: LinkProps) => (
          <NextLink passHref href={href ?? "/"} {...props}>
            <Link {...props}>{children}</Link>
          </NextLink>
        ),
      }}
    >
      {children}
    </MDXProvider>
  );
};
