import type { ReactNode } from 'react';

import { css } from '@emotion/react';
import { Grid, useTheme } from '@material-ui/core';

export interface DatasetToolbarProps {
  children: ReactNode;
}

export const DatasetToolbar = ({ children }: DatasetToolbarProps) => {
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
