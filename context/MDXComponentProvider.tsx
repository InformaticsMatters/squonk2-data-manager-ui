import type { FC, ReactNode } from "react";

import { MDXProvider } from "@mdx-js/react";
import { Typography } from "@mui/material";
import Image from "next/image";

import { NextLink } from "../components/NextLink";

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
        Image: Image as any, // Figure out why this errors after NextJS 13
      }}
    >
      {children}
    </MDXProvider>
  );
};
