import type { ReactNode } from 'react';

import { css } from '@emotion/react';
import { Grid, useTheme } from '@material-ui/core';

export interface DatasetsToolbarProps {
  /**
   * Elements to be wrapped by the component.
   */
  children: ReactNode;
}

/**
 * Wraps elements in the DataTable toolbar and adds spacing between them.
 */
export const DatasetsToolbar = ({ children }: DatasetsToolbarProps) => {
  const theme = useTheme();
  return (
    <Grid
      container
      alignItems="center"
      css={css`
        gap: ${theme.spacing()}px;
      `}
      direction="row"
    >
      {children}
    </Grid>
  );
};
