import { type FC, type ReactNode } from "react";

import { MDXProvider } from "@mdx-js/react";
import { Typography } from "@mui/material";
import Image from "next/image";

import { NextLink } from "../components/NextLink";

/**
 * A screenshot is a block in the prose rather than a word in it, so it sits on its own line with
 * room above and below instead of flush against the paragraphs either side. Every documentation
 * image is spaced here, once, rather than each `.mdx` file arranging its own — which is what makes
 * it hold for images added later without anyone having to remember.
 */
const DocsImage = (props: any) => (
  <Image
    {...props}
    style={{
      display: "block",
      // A screenshot carries its own intrinsic width, which is wider than the prose column on a
      // narrow viewport. Left unconstrained it widens the document rather than itself, and the
      // paragraphs either side then run off the edge with it.
      height: "auto",
      marginBottom: 24,
      marginTop: 24,
      maxWidth: "100%",
      ...props.style,
    }}
  />
);

export interface MDXComponentProviderProps {
  children: ReactNode;
}

export const MDXComponentProvider: FC<MDXComponentProviderProps> = ({ children }) => {
  return (
    <MDXProvider
      components={{
        p: (props: any) => <Typography component="p" {...props} gutterBottom />,
        a: (props: any) => <NextLink {...props} />,
        li: (props: any) => <Typography {...props} component="li" />,
        h2: (props: any) => <Typography component="h2" {...props} gutterBottom variant="h2" />,
        Link: NextLink,
        Image: DocsImage as any, // Figure out why this errors after NextJS 13
      }}
    >
      {children}
    </MDXProvider>
  );
};
