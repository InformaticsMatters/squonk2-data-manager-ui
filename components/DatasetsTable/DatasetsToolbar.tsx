import type { FC } from 'react';
import { Children } from 'react';

import { Grid } from '@material-ui/core';

/**
 * Wraps elements in the DataTable toolbar and adds spacing between them.
 */
export const DatasetsToolbar: FC = ({ children }) => {
  return (
    <Grid container alignItems="center" spacing={1}>
      {Children.map(children, (child) => (
        <Grid item>{child}</Grid>
      ))}
    </Grid>
  );
};
