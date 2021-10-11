import type { FC } from 'react';
import { Children } from 'react';

import { css } from '@emotion/react';
import { Grid, useTheme } from '@material-ui/core';

/**
 * Wraps elements in the DataTable toolbar and adds spacing between them.
 */
export const DatasetsFilterToolbar: FC = ({ children }) => {
  const theme = useTheme();
  return (
    <Grid
      container
      alignItems="center"
      css={css`
        margin-right: ${theme.spacing(7)}px;
      `}
      spacing={1}
    >
      {Children.map(children, (child) => (
        <Grid
          item
          css={css`
            flex: 1 1 200px;
          `}
        >
          {child}
        </Grid>
      ))}
    </Grid>
  );
};
