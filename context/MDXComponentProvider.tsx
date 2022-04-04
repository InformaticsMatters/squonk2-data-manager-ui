import type { FC } from 'react';

import { Link, Typography } from '@material-ui/core';
import { MDXProvider } from '@mdx-js/react';

export const MDXComponentProvider: FC = ({ children }) => {
  return (
    <MDXProvider
      components={{
        p: (props: unknown) => <Typography component="p" {...props} gutterBottom />,
        a: (props: unknown) => <Link {...props} variant="body1" />,
        li: (props: unknown) => <Typography {...props} component="li" />,
        h2: (props: unknown) => <Typography component="h2" {...props} gutterBottom variant="h2" />,
      }}
    >
      {children}
    </MDXProvider>
  );
};
