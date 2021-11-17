import type { FC } from 'react';

import { Link, Typography } from '@material-ui/core';
import { MDXProvider } from '@mdx-js/react';

// We use mdx-js here because, despite using xdm now for rendering, it has the same API.

export const MDXComponentProvider: FC = ({ children }) => {
  return (
    <MDXProvider
      components={{
        p: (props) => <Typography {...props} gutterBottom />,
        a: (props) => <Link {...props} variant="body1" />,
        li: (props) => <Typography {...props} component="li" />,
        h2: (props) => <Typography {...props} gutterBottom variant="h2" />,
      }}
    >
      {children}
    </MDXProvider>
  );
};
