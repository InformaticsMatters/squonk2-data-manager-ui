import type { ReactNode } from 'react';
import { Children } from 'react';

import { css } from '@emotion/react';
import { Grid, useTheme } from '@material-ui/core';

export interface DatasetsFilterToolbarProps {
  /**
   * Filter which can be shrinked and placed alongside other filters in one row.
   */
  shrinkableFilters?: ReactNode | ReactNode[];
  /**
   * Filter which should occupy one whole row.
   */
  fullWidthFilters?: ReactNode | ReactNode[];
}

/**
 * Wraps elements in the DataTable toolbar and adds spacing between them. Filters are categorized
 * into 2 groups - those which can be shrinked and placed alongside other filters, and those which
 * should occupy one whole row.
 */
export const DatasetsFilterToolbar = ({
  shrinkableFilters,
  fullWidthFilters,
}: DatasetsFilterToolbarProps) => {
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
      {Children.map(shrinkableFilters, (child) => (
        <Grid
          item
          css={css`
            flex: 1 1 200px;
          `}
        >
          {child}
        </Grid>
      ))}
      {Children.map(fullWidthFilters, (child) => (
        <Grid
          item
          css={css`
            flex: 1 1 100%;
          `}
        >
          {child}
        </Grid>
      ))}
    </Grid>
  );
};
